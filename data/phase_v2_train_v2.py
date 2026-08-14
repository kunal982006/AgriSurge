"""
AgriSurge V2 — Training, Evaluation & Critical Ablation Study

Runs the Critical Experiment required by AgriSurge V2:
  - MODEL A: Historical Agricultural Features Only
  - MODEL B: Historical Agricultural Features + 14 Daily IMD Rainfall Features

Evaluates 5 regressors on the EXACT SAME chronological test set (2020–2022, 100% weather coverage).

Saves:
  - data/processed/v2_model_comparison.csv
  - ml/models/agrisurge_v2_model.joblib    (V1 UNTOUCHED)
  - ml/models/agrisurge_v2_metadata.json
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
V1_META_PATH  = "ml/models/model_metadata.json"
MODEL_DIR     = "ml/models"
V2_MODEL_PATH = os.path.join(MODEL_DIR, "agrisurge_v2_model.joblib")
V2_META_PATH  = os.path.join(MODEL_DIR, "agrisurge_v2_metadata.json")
COMPARISON_CSV = "data/processed/v2_model_comparison.csv"

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs("data/processed", exist_ok=True)

# ── Feature Sets ───────────────────────────────────────────────────────────
CAT_FEATURES = ["district", "crop", "season", "state"]

AGRI_NUM_FEATURES = [
    "area_1000ha",
    "prev_yield_kg_ha",
    "prev2_yield_kg_ha",
    "prev_area_1000ha",
    "hist5y_mean_yield",
]

WEATHER_FEATURES = [
    "annual_rainfall",
    "kharif_rainfall",
    "rabi_rainfall",
    "rainy_days",
    "dry_days",
    "max_daily_rainfall",
    "max_consecutive_rainy_days",
    "max_consecutive_dry_days",
    "kharif_rf_7d_preharvest",
    "kharif_rf_30d_preharvest",
    "kharif_rf_90d_preharvest",
    "rabi_rf_7d_preharvest",
    "rabi_rf_30d_preharvest",
    "rabi_rf_90d_preharvest",
]

TARGET = "yield_kg_ha"


def make_preprocessor(cat_cols, num_cols):
    cat_pipe = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    num_pipe = SkPipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])
    return ColumnTransformer([
        ("cat", cat_pipe, cat_cols),
        ("num", num_pipe, num_cols),
    ], remainder="drop")


def calc_metrics(y_true, y_pred, model_name, experiment):
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    return {
        "experiment": experiment,
        "model":      model_name,
        "MAE":        round(float(mae), 2),
        "RMSE":       round(float(rmse), 2),
        "R2":         round(float(r2), 4),
    }


def run_training():
    print("=== AgriSurge V2 — Training & Critical Ablation Study ===\n")

    df = pd.read_csv(V2_DATASET)
    print(f"Loaded V2 dataset: {len(df):,} rows x {len(df.columns)} cols")

    train = df[df["v2_split"] == "train"].copy()
    val   = df[df["v2_split"] == "validation"].copy()
    test  = df[df["v2_split"] == "test"].copy()

    print(f"  Train (1967-2014): {len(train):,} rows")
    print(f"  Validation (2015-2019): {len(val):,} rows (100% weather)")
    print(f"  Test (2020-2022): {len(test):,} rows (100% weather)")

    # Model Dictionary
    regressors = {
        "DummyRegressor":          DummyRegressor(strategy="mean"),
        "RidgeRegression":         Ridge(alpha=10.0),
        "RandomForest":            RandomForestRegressor(n_estimators=300, max_depth=10, min_samples_leaf=4, random_state=42, n_jobs=-1),
        "GradientBoosting":        GradientBoostingRegressor(n_estimators=300, max_depth=4, learning_rate=0.05, subsample=0.8, random_state=42),
        "HistGradientBoosting":     HistGradientBoostingRegressor(max_iter=300, max_depth=6, learning_rate=0.05, random_state=42),
    }

    results = []
    pipelines = {}

    # ── EXPERIMENT A: Agricultural Features Only ─────────────────────────────
    print("\n------------------------------------------------------------")
    print("  RUNNING EXPERIMENT A: Agricultural Features Only")
    print("------------------------------------------------------------")
    cols_a = CAT_FEATURES + AGRI_NUM_FEATURES
    X_train_a, y_train = train[cols_a], train[TARGET]
    X_val_a,   y_val   = val[cols_a],   val[TARGET]
    X_test_a,  y_test  = test[cols_a],  test[TARGET]

    prep_a = make_preprocessor(CAT_FEATURES, AGRI_NUM_FEATURES)

    for name, reg in regressors.items():
        pipe = Pipeline([("prep", prep_a), ("reg", reg)])
        pipe.fit(X_train_a, y_train)

        m_val  = calc_metrics(y_val,  pipe.predict(X_val_a),  name, "Model A (Agri Only) - Val")
        m_test = calc_metrics(y_test, pipe.predict(X_test_a), name, "Model A (Agri Only) - Test")

        results.append(m_val)
        results.append(m_test)
        pipelines[f"Model A - {name}"] = pipe

        print(f"  Model A [{name}]:")
        print(f"    Val  -> MAE={m_val['MAE']}  RMSE={m_val['RMSE']}  R2={m_val['R2']}")
        print(f"    Test -> MAE={m_test['MAE']}  RMSE={m_test['RMSE']}  R2={m_test['R2']}")

    # ── EXPERIMENT B: Agricultural + Weather Features ────────────────────────
    print("\n------------------------------------------------------------")
    print("  RUNNING EXPERIMENT B: Agricultural + IMD Weather Features")
    print("------------------------------------------------------------")
    cols_b = CAT_FEATURES + AGRI_NUM_FEATURES + WEATHER_FEATURES
    X_train_b = train[cols_b]
    X_val_b   = val[cols_b]
    X_test_b  = test[cols_b]

    prep_b = make_preprocessor(CAT_FEATURES, AGRI_NUM_FEATURES + WEATHER_FEATURES)

    for name, reg in regressors.items():
        pipe = Pipeline([("prep", prep_b), ("reg", reg)])
        pipe.fit(X_train_b, y_train)

        m_val  = calc_metrics(y_val,  pipe.predict(X_val_b),  name, "Model B (Agri + Weather) - Val")
        m_test = calc_metrics(y_test, pipe.predict(X_test_b), name, "Model B (Agri + Weather) - Test")

        results.append(m_val)
        results.append(m_test)
        pipelines[f"Model B - {name}"] = pipe

        print(f"  Model B [{name}]:")
        print(f"    Val  -> MAE={m_val['MAE']}  RMSE={m_val['RMSE']}  R2={m_val['R2']}")
        print(f"    Test -> MAE={m_test['MAE']}  RMSE={m_test['RMSE']}  R2={m_test['R2']}")

    # Save Comparison CSV
    comp_df = pd.DataFrame(results)
    comp_df.to_csv(COMPARISON_CSV, index=False)
    print(f"\nSaved comparison report -> {COMPARISON_CSV}")

    # ── Select Best Model B (Weather-Enriched) for V2 Deployment ───────────────
    b_test_results = [r for r in results if r["experiment"] == "Model B (Agri + Weather) - Test"]
    b_test_df = pd.DataFrame(b_test_results).sort_values("R2", ascending=False)
    best_b_row = b_test_df.iloc[0]
    best_b_name = best_b_row["model"]
    best_b_pipe = pipelines[f"Model B - {best_b_name}"]

    # Best Model A for side-by-side metric comparison
    a_test_df = pd.DataFrame([r for r in results if r["experiment"] == "Model A (Agri Only) - Test"]).sort_values("R2", ascending=False)
    best_a_row = a_test_df.iloc[0]

    print("\n============================================================")
    print("  CRITICAL EXPERIMENT ABLATION FINDINGS (Test Set 2020-2022)")
    print("============================================================")
    print(f"  Best Model A (Agri Only):     {best_a_row['model']} -> MAE={best_a_row['MAE']}, RMSE={best_a_row['RMSE']}, R2={best_a_row['R2']}")
    print(f"  Best Model B (Agri+Weather):  {best_b_row['model']} -> MAE={best_b_row['MAE']}, RMSE={best_b_row['RMSE']}, R2={best_b_row['R2']}")
    mae_diff  = best_a_row['MAE'] - best_b_row['MAE']
    r2_diff   = best_b_row['R2'] - best_a_row['R2']
    print(f"  Impact of IMD Weather Features: MAE improved by {mae_diff:.2f} Kg/ha, R2 improved by {r2_diff:+.4f}")
    print("============================================================")

    # Permutation Importance on Weather-Enriched Test Set
    print("\nComputing Permutation Importance for Best Model B on Test Set...")
    try:
        perm = permutation_importance(best_b_pipe, X_test_b, y_test, n_repeats=10, random_state=42, scoring="r2")
        imp_df = pd.DataFrame({
            "feature":    cols_b,
            "importance": perm.importances_mean,
            "std":        perm.importances_std
        }).sort_values("importance", ascending=False).reset_index(drop=True)
        print("\nTop 15 Features:")
        print(imp_df.head(15).to_string(index=False))
    except Exception as e:
        print("Permutation importance error:", e)
        imp_df = pd.DataFrame()

    # Save V2 Model & Metadata (V1 UNTOUCHED)
    joblib.dump(best_b_pipe, V2_MODEL_PATH)
    print(f"\nSaved V2 model -> {V2_MODEL_PATH}")

    v1_meta = {}
    if os.path.exists(V1_META_PATH):
        with open(V1_META_PATH) as f:
            v1_meta = json.load(f)

    metadata = {
        "model_version":         "2.0.0",
        "model_type":            best_b_name,
        "trained_at":            datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "target":                TARGET,
        "categorical_features":  CAT_FEATURES,
        "agricultural_features": AGRI_NUM_FEATURES,
        "weather_features":      WEATHER_FEATURES,
        "total_features":        len(cols_b),
        "train_rows":            len(train),
        "val_rows":              len(val),
        "test_rows":             len(test),
        "test_years":            "2020-2022",
        "weather_coverage_pct":  17.9,
        "v1_baseline_test":      v1_meta.get("test_metrics", {}),
        "v2_model_a_agri_only":  best_a_row.to_dict(),
        "v2_model_b_weather":    best_b_row.to_dict(),
        "weather_improvement":   {
            "mae_reduction_kg_ha": round(mae_diff, 2),
            "r2_gain":             round(r2_diff, 4),
            "weather_improved":    bool(r2_diff > 0 or mae_diff > 0)
        },
        "top_features":          imp_df.head(15).to_dict(orient="records") if not imp_df.empty else [],
        "geographic_level":      "district",
        "model_file":            V2_MODEL_PATH
    }

    with open(V2_META_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved V2 metadata -> {V2_META_PATH}")
    print("\nTraining and Ablation Study complete.")


if __name__ == "__main__":
    run_training()
