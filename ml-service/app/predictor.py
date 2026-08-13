import os
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import pandas as pd

from .preprocessing import build_feature_frame

PRIMARY_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "ml" / "models" / "agrisurge_model.joblib"
FALLBACK_MODEL_PATH = Path(__file__).resolve().parent.parent / "model" / "model.pkl"

MODEL_VERSION = os.environ.get("MODEL_VERSION", "v1.0")

def load_artifact(path: Path):
    try:
        import joblib
        return joblib.load(path)
    except Exception:
        import pickle
        with open(path, "rb") as f:
            return pickle.load(f)

class BasePredictor:
    model_name = "Unnamed model"
    is_mock = True

    def predict(self, record: dict) -> dict:
        raise NotImplementedError

class RealTrainedPredictor(BasePredictor):
    model_name = "AgriSurge ML Risk Model"
    is_mock = False

    def __init__(self, model_path: Path):
        self.artifact = load_artifact(model_path)
        if isinstance(self.artifact, dict):
            self.model = self.artifact["model"]
            self.feature_names = self.artifact.get("feature_names", [])
            self.num_cols = self.artifact.get("num_cols", [])
            self.cat_cols = self.artifact.get("cat_cols", [])
            self.model_name = type(self.model).__name__
        else:
            self.model = self.artifact
            self.feature_names = []
            self.model_name = type(self.model.named_steps["classifier"]).__name__

    def predict(self, record: dict) -> dict:
        if isinstance(self.artifact, dict):
            # Pure Numpy / Pandas pipeline prediction
            df_in = build_feature_frame(record)
            df_encoded = pd.get_dummies(df_in[self.num_cols + self.cat_cols], columns=self.cat_cols)
            
            # Align columns with training feature set
            for col in self.feature_names:
                if col not in df_encoded.columns:
                    df_encoded[col] = 0
            df_encoded = df_encoded[self.feature_names]

            X = df_encoded.values
            proba = self.model.predict_proba(X)[0]
            risk_score = float(proba[1]) if len(proba) > 1 else float(proba[0])

            importances = getattr(self.model, "feature_importances_", np.zeros(len(self.feature_names)))
            top_indices = np.argsort(importances)[::-1][:4]

            factors = []
            for idx in top_indices:
                feat = self.feature_names[idx]
                imp = float(importances[idx])
                direction = "increases_risk" if risk_score >= 0.4 else "decreases_risk"
                factors.append({
                    "name": feat.replace("_", " ").title(),
                    "contribution": round(imp, 3),
                    "direction": direction,
                })

            return {
                "risk_score": round(risk_score, 3),
                "factors": factors,
            }
        else:
            # Sklearn Pipeline prediction
            X = build_feature_frame(record)
            proba = self.model.predict_proba(X)[0]
            risk_score = float(proba[1]) if len(proba) > 1 else float(proba[0])

            classifier = self.model.named_steps["classifier"]
            preprocessor = self.model.named_steps["preprocessor"]
            cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
            encoded_cat_names = list(cat_encoder.get_feature_names_out())
            num_names = preprocessor.transformers_[0][2]
            all_features = num_names + encoded_cat_names

            if hasattr(classifier, "feature_importances_"):
                importances = classifier.feature_importances_
            else:
                importances = np.ones(len(all_features)) / len(all_features)

            top_indices = np.argsort(importances)[::-1][:4]
            factors = []
            for idx in top_indices:
                feat = all_features[idx]
                imp = float(importances[idx])
                direction = "increases_risk" if risk_score >= 0.4 else "decreases_risk"
                factors.append({
                    "name": feat.replace("_", " ").title(),
                    "contribution": round(imp, 3),
                    "direction": direction,
                })

            return {
                "risk_score": round(risk_score, 3),
                "factors": factors,
            }

class MockPredictor(BasePredictor):
    model_name = "Development mock predictor"
    is_mock = True

    def predict(self, record: dict) -> dict:
        rainfall_deficit = max(0.0, (80 - record.get("rainfall_mm", 0)) / 80)
        heat_stress = max(0.0, (record.get("temperature_c", 0) - 28) / 15)
        soil_moisture = record.get("soil_moisture_pct")
        moisture_deficit = max(0.0, (35 - soil_moisture) / 35) if soil_moisture is not None else 0.3
        ndvi = record.get("ndvi")
        vegetation_stress = max(0.0, (0.5 - ndvi) / 0.5) if ndvi is not None else 0.25

        raw = (
            rainfall_deficit * 0.35
            + heat_stress * 0.25
            + moisture_deficit * 0.2
            + vegetation_stress * 0.2
        )
        risk_score = min(0.97, max(0.05, round(raw, 2)))

        factors = [
            {"name": "Rainfall Deficit", "contribution": round(rainfall_deficit, 2), "direction": "increases_risk"},
            {"name": "Heat Stress", "contribution": round(heat_stress, 2), "direction": "increases_risk"},
            {"name": "Soil Moisture Deficit", "contribution": round(moisture_deficit, 2), "direction": "increases_risk"},
            {"name": "Vegetation Stress (NDVI)", "contribution": round(vegetation_stress, 2), "direction": "increases_risk"},
        ]
        return {"risk_score": risk_score, "factors": factors}

def get_predictor() -> BasePredictor:
    if PRIMARY_MODEL_PATH.exists():
        return RealTrainedPredictor(PRIMARY_MODEL_PATH)
    elif FALLBACK_MODEL_PATH.exists():
        return RealTrainedPredictor(FALLBACK_MODEL_PATH)
    return MockPredictor()

def risk_level_from_score(score: float) -> str:
    if score >= 0.7:
        return "high"
    if score >= 0.4:
        return "moderate"
    return "low"

def run_prediction(record: dict) -> dict:
    predictor = get_predictor()
    result = predictor.predict(record)
    return {
        "risk_score": result["risk_score"],
        "risk_level": risk_level_from_score(result["risk_score"]),
        "model_name": predictor.model_name,
        "model_version": MODEL_VERSION if not predictor.is_mock else "mock-0.1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "factors": result["factors"],
        "is_mock": predictor.is_mock,
    }
