import sys
import os
import json
import argparse
import joblib
import pandas as pd
import numpy as np

def main():
    parser = argparse.ArgumentParser(description="AgriSurge ML Crop Recommendation Predictor")
    parser.add_argument("--json", type=str, help="JSON input string containing 7 sensor parameters")
    args = parser.parse_args()

    if not args.json:
        # Default fallback or read stdin
        if not sys.stdin.isatty():
            json_str = sys.stdin.read().strip()
        else:
            json_str = "{}"
    else:
        json_str = args.json

    try:
        input_data = json.loads(json_str)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse JSON input: {str(e)}"}))
        sys.exit(1)

    # 1. Feature Order & Extraction
    expected_features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    
    parsed_inputs = {}
    for feat in expected_features:
        val = input_data.get(feat, 0)
        try:
            parsed_inputs[feat] = float(val)
        except (ValueError, TypeError):
            parsed_inputs[feat] = 0.0

    # 2. Locate Model & Metadata Files
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    model_path = os.path.join(base_dir, "ml", "models", "crop_recommendation_model.joblib")
    metadata_path = os.path.join(base_dir, "ml", "models", "crop_recommendation_metadata.json")

    if not os.path.exists(model_path):
        print(json.dumps({"error": f"Crop recommendation model not found at {model_path}"}))
        sys.exit(1)

    # Load Model Pipeline & Metadata
    try:
        model = joblib.load(model_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load model file: {str(e)}"}))
        sys.exit(1)

    feature_ranges = {}
    supported_crops_meta = []

    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r") as f:
                meta = json.load(f)
                feature_ranges = meta.get("feature_ranges", {})
                supported_crops_meta = meta.get("supported_agrisurge_crops", [])
        except Exception:
            pass

    # 3. Out-Of-Range Boundary Checking
    warnings = []
    out_of_bounds_count = 0

    for feat in expected_features:
        val = parsed_inputs[feat]
        if feat in feature_ranges:
            min_val = feature_ranges[feat].get("min", 0)
            max_val = feature_ranges[feat].get("max", 9999)
            if val < min_val or val > max_val:
                out_of_bounds_count += 1
                warnings.append(f"{feat} value ({val}) is outside observed training bounds [{min_val}, {max_val}]")

    if out_of_bounds_count == 0:
        reliability = "NORMAL"
    elif out_of_bounds_count == 1:
        reliability = "CAUTION"
    else:
        reliability = "LOW"

    # 4. Perform Inference with predict_proba()
    df_features = pd.DataFrame([parsed_inputs])[expected_features]
    
    try:
        probs = model.predict_proba(df_features)[0]
        classes = model.classes_
    except Exception as e:
        print(json.dumps({"error": f"Inference failed: {str(e)}"}))
        sys.exit(1)

    # Sort classes by descending probability
    sorted_indices = np.argsort(probs)[::-1]
    
    agrisurge_supported_set = {
        "rice", "wheat", "kharif sorghum", "rabi sorghum", "pearl millet",
        "maize", "chickpea", "pigeonpea", "pigeonpeas", "groundnut",
        "soyabean", "soybean", "sugarcane", "cotton"
    }

    top_recommendations = []
    raw_debug_top = []

    for rank_idx, i in enumerate(sorted_indices[:3]):
        crop_raw = str(classes[i])
        confidence = float(probs[i])

        # Capitalization / formatting
        if crop_raw.lower() == "pigeonpeas":
            crop_display = "Pigeonpea"
        else:
            crop_display = crop_raw.capitalize()

        is_supported = crop_raw.lower() in agrisurge_supported_set or crop_raw.lower() == "pigeonpeas"
        agrisurge_status = "SUPPORTED_BY_AGRISURGE" if is_supported else "RECOMMENDATION_ONLY"

        top_recommendations.append({
          "rank": rank_idx + 1,
          "crop": crop_display,
          "crop_raw": crop_raw,
          "confidence": round(confidence, 4),
          "confidence_pct": f"{round(confidence * 100, 1)}%",
          "agrisurgeStatus": agrisurge_status
        })

        raw_debug_top.append({"crop": crop_raw, "prob": round(confidence, 4)})

    # Debugging output structure
    output = {
        "topRecommendations": top_recommendations,
        "reliability": reliability,
        "warnings": warnings,
        "debug": {
            "receivedInputs": parsed_inputs,
            "modelLoaded": model_path,
            "rawProbasTop": raw_debug_top,
            "timestamp": pd.Timestamp.now().isoformat(),
        }
    }

    # Print JSON output to stdout
    print(json.dumps(output))

if __name__ == "__main__":
    main()
