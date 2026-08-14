"""
AgriSurge V2 — Model Training & Evaluation

Uses the Hybrid approach (Option B from feasibility report):
  - All 13,169 V1 records
  - 14 new IMD weather features (populated 5.9%, NaN elsewhere)
  - HistGradientBoostingRegressor (native NaN handling)
  - Chronological split: Train 1967-2012 / Val 2013-2016 / Test 2017
  - Test set has 100% weather coverage

Saves:
  - ml/models/agrisurge_model_v2.joblib   (V1 untouched)
  - ml/models/model_v2_metadata.json
  - data/v2_model_evaluation_report.md    (includes V1 vs V2 comparison)

DO NOT modify or delete V1 artifacts.
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
from sklearn.linear_model import Ridge
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    HistGradientBoostingRegressor,
)
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline as SkPipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.inspection import permutation_importance

# ── Paths ──────────────────────────────────────────────────────────────────
V2_DATASET    = "data/processed/agrisurge_v2_training_dataset.csv"
V1_REPORT     = "data/model_evaluation_report.md"
V1_META_PATH  = "ml/models/model_metadata.json"
MODEL_DIR     = "ml/models"
V2_MODEL_PATH = os.path.join(MODEL_DIR, "agrisurge_model_v2.joblib")
V2_META_PATH  = os.path.join(MODEL_DIR, "model_v2_metadata.json")
V2_REPORT     = "data/v2_model_evaluation_report.md"

os.makedirs(MODEL_DIR, exist_ok=True)

# ── Feature definitions ────────────────────────────────────────────────────
CAT_FEATURES = ["district", "crop", "season", "state"]

# V1 numerical features (all preserved)
V1_NUM_FEATURES = [
    "area_1000ha",
    "prev_yield_kg_ha",
    "prev2_yield_kg_ha",
    "prev_area_1000ha",
    "hist5y_mean_yield",
]

# New V2 weather features (will be NaN where IMD is unavailable)
V2_WEATHER_FEATURES = [
    "v2_annual_rainfall",
    "v2_kharif_rainfall",
    "v2_rabi_rainfall",
    "v2_rainy_days",
    "v2_dry_days",
    "v2_max_daily_rainfall",
    "v2_max_consecutive_rainy_days",
    "v2_max_consecutive_dry_days",
    "v2_kharif_rf_7d_preharvest",
    "v2_kharif_rf_30d_preharvest",
    "v2_kharif_rf_90d_preharvest",
    "v2_rabi_rf_7d_preharvest",
    "v2_rabi_rf_30d_preharvest",
    "v2_rabi_rf_90d_preharvest",
]

ALL_NUM_FEATURES = V1_NUM_FEATURES + V2_WEATHER_FEATURES
TARGET = "yield_kg_ha"


def load_and_split(path: str):
    """
    Load V2 dataset with REVISED chronological split:
      Train      : 1967 – 2012
      Validation : 2013 – 2016  (includes 2015-2016 IMD weather)
      Test       : 2017         (100% IMD weather coverage)
    """
    df = pd.read_csv(path)
    print(f"  Loaded: {len(df)} rows x {len(df.columns)} cols")

    # Validate expected columns
    missing_v2 = [c for c in V2_WEATHER_FEATURES if c not in df.columns]
    if missing_v2:
        print(f"  ERROR: Missing V2 columns: {missing_v2}")
        sys.exit(1)

    # Override split with V2-specific chronological cut
    df["v2_split"] = "train"
    df.loc[df["year"].between(2013, 2016), "v2_split"] = "validation"
    df.loc[df["year"] == 2017,             "v2_split"] = "test"

    # Deduplicate keep_cols
    all_feats  = CAT_FEATURES + ALL_NUM_FEATURES
    keep_cols  = list(dict.fromkeys(
        c for c in all_feats + [TARGET, "v2_split", "year", "district", "crop"]
        if c in df.columns
    ))
    df = df[keep_cols].dropna(subset=[TARGET])

    train = df[df["v2_split"] == "train"]
    val   = df[df["v2_split"] == "validation"]
    test  = df[df["v2_split"] == "test"]

    print(f"\n  V2 chronological split:")
    for label, sub in [("train", train), ("validation", val), ("test", test)]:
        n_wx = sub["v2_annual_rainfall"].notna().sum()
        print(f"    {label}: {len(sub)} rows  "
              f"(years {sub['year'].min()}-{sub['year'].max()})  "
              f"weather={n_wx}/{len(sub)} ({n_wx/len(sub)*100:.0f}%)")

    return train, val, test


def make_preprocessor():
    """
    Build preprocessor:
      - Categoricals: OrdinalEncoder (unknown = -1)
      - Numericals: median imputation (handles V2 weather NaNs) + StandardScaler
    Note: HistGradientBoosting handles NaN natively, but other models need imputation.
    """
    cat_pipe = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    num_pipe = SkPipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])
    return ColumnTransformer([
        ("cat", cat_pipe, CAT_FEATURES),
        ("num", num_pipe, ALL_NUM_FEATURES),
    ], remainder="drop")


def metrics(y_true, y_pred, label):
    return {
        "model":  label,
        "MAE":   round(float(mean_absolute_error(y_true, y_pred)), 2),
        "RMSE":  round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 2),
        "R2":    round(float(r2_score(y_true, y_pred)), 4),
    }


def run():
    print("=== AgriSurge V2 — Model Training ===\n")

    if not os.path.exists(V2_DATASET):
        print(f"ERROR: {V2_DATASET} not found. Run phase_v2_build_dataset.py first.")
        sys.exit(1)

    train, val, test = load_and_split(V2_DATASET)

    X_train = train[CAT_FEATURES + ALL_NUM_FEATURES]
    y_train = train[TARGET]
    X_val   = val[CAT_FEATURES + ALL_NUM_FEATURES]
    y_val   = val[TARGET]
    X_test  = test[CAT_FEATURES + ALL_NUM_FEATURES]
    y_test  = test[TARGET]

    preprocessor = make_preprocessor()

    # ── Models ─────────────────────────────────────────────────────────────
    MODELS = {
        "DummyRegressor (Baseline)": DummyRegressor(strategy="mean"),
        "Ridge Regression":          Ridge(alpha=10.0),
        "Random Forest":             RandomForestRegressor(
                                         n_estimators=300, max_depth=10,
                                         min_samples_leaf=4, random_state=42, n_jobs=-1),
        "Gradient Boosting":         GradientBoostingRegressor(
                                         n_estimators=300, max_depth=4,
                                         learning_rate=0.05, subsample=0.8, random_state=42),
        "HistGradientBoosting":      HistGradientBoostingRegressor(
                                         max_iter=400, max_depth=6,
                                         learning_rate=0.04, random_state=42),
    }

    val_results  = []
    test_results = []
    pipelines    = {}

    print("\n  Training V2 models...\n")
    for name, model in MODELS.items():
        pipe = Pipeline([
            ("preprocessor", preprocessor),
            ("regressor",    model),
        ])
        pipe.fit(X_train, y_train)

        vm = metrics(y_val,  pipe.predict(X_val),  name)
        tm = metrics(y_test, pipe.predict(X_test), name)

        val_results.append(vm)
        test_results.append(tm)
        pipelines[name] = pipe

        print(f"  {name}:")
        print(f"    Val  -> MAE={vm['MAE']:.1f}  RMSE={vm['RMSE']:.1f}  R2={vm['R2']:.4f}")
        print(f"    Test -> MAE={tm['MAE']:.1f}  RMSE={tm['RMSE']:.1f}  R2={tm['R2']:.4f}")

    # ── Select best by Val R2 ───────────────────────────────────────────────
    val_df  = pd.DataFrame(val_results)
    test_df = pd.DataFrame(test_results)

    best_row  = val_df.sort_values("R2", ascending=False).iloc[0]
    best_name = best_row["model"]
    best_pipe = pipelines[best_name]
    best_test = test_df[test_df["model"] == best_name].iloc[0]

    print(f"\n  Best model (by Val R2): {best_name}")
    print(f"    Val  MAE={best_row['MAE']}  RMSE={best_row['RMSE']}  R2={best_row['R2']}")
    print(f"    Test MAE={best_test['MAE']}  RMSE={best_test['RMSE']}  R2={best_test['R2']}")

    # ── Permutation importance ─────────────────────────────────────────────
    print("\n  Computing permutation importance...")
    try:
        perm = permutation_importance(
            best_pipe, X_val, y_val,
            n_repeats=10, random_state=42, scoring="r2"
        )
        feat_names = CAT_FEATURES + ALL_NUM_FEATURES
        imp_df = pd.DataFrame({
            "feature":    feat_names,
            "importance": perm.importances_mean,
            "std":        perm.importances_std,
        }).sort_values("importance", ascending=False).reset_index(drop=True)
        print(f"  Top 10 features:\n{imp_df.head(10).to_string(index=False)}")
    except Exception as e:
        print(f"  Warning: permutation importance failed: {e}")
        imp_df = pd.DataFrame()

    # ── Save V2 model (V1 untouched) ───────────────────────────────────────
    joblib.dump(best_pipe, V2_MODEL_PATH)
    print(f"\n  Saved V2 model -> {V2_MODEL_PATH}")

    # ── Load V1 metadata for comparison ───────────────────────────────────
    v1_meta = {}
    if os.path.exists(V1_META_PATH):
        with open(V1_META_PATH) as f:
            v1_meta = json.load(f)

    # ── Save V2 metadata ───────────────────────────────────────────────────
    metadata = {
        "model_version":         "2.0.0",
        "model_type":            best_name,
        "trained_at":            datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "target":                TARGET,
        "categorical_features":  CAT_FEATURES,
        "v1_numerical_features": V1_NUM_FEATURES,
        "v2_weather_features":   V2_WEATHER_FEATURES,
        "total_features":        len(CAT_FEATURES) + len(ALL_NUM_FEATURES),
        "train_rows":            len(train),
        "val_rows":              len(val),
        "test_rows":             len(test),
        "test_year":             2017,
        "weather_coverage_pct":  round(779 / 13169 * 100, 1),
        "val_metrics":           best_row.to_dict(),
        "test_metrics":          best_test.to_dict(),
        "top_features":          imp_df.head(15).to_dict(orient="records") if not imp_df.empty else [],
        "v1_test_r2":            v1_meta.get("test_metrics", {}).get("R2", "N/A"),
        "v2_test_r2":            best_test["R2"],
        "geographic_level":      "district",
        "weather_note":          "IMD features populated for 2015-2017 only (5.9% of rows); NaN elsewhere handled natively.",
    }
    with open(V2_META_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"  Saved V2 metadata -> {V2_META_PATH}")

    # ── Write V2 evaluation report ─────────────────────────────────────────
    report = build_report(val_df, test_df, best_name, best_row, best_test,
                          imp_df, train, val, test, v1_meta)
    with open(V2_REPORT, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"  Saved V2 report -> {V2_REPORT}")

    return metadata


def build_report(val_df, test_df, best_name, best_val, best_test,
                 imp_df, train, val, test, v1_meta):
    lines = []
    a = lines.append

    a("# AgriSurge V2 — Model Evaluation Report\n")
    a(f"> Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}")
    a("> V2 Hybrid Approach: All 13,169 ICRISAT records + 14 real IMD weather features\n")

    # Dataset summary
    a("## 1. Dataset\n")
    a("| Property | Value |")
    a("|---|---|")
    a(f"| Total rows | {len(train)+len(val)+len(test):,} |")
    a(f"| Train (1967-2012) | {len(train):,} |")
    a(f"| Validation (2013-2016) | {len(val):,} |")
    a(f"| Test (2017 only) | {len(test):,} |")
    wx_train = train["v2_annual_rainfall"].notna().sum()
    wx_val   = val["v2_annual_rainfall"].notna().sum()
    wx_test  = test["v2_annual_rainfall"].notna().sum()
    a(f"| Train rows with weather | {wx_train} ({wx_train/len(train)*100:.0f}%) |")
    a(f"| Val rows with weather | {wx_val} ({wx_val/len(val)*100:.0f}%) |")
    a(f"| Test rows with weather | {wx_test} ({wx_test/len(test)*100:.0f}%) |")
    a(f"| Total weather features | 14 new V2 features |")
    a(f"| Total V1 features | 9 (4 categorical, 5 numerical) |")
    a(f"| Total V2 features | 23 (4 categorical, 19 numerical) |\n")

    # Model comparison
    a("## 2. V2 Model Comparison (Validation Set)\n")
    a("| Model | Val MAE | Val RMSE | Val R2 |")
    a("|---|---|---|---|")
    for _, row in val_df.sort_values("R2", ascending=False).iterrows():
        marker = " [BEST]" if row["model"] == best_name else ""
        a(f"| {row['model']}{marker} | {row['MAE']} | {row['RMSE']} | {row['R2']} |")
    a("")

    # V1 vs V2 comparison
    a("## 3. V1 vs V2 — Head-to-Head Comparison\n")
    a("> Note: V1 test set = 2013-2017 (5 years). V2 test set = 2017 only (stricter).\n")
    v1_test_r2  = v1_meta.get("test_metrics", {}).get("R2", "N/A")
    v1_test_mae = v1_meta.get("test_metrics", {}).get("MAE", "N/A")
    a("| Metric | V1 Model | V2 Model | Change |")
    a("|---|---|---|---|")
    a(f"| Best model | HistGradientBoosting | {best_name} | |")
    a(f"| Features | 9 | 23 (+14 weather) | +14 IMD features |")
    a(f"| Test period | 2013-2017 (5 yr) | 2017 only (1 yr, 100% weather) | Stricter |")
    a(f"| Test R2 | {v1_test_r2} | {best_test['R2']} | (different test sets) |")
    a(f"| Test MAE | {v1_test_mae} Kg/ha | {best_test['MAE']} Kg/ha | |")
    a(f"| Weather on test set | 5.9% avg (2013-2017) | 100% (2017 only) | Full coverage |")
    a(f"| V1 model file | ml/models/agrisurge_model.joblib | ml/models/agrisurge_model_v2.joblib | Separate |\n")

    # Best model test
    a("## 4. Best V2 Model — Test Set (2017)\n")
    a(f"**Model:** {best_name}\n")
    a("| Metric | Value |")
    a("|---|---|")
    a(f"| MAE | {best_test['MAE']} Kg/ha |")
    a(f"| RMSE | {best_test['RMSE']} Kg/ha |")
    a(f"| R2 | {best_test['R2']} |")
    a(f"| Test year | 2017 (100% IMD weather coverage) |\n")

    # Feature importance
    a("## 5. Feature Importance (Permutation — Validation Set)\n")
    if not imp_df.empty:
        a("| Feature | Importance (delta-R2) | Std |")
        a("|---|---|---|")
        for _, row in imp_df.head(20).iterrows():
            v2_tag = " [NEW]" if row["feature"] in V2_WEATHER_FEATURES else ""
            a(f"| {row['feature']}{v2_tag} | {row['importance']:.4f} | {row['std']:.4f} |")
    else:
        a("_Not computed_")
    a("")

    # Limitations
    a("## 6. V2 Limitations (Unchanged from V1)\n")
    a("| Limitation | Detail |")
    a("|---|---|")
    a("| Geographic level | District only — not farm or village |")
    a("| No crop variety | ICRISAT does not contain variety-level data |")
    a("| IMD is state-average | All districts get the same rainfall; not spatially disaggregated |")
    a("| 94.1% of training rows lack weather | Only 2015-2017 overlap — weather learns from a narrow window |")
    a("| No temperature / humidity / NDVI | Not available in any provided dataset |")
    a("| Target is yield, not loss | No genuine crop-failure label exists |")
    a("| ICRISAT ends 2017 | 8-year gap to present — no modern agricultural reference data |")
    a("")

    # Next steps
    a("## 7. Path to a Fully Weather-Enriched V3\n")
    a("To achieve 100% IMD weather coverage across all training rows:")
    a("1. Provide district-level agricultural data (area, production, yield) for **2018-2025**")
    a("   in the same format as ICRISAT (district x crop x year)")
    a("2. This immediately fills the 2018-2025 IMD years, giving ~11 fully-enriched years")
    a("3. With post-2015 data: train on 2015-2022, validate 2023, test 2024-2025")
    a("4. A V3 enhancement: spatially disaggregate IMD grid cells to districts using shapefiles")

    return "\n".join(lines)


if __name__ == "__main__":
    run()
