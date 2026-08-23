import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

from sklearn.ensemble import (
    RandomForestClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
)
from sklearn.neighbors import KNeighborsClassifier

def main():
    print("=" * 70)
    print("AGRISURGE — CROP RECOMMENDATION ML MODEL TRAINING PIPELINE")
    print("=" * 70)

    # 1. Dataset Location & Loading
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    csv_path = os.path.join(base_dir, "Crop_recommendation.csv")
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    print(f"\n[1] Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"    - Shape: {df.shape[0]} rows, {df.shape[1]} columns")

    expected_features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    target_col = "label"

    # Validation checks
    assert all(col in df.columns for col in expected_features + [target_col]), "Missing expected columns!"
    assert df.isnull().sum().sum() == 0, "Dataset contains null values!"
    
    unique_crops = sorted(list(df[target_col].unique()))
    print(f"    - Target Classes ({len(unique_crops)} crops): {unique_crops}")

    # Standardize crop label strings (uppercase for clean metadata)
    df["label_clean"] = df[target_col].astype(str).str.strip().str.lower()
    
    X = df[expected_features]
    y = df["label_clean"]

    # Calculate feature ranges across full dataset for runtime boundary checking
    feature_ranges = {}
    for feat in expected_features:
        feature_ranges[feat] = {
            "min": round(float(X[feat].min()), 4),
            "max": round(float(X[feat].max()), 4),
            "mean": round(float(X[feat].mean()), 4),
            "std": round(float(X[feat].std()), 4),
        }
    print("    - Feature range statistics calculated successfully.")

    # 2. Stratified Train (70%) / Validation (15%) / Test (15%) Split
    print("\n[2] Splitting dataset (70% Train / 15% Validation / 15% Test)...")
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    print(f"    - Train set: {X_train.shape[0]} samples (70%)")
    print(f"    - Val set  : {X_val.shape[0]} samples (15%)")
    print(f"    - Test set : {X_test.shape[0]} samples (15%)")

    # 3. Model Comparison Setup
    print("\n[3] Evaluating Candidate Classifiers on Validation Set...")
    candidates = {
        "RandomForestClassifier": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", RandomForestClassifier(n_estimators=100, random_state=42))
        ]),
        "ExtraTreesClassifier": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", ExtraTreesClassifier(n_estimators=100, random_state=42))
        ]),
        "GradientBoostingClassifier": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", GradientBoostingClassifier(n_estimators=100, random_state=42))
        ]),
        "KNeighborsClassifier": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", KNeighborsClassifier(n_neighbors=5))
        ]),
        "HistGradientBoostingClassifier": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", HistGradientBoostingClassifier(random_state=42))
        ]),
    }

    comparison_results = []
    trained_models = {}

    for name, pipeline in candidates.items():
        print(f"    - Training {name}...")
        pipeline.fit(X_train, y_train)
        val_preds = pipeline.predict(X_val)

        acc = accuracy_score(y_val, val_preds)
        prec = precision_score(y_val, val_preds, average="macro", zero_division=0)
        rec = recall_score(y_val, val_preds, average="macro", zero_division=0)
        f1 = f1_score(y_val, val_preds, average="macro", zero_division=0)
        f1_weighted = f1_score(y_val, val_preds, average="weighted", zero_division=0)

        comparison_results.append({
            "Model": name,
            "Val_Accuracy": round(float(acc), 4),
            "Val_Macro_Precision": round(float(prec), 4),
            "Val_Macro_Recall": round(float(rec), 4),
            "Val_Macro_F1": round(float(f1), 4),
            "Val_Weighted_F1": round(float(f1_weighted), 4),
        })
        trained_models[name] = pipeline

    comp_df = pd.DataFrame(comparison_results).sort_values(by="Val_Macro_F1", ascending=False)
    print("\n--- VALIDATION COMPARISON TABLE ---")
    print(comp_df.to_string(index=False))

    # Save comparison table
    proc_dir = os.path.join(base_dir, "data", "processed", "crop_recommendation")
    os.makedirs(proc_dir, exist_ok=True)
    comp_csv_path = os.path.join(proc_dir, "crop_recommendation_model_comparison.csv")
    comp_df.to_csv(comp_csv_path, index=False)
    print(f"\n    - Saved comparison results to: {comp_csv_path}")

    # 4. Best Model Selection
    best_model_name = comp_df.iloc[0]["Model"]
    best_pipeline = trained_models[best_model_name]
    print(f"\n[4] Best Model Selected (based on Val F1/Accuracy): {best_model_name}")

    # 5. Final Evaluation on Untouched Test Set
    print("\n[5] Evaluating Best Model on Untouched Test Set (15%)...")
    test_preds = best_pipeline.predict(X_test)
    test_probs = best_pipeline.predict_proba(X_test)

    test_acc = accuracy_score(y_test, test_preds)
    test_prec = precision_score(y_test, test_preds, average="macro", zero_division=0)
    test_rec = recall_score(y_test, test_preds, average="macro", zero_division=0)
    test_f1 = f1_score(y_test, test_preds, average="macro", zero_division=0)
    test_f1_weighted = f1_score(y_test, test_preds, average="weighted", zero_division=0)

    cm = confusion_matrix(y_test, test_preds, labels=best_pipeline.classes_)
    clf_report = classification_report(y_test, test_preds, zero_division=0, output_dict=True)

    print(f"    - Test Accuracy   : {test_acc:.4f}")
    print(f"    - Test Macro F1   : {test_f1:.4f}")
    print(f"    - Test Weighted F1: {test_f1_weighted:.4f}")

    # 6. AgriSurge Compatibility Mapping
    agrisurge_supported_set = {
        "rice", "wheat", "kharif sorghum", "rabi sorghum", "pearl millet",
        "maize", "chickpea", "pigeonpea", "pigeonpeas", "groundnut",
        "soyabean", "soybean", "sugarcane", "cotton"
    }

    supported_crops = []
    recommendation_only_crops = []

    for crop in best_pipeline.classes_:
        crop_name_upper = crop.upper()
        if crop in agrisurge_supported_set or crop == "pigeonpeas":
            # Map pigeonpeas -> PIGEONPEA for AgriSurge compatibility
            std_name = "PIGEONPEA" if crop == "pigeonpeas" else crop_name_upper
            supported_crops.append({"crop_in_model": crop, "agrisurge_name": std_name})
        else:
            recommendation_only_crops.append({"crop_in_model": crop, "agrisurge_name": crop_name_upper})

    print(f"\n[6] AgriSurge Compatibility Breakdown:")
    print(f"    - Supported Crops ({len(supported_crops)}): {[c['crop_in_model'] for c in supported_crops]}")
    print(f"    - Recommendation-Only ({len(recommendation_only_crops)}): {[c['crop_in_model'] for c in recommendation_only_crops]}")

    # 7. Model & Metadata Serialization
    models_dir = os.path.join(base_dir, "ml", "models")
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, "crop_recommendation_model.joblib")
    metadata_path = os.path.join(models_dir, "crop_recommendation_metadata.json")

    print(f"\n[7] Saving model artifacts...")
    joblib.dump(best_pipeline, model_path)
    print(f"    - Model saved to: {model_path}")

    metadata = {
        "module_name": "AgriSurge Crop Recommendation ML Module",
        "model_algorithm": best_model_name,
        "model_version": "1.0.0",
        "trained_timestamp": datetime.now().isoformat(),
        "dataset_name": "Crop_recommendation.csv",
        "num_total_records": int(df.shape[0]),
        "num_features": int(len(expected_features)),
        "feature_names": expected_features,
        "num_classes": int(len(best_pipeline.classes_)),
        "classes": list(best_pipeline.classes_),
        "split_ratios": {
            "train": 0.70,
            "validation": 0.15,
            "test": 0.15,
            "random_state": 42
        },
        "validation_metrics": {
            "accuracy": round(float(comp_df.iloc[0]["Val_Accuracy"]), 4),
            "macro_precision": round(float(comp_df.iloc[0]["Val_Macro_Precision"]), 4),
            "macro_recall": round(float(comp_df.iloc[0]["Val_Macro_Recall"]), 4),
            "macro_f1": round(float(comp_df.iloc[0]["Val_Macro_F1"]), 4),
            "weighted_f1": round(float(comp_df.iloc[0]["Val_Weighted_F1"]), 4),
        },
        "final_test_metrics": {
            "accuracy": round(float(test_acc), 4),
            "macro_precision": round(float(test_prec), 4),
            "macro_recall": round(float(test_rec), 4),
            "macro_f1": round(float(test_f1), 4),
            "weighted_f1": round(float(test_f1_weighted), 4),
        },
        "feature_ranges": feature_ranges,
        "supported_agrisurge_crops": supported_crops,
        "recommendation_only_crops": recommendation_only_crops,
        "model_comparison": comparison_results,
        "limitations": [
            "Baseline dataset contains 2,200 synthetic/lab samples.",
            "Key Maharashtra crops (Wheat, Soybean, Sugarcane, Sorghum) are not in this 22-class dataset.",
            "Confidence scores represent model softmax/class probabilities, not real-world yield or survival guarantees.",
            "Sensors (N, P, K, Temp, Humidity, pH, Rainfall) must use units matching training dataset boundaries."
        ]
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"    - Metadata saved to: {metadata_path}")

    # 8. Test Top-3 Prediction Helper Simulation
    print("\n[8] Testing Top-3 Prediction Output & Out-of-Range Boundary Helper...")
    
    def predict_top3_crops(input_dict, pipeline=best_pipeline, ranges=feature_ranges):
        # 1. Out-of-range checking
        warnings = []
        out_of_bounds_count = 0
        
        for feat in expected_features:
            val = input_dict.get(feat)
            if val is not None:
                min_val = ranges[feat]["min"]
                max_val = ranges[feat]["max"]
                if val < min_val or val > max_val:
                    out_of_bounds_count += 1
                    warnings.append(f"{feat} value ({val}) is outside training data range [{min_val}, {max_val}]")
        
        if out_of_bounds_count == 0:
            reliability = "NORMAL"
        elif out_of_bounds_count == 1:
            reliability = "CAUTION"
        else:
            reliability = "LOW"

        # 2. Probability Prediction
        input_df = pd.DataFrame([input_dict])[expected_features]
        probs = pipeline.predict_proba(input_df)[0]
        classes = pipeline.classes_
        
        top3_indices = np.argsort(probs)[::-1][:3]
        
        recommendations = []
        for idx in top3_indices:
            crop_raw = classes[idx]
            crop_display = "PIGEONPEA" if crop_raw == "pigeonpeas" else crop_raw.upper()
            is_supported = any(c["crop_in_model"] == crop_raw for c in supported_crops)
            recommendations.append({
                "crop": crop_display,
                "crop_raw": crop_raw,
                "confidence": round(float(probs[idx]), 4),
                "agrisurge_status": "SUPPORTED_BY_AGRISURGE" if is_supported else "RECOMMENDATION_ONLY"
            })

        return {
            "input": input_dict,
            "prediction_reliability": reliability,
            "warnings": warnings,
            "recommendations": recommendations,
        }

    # Sample normal test input
    sample_normal = {"N": 90, "P": 42, "K": 43, "temperature": 20.8, "humidity": 82.0, "ph": 6.5, "rainfall": 202.9}
    print("    - Normal Input Test Result:")
    print(json.dumps(predict_top3_crops(sample_normal), indent=2))

    # Sample out-of-range test input
    sample_oor = {"N": 90, "P": 42, "K": 43, "temperature": 85.0, "humidity": 82.0, "ph": 6.5, "rainfall": 202.9}
    print("\n    - Out-of-Range Input Test Result:")
    print(json.dumps(predict_top3_crops(sample_oor), indent=2))

    print("\n" + "=" * 70)
    print("CROP RECOMMENDATION TRAINING COMPLETE & ALL ARTIFACTS PERSISTED CLEANLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
