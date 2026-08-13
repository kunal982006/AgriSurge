import os
import json
import datetime
import pandas as pd
import numpy as np

# Save locations
DATASET_PATH = "dataset.csv"
MODEL_DIR = os.path.join("ml", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "agrisurge_model.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")
REPORT_PATH = os.path.join("ml", "evaluation_report.txt")

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False
    import pickle

try:
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline import Pipeline
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report
    from risk_config import TARGET_COLUMN, NUMERICAL_FEATURES, CATEGORICAL_FEATURES, ALL_FEATURES
    from preprocessing import get_preprocessor
    from evaluate import evaluate_model, get_feature_importances
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

from model import PureNumpyDecisionTree

def run_training():
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"{DATASET_PATH} not found.")

    df = pd.read_csv(DATASET_PATH)

    os.makedirs("ml", exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)

    if HAS_SKLEARN:
        print("Training using Scikit-Learn pipeline...")
        from risk_config import TARGET_COLUMN, NUMERICAL_FEATURES, CATEGORICAL_FEATURES, ALL_FEATURES
        from preprocessing import get_preprocessor
        from evaluate import evaluate_model, get_feature_importances

        X = df[ALL_FEATURES]
        y = df[TARGET_COLUMN]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        models = {
            "RandomForestClassifier": RandomForestClassifier(n_estimators=200, random_state=42, max_depth=8),
            "GradientBoostingClassifier": GradientBoostingClassifier(n_estimators=150, random_state=42, max_depth=5),
            "LogisticRegression": LogisticRegression(random_state=42, max_iter=1000),
        }

        best_score = -1.0
        best_model_name = None
        best_pipeline = None
        best_metrics = None
        all_reports = []

        all_reports.append("========================================================")
        all_reports.append("AGRISURGE — ML MODEL EVALUATION & COMPARISON REPORT")
        all_reports.append("========================================================")

        for name, clf in models.items():
            pipeline = Pipeline(steps=[
                ("preprocessor", get_preprocessor()),
                ("classifier", clf),
            ])
            pipeline.fit(X_train, y_train)
            metrics = evaluate_model(pipeline, X_test, y_test, model_name=name)

            all_reports.append(f"--- MODEL: {name} ---")
            all_reports.append(f"Accuracy:  {metrics['accuracy']:.4f}")
            all_reports.append(f"Precision: {metrics['precision']:.4f}")
            all_reports.append(f"Recall:    {metrics['recall']:.4f}")
            all_reports.append(f"F1 Score:  {metrics['f1']:.4f}")
            all_reports.append(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
            all_reports.append("")

            score = metrics["f1"] + metrics["roc_auc"]
            if score > best_score:
                best_score = score
                best_model_name = name
                best_pipeline = pipeline
                best_metrics = metrics

        importance_df = get_feature_importances(best_pipeline, ALL_FEATURES)
        all_reports.append(f"WINNING MODEL: {best_model_name}")
        all_reports.append("\n--- FEATURE IMPORTANCES ---")
        all_reports.append(importance_df.to_string(index=False))

        report_content = "\n".join(all_reports)
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            f.write(report_content)
        print(report_content)

        if HAS_JOBLIB:
            joblib.dump(best_pipeline, MODEL_PATH)
        else:
            with open(MODEL_PATH, "wb") as f:
                pickle.dump(best_pipeline, f)

        metadata = {
            "model_version": "1.0.0",
            "model_type": best_model_name,
            "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "dataset_name": DATASET_PATH,
            "target_column": TARGET_COLUMN,
            "numerical_features": NUMERICAL_FEATURES,
            "categorical_features": CATEGORICAL_FEATURES,
            "evaluation_metrics": best_metrics,
            "top_features": importance_df.head(10).to_dict(orient="records"),
        }
        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

    else:
        print("Training using Pure Numpy/Pandas ML Pipeline...")
        num_cols = ["rainfall_mm", "temperature_c", "humidity_pct", "soil_moisture_pct", "ndvi", "latitude", "longitude"]
        cat_cols = ["crop", "soil_type", "irrigation_type"]
        target_col = "crop_failure"

        # One-hot encode
        df_encoded = pd.get_dummies(df[num_cols + cat_cols], columns=cat_cols)
        feature_names = df_encoded.columns.tolist()

        X_all = df_encoded.values
        y_all = df[target_col].values

        # Split 80/20
        np.random.seed(42)
        indices = np.random.permutation(len(X_all))
        split = int(len(X_all) * 0.8)
        train_idx, test_idx = indices[:split], indices[split:]

        X_train, X_test = X_all[train_idx], X_all[test_idx]
        y_train, y_test = y_all[train_idx], y_all[test_idx]

        model = PureNumpyDecisionTree(max_depth=6)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        acc = np.mean(y_pred == y_test)
        tp = np.sum((y_pred == 1) & (y_test == 1))
        fp = np.sum((y_pred == 1) & (y_test == 0))
        fn = np.sum((y_pred == 0) & (y_test == 1))
        
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0

        importance_df = pd.DataFrame({
            "feature": feature_names,
            "importance": model.feature_importances_
        }).sort_values("importance", ascending=False)

        report = f"""========================================================
AGRISURGE — PURE NUMPY ML MODEL EVALUATION REPORT
========================================================
Model Type: DecisionTree (Max Depth: 6)
Training Rows: {len(X_train)}
Test Rows:     {len(X_test)}

Metrics:
Accuracy:  {acc:.4f}
Precision: {prec:.4f}
Recall:    {rec:.4f}
F1 Score:  {f1:.4f}

--- TOP FEATURE IMPORTANCES ---
{importance_df.head(10).to_string(index=False)}
========================================================
"""
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            f.write(report)
        print(report)

        model_artifact = {
            "model": model,
            "feature_names": feature_names,
            "num_cols": num_cols,
            "cat_cols": cat_cols,
        }

        if HAS_JOBLIB:
            joblib.dump(model_artifact, MODEL_PATH)
        else:
            with open(MODEL_PATH, "wb") as f:
                pickle.dump(model_artifact, f)

        metadata = {
            "model_version": "1.0.0",
            "model_type": "PureNumpyDecisionTree",
            "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "dataset_name": DATASET_PATH,
            "target_column": target_col,
            "numerical_features": num_cols,
            "categorical_features": cat_cols,
            "evaluation_metrics": {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1": f1
            },
            "top_features": importance_df.head(10).to_dict(orient="records")
        }
        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

    print(f"Successfully trained and saved AgriSurge ML model to {MODEL_PATH}!")

if __name__ == "__main__":
    run_training()
