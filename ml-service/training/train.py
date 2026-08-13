"""Training pipeline for the AgriSurge crop-failure risk model.

Usage:
    python train.py --data path/to/dataset.csv

Requires a labeled dataset with, at minimum, the feature columns in
app/preprocessing.py::FEATURE_COLUMNS plus a binary target column
`crop_failure` (1 = failure/high loss season, 0 = normal season).

TRAINING DATASET REQUIRED — this repository does not ship one. Do not run
this script expecting a usable model.pkl without first supplying real
agricultural/weather/yield data.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.preprocessing import FEATURE_COLUMNS  # noqa: E402

TARGET_COLUMN = "crop_failure"
MODEL_OUT = Path(__file__).resolve().parent.parent / "model" / "model.pkl"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to labeled training CSV.")
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        raise SystemExit(f"Training dataset required: {data_path} does not exist.")

    df = pd.read_csv(data_path)
    missing_cols = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing_cols:
        raise SystemExit(f"Dataset is missing required columns: {missing_cols}")

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.random_state, stratify=y
    )

    pipeline = Pipeline(
        steps=[
            ("impute", SimpleImputer(strategy="median")),
            ("model", RandomForestClassifier(n_estimators=300, random_state=args.random_state)),
        ]
    )
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    print("Accuracy: ", accuracy_score(y_test, y_pred))
    print("Precision:", precision_score(y_test, y_pred, zero_division=0))
    print("Recall:   ", recall_score(y_test, y_pred, zero_division=0))
    print("F1 score: ", f1_score(y_test, y_pred, zero_division=0))
    print("Confusion matrix:\n", confusion_matrix(y_test, y_pred))

    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_OUT)
    print(f"Saved model to {MODEL_OUT}")


if __name__ == "__main__":
    main()
