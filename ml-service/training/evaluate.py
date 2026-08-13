"""Evaluate an existing model.pkl against a labeled dataset.

Usage:
    python evaluate.py --data path/to/holdout.csv
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score

sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.preprocessing import FEATURE_COLUMNS  # noqa: E402

MODEL_PATH = Path(__file__).resolve().parent.parent / "model" / "model.pkl"
TARGET_COLUMN = "crop_failure"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    args = parser.parse_args()

    if not MODEL_PATH.exists():
        raise SystemExit(f"No trained model found at {MODEL_PATH}. Run train.py first.")

    df = pd.read_csv(args.data)
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    model = joblib.load(MODEL_PATH)
    y_pred = model.predict(X)

    print("Accuracy: ", accuracy_score(y, y_pred))
    print("Precision:", precision_score(y, y_pred, zero_division=0))
    print("Recall:   ", recall_score(y, y_pred, zero_division=0))
    print("F1 score: ", f1_score(y, y_pred, zero_division=0))
    print("Confusion matrix:\n", confusion_matrix(y, y_pred))


if __name__ == "__main__":
    main()
