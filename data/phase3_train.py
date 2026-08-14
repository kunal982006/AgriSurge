"""
Phase 9–12 & 13: Model Training, Comparison, Evaluation, Explainability, Save

Target: yield_kg_ha (regression)
Models compared:
  1. Dummy Regressor (baseline)
  2. Linear Regression
  3. Random Forest Regressor
  4. Gradient Boosting Regressor
  5. HistGradientBoosting Regressor

Uses chronological split (no random shuffle of years).
"""
import os
import sys
import json
import warnings
import datetime
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib

from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    HistGradientBoostingRegressor,
)
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.inspection import permutation_importance

# ── Paths ──────────────────────────────────────────────────────────────────
PROCESSED_DATASET = "data/processed/agrisurge_training_dataset.csv"
MODEL_DIR         = "ml/models"
MODEL_PATH        = os.path.join(MODEL_DIR, "agrisurge_model.joblib")
METADATA_PATH     = os.path.join(MODEL_DIR, "model_metadata.json")
COMPARISON_CSV    = "data/model_comparison.csv"
EVAL_REPORT_PATH  = "data/model_evaluation_report.md"

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs("data", exist_ok=True)

# ── Feature lists ─────────────────────────────────────────────────────────
CATEGORICAL_FEATURES = ["district", "crop", "season", "state"]
NUMERICAL_FEATURES = [
    "area_1000ha",
    "prev_yield_kg_ha",
    "prev2_yield_kg_ha",
    "prev_area_1000ha",
    "hist5y_mean_yield",
]
# IMD features — optional (only non-null rows have them)
IMD_FEATURES = [
    "annual_rainfall", "kharif_rainfall", "rabi_rainfall",
    "rainy_days", "dry_days", "max_daily_rainfall",
    "max_consecutive_rainy_days", "max_consecutive_dry_days",
]
TARGET = "yield_kg_ha"


def load_split(path: str):
    df = pd.read_csv(path)
    print(f"  Loaded dataset: {len(df)} rows × {len(df.columns)} cols")

    # Decide whether to include IMD features (use them where available)
    has_imd = all(c in df.columns for c in IMD_FEATURES)
    imd_coverage = df["annual_rainfall"].notna().mean() if "annual_rainfall" in df.columns else 0
    print(f"  IMD rainfall present: {has_imd}  coverage: {imd_coverage:.1%}")

    if has_imd and imd_coverage < 0.05:
        print("  IMD coverage <5% — excluding IMD features from model (too sparse).")
        has_imd = False

    num_feats = NUMERICAL_FEATURES.copy()
    if has_imd:
        num_feats += IMD_FEATURES

    all_feats = CATEGORICAL_FEATURES + num_feats

    # Drop rows missing target or key lag features
    keep_cols = all_feats + [TARGET, "split", "year", "district", "crop"]
    # Deduplicate while preserving order (district/crop appear in both all_feats and extra cols)
    keep_cols = list(dict.fromkeys(c for c in keep_cols if c in df.columns))
    df = df[keep_cols].copy()

    # Drop rows where target is missing
    df = df.dropna(subset=[TARGET])

    train = df[df["split"] == "train"]
    val   = df[df["split"] == "validation"]
    test  = df[df["split"] == "test"]

    print(f"  Split → train: {len(train)}, val: {len(val)}, test: {len(test)}")
    return train, val, test, all_feats, num_feats, has_imd


def make_preprocessor(cat_feats, num_feats, df_train):
    """Build a ColumnTransformer that handles missing values cleanly."""
    # Ordinal encoder for categoricals (unknown → most frequent)
    cat_transformer = OrdinalEncoder(
        handle_unknown="use_encoded_value",
        unknown_value=-1,
    )
    # Standard scaler for numerics (impute median for missing IMD)
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import Pipeline as SkPipeline
    num_transformer = SkPipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    preprocessor = ColumnTransformer([
        ("cat", cat_transformer, [c for c in cat_feats if c in df_train.columns]),
        ("num", num_transformer, [c for c in num_feats if c in df_train.columns]),
    ], remainder="drop")
    return preprocessor


def eval_metrics(y_true, y_pred, label=""):
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    return {"model": label, "MAE": round(mae, 2), "RMSE": round(rmse, 2), "R2": round(r2, 4)}


def feature_importance_table(pipeline, cat_feats, num_feats, X_val, y_val, n=15):
    """Use permutation importance on the validation set for model-agnostic ranking."""
    perm = permutation_importance(pipeline, X_val, y_val,
                                  n_repeats=10, random_state=42, scoring="r2")
    all_feats = [c for c in cat_feats] + [c for c in num_feats]
    # Filter to those actually used
    used = [c for c in all_feats if c in X_val.columns]
    imp_df = pd.DataFrame({
        "feature":    used,
        "importance": perm.importances_mean[:len(used)],
        "std":        perm.importances_std[:len(used)],
    }).sort_values("importance", ascending=False).head(n).reset_index(drop=True)
    return imp_df


def run_training():
    print("=== Phases 9–13: Model Training & Evaluation ===\n")

    if not os.path.exists(PROCESSED_DATASET):
        print(f"ERROR: {PROCESSED_DATASET} not found. Run phase2_build_dataset.py first.")
        sys.exit(1)

    train, val, test, all_feats, num_feats, has_imd = load_split(PROCESSED_DATASET)
    cat_feats_used = [c for c in CATEGORICAL_FEATURES if c in train.columns]
    num_feats_used = [c for c in num_feats if c in train.columns]
    all_feats_used = cat_feats_used + num_feats_used

    X_train = train[all_feats_used]
    y_train = train[TARGET]
    X_val   = val[all_feats_used]
    y_val   = val[TARGET]
    X_test  = test[all_feats_used]
    y_test  = test[TARGET]

    preprocessor = make_preprocessor(cat_feats_used, num_feats_used, train)

    # ── Models ──────────────────────────────────────────────────────────
    MODELS = {
        "DummyRegressor (Baseline)": DummyRegressor(strategy="mean"),
        "Ridge Regression":          Ridge(alpha=10.0),
        "Random Forest":             RandomForestRegressor(
                                         n_estimators=300, max_depth=10,
                                         min_samples_leaf=4, random_state=42, n_jobs=-1),
        "Gradient Boosting":         GradientBoostingRegressor(
                                         n_estimators=300, max_depth=4, learning_rate=0.05,
                                         subsample=0.8, random_state=42),
        "HistGradientBoosting":      HistGradientBoostingRegressor(
                                         max_iter=300, max_depth=6, learning_rate=0.05,
                                         random_state=42),
    }

    results_val  = []
    results_test = []
    pipelines    = {}

    print("\n  Training models …\n")
    for name, model in MODELS.items():
        pipe = Pipeline([
            ("preprocessor", preprocessor),
            ("regressor",    model),
        ])
        pipe.fit(X_train, y_train)
        val_metrics  = eval_metrics(y_val,  pipe.predict(X_val),  name)
        test_metrics = eval_metrics(y_test, pipe.predict(X_test), name)
        results_val.append(val_metrics)
        results_test.append(test_metrics)
        pipelines[name] = pipe
        print(f"  {name}:")
        print(f"    Val  → MAE={val_metrics['MAE']:.1f}  RMSE={val_metrics['RMSE']:.1f}  R²={val_metrics['R2']:.3f}")
        print(f"    Test → MAE={test_metrics['MAE']:.1f}  RMSE={test_metrics['RMSE']:.1f}  R²={test_metrics['R2']:.3f}")

    # ── Select best by validation R² ─────────────────────────────────────
    val_df  = pd.DataFrame(results_val)
    test_df = pd.DataFrame(results_test)

    best_row  = val_df.sort_values("R2", ascending=False).iloc[0]
    best_name = best_row["model"]
    best_pipe = pipelines[best_name]
    best_test = test_df[test_df["model"] == best_name].iloc[0]

    print(f"\n  ── Best model (by Val R²): {best_name} ──")
    print(f"     Val  MAE={best_row['MAE']}  RMSE={best_row['RMSE']}  R²={best_row['R2']}")
    print(f"     Test MAE={best_test['MAE']}  RMSE={best_test['RMSE']}  R²={best_test['R2']}")

    # ── Feature Importance (permutation on val set) ───────────────────────
    print("\n  Computing permutation importance on validation set …")
    try:
        imp_df = feature_importance_table(best_pipe, cat_feats_used, num_feats_used, X_val, y_val)
    except Exception as e:
        print(f"  Warning: permutation importance failed: {e}")
        imp_df = pd.DataFrame()

    # ── Save comparison CSV ───────────────────────────────────────────────
    comparison_df = val_df.merge(
        test_df.rename(columns={"MAE": "Test_MAE", "RMSE": "Test_RMSE", "R2": "Test_R2"}),
        on="model"
    )
    comparison_df.to_csv(COMPARISON_CSV, index=False)
    print(f"\n  Saved model comparison → {COMPARISON_CSV}")

    # ── Save best model ───────────────────────────────────────────────────
    joblib.dump(best_pipe, MODEL_PATH)
    print(f"  Saved best model → {MODEL_PATH}")

    # ── Save metadata ─────────────────────────────────────────────────────
    metadata = {
        "model_version":        "2.0.0",
        "model_type":           best_name,
        "trained_at":           datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "target":               TARGET,
        "categorical_features": cat_feats_used,
        "numerical_features":   num_feats_used,
        "imd_features_used":    has_imd,
        "train_rows":           len(train),
        "val_rows":             len(val),
        "test_rows":            len(test),
        "val_metrics":          best_row.to_dict(),
        "test_metrics":         best_test.to_dict(),
        "top_features":         imp_df.to_dict(orient="records") if not imp_df.empty else [],
        "geographic_level":     "district",
        "year_range":           f"{train['year'].min()}-{test['year'].max()}",
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"  Saved metadata → {METADATA_PATH}")

    # ── Write evaluation report ───────────────────────────────────────────
    report = build_eval_report(val_df, test_df, best_name, best_row, best_test,
                               imp_df, train, val, test, cat_feats_used, num_feats_used, has_imd)
    with open(EVAL_REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"  Saved evaluation report → {EVAL_REPORT_PATH}")

    return metadata


def build_eval_report(val_df, test_df, best_name, best_val, best_test,
                       imp_df, train, val, test, cat_feats, num_feats, has_imd):
    lines = []
    a = lines.append
    a("# AgriSurge — Model Evaluation Report\n")
    a(f"> Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}\n")

    a("## 1. Dataset Summary\n")
    a(f"| Property | Value |")
    a(f"|---|---|")
    a(f"| Training rows | {len(train):,} |")
    a(f"| Validation rows | {len(val):,} |")
    a(f"| Test rows | {len(test):,} |")
    a(f"| Train years | {train['year'].min()} – {train['year'].max()} |")
    a(f"| Val years | {val['year'].min()} – {val['year'].max()} |")
    a(f"| Test years | {test['year'].min()} – {test['year'].max()} |")
    a(f"| Crops | {sorted(train['crop'].unique().tolist())} |")
    a(f"| Districts | {train['district'].nunique()} |")
    a(f"| IMD Rainfall Features | {'Yes' if has_imd else 'No (insufficient overlap)'} |\n")

    a("## 2. Model Comparison (Validation Set)\n")
    a("| Model | MAE (Kg/ha) | RMSE (Kg/ha) | R² |")
    a("|---|---|---|---|")
    for _, row in val_df.sort_values("R2", ascending=False).iterrows():
        marker = " [BEST]" if row["model"] == best_name else ""
        a(f"| {row['model']}{marker} | {row['MAE']} | {row['RMSE']} | {row['R2']} |")
    a("")

    a("## 3. Best Model — Test Set Performance\n")
    a(f"**Model:** {best_name}\n")
    a(f"| Metric | Value |")
    a(f"|---|---|")
    a(f"| MAE | {best_test['MAE']} Kg/ha |")
    a(f"| RMSE | {best_test['RMSE']} Kg/ha |")
    a(f"| R² | {best_test['R2']} |")
    a("")

    a("## 4. Feature Importance (Permutation — Validation Set)\n")
    if not imp_df.empty:
        a("| Feature | Importance (ΔR²) | Std |")
        a("|---|---|---|")
        for _, row in imp_df.iterrows():
            a(f"| {row['feature']} | {row['importance']:.4f} | {row['std']:.4f} |")
    else:
        a("_Permutation importance not computed._")
    a("")

    a("## 5. Why This Model Was Selected\n")
    a(f"The **{best_name}** was selected based on the highest R² on the held-out validation set "
      f"(years 2006–2012). It outperformed the dummy baseline and shows a better balance of "
      f"bias and variance than simpler linear models for this agricultural yield regression task.\n")

    a("## 6. Limitations\n")
    a("| Limitation | Detail |")
    a("|---|---|")
    a("| Geographic level | District-level only. Not village or farm level. |")
    a("| No crop variety | ICRISAT does not contain variety-level data. |")
    a("| IMD overlap | IMD files (2015–2025) overlap only 3 years of ICRISAT (2015–2017). |")
    a("| No soil data | Soil type not in any source dataset. |")
    a("| No temperature | No temperature time series in current datasets. |")
    a("| Target is yield | No genuine crop-failure binary label exists. |")
    a("| Time series | Crop yields are serially correlated; cross-validation requires care. |")
    a("")

    a("## 7. Risk Score Derivation Methodology\n")
    a("The model predicts `yield_kg_ha`. A risk score is derived as:\n")
    a("```")
    a("yield_deviation = (predicted_yield - historical_mean_yield) / historical_mean_yield")
    a("risk_score = clip(1.0 - yield_deviation, 0, 1)  # higher deviation = higher risk")
    a("```")
    a("This is NOT a probability of failure. It is a relative yield-deviation score.")
    a("A `yield_deviation < -0.25` (>25% shortfall) triggers HIGH risk classification.\n")

    a("## 8. Additional Data Required\n")
    a("- Multi-decade district-level weather (temperature, humidity) for Maharashtra")
    a("- Crop variety-level yield records")
    a("- Farm-level satellite NDVI / soil moisture time series")
    a("- Historical crop insurance claim data (for a real crop-failure classification target)\n")

    return "\n".join(lines)


if __name__ == "__main__":
    run_training()
