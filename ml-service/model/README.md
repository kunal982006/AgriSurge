Place the trained model as `model.pkl` in this directory (joblib-serialized
scikit-learn `RandomForestClassifier`, or a Pipeline ending in one).

Until a file is present here, `app/predictor.py` automatically uses the
development mock predictor and marks every response `isMock: true`.
