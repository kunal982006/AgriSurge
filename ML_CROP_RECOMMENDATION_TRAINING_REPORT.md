# AgriSurge ML Module — Crop Recommendation Training Report

> **Model Artifact**: [`ml/models/crop_recommendation_model.joblib`](file:///c:/Ronit%20Documents/AgriSurge/ml/models/crop_recommendation_model.joblib)  
> **Metadata Artifact**: [`ml/models/crop_recommendation_metadata.json`](file:///c:/Ronit%20Documents/AgriSurge/ml/models/crop_recommendation_metadata.json)  
> **Comparison Table**: [`data/processed/crop_recommendation/crop_recommendation_model_comparison.csv`](file:///c:/Ronit%20Documents/AgriSurge/data/processed/crop_recommendation/crop_recommendation_model_comparison.csv)  
> **Training Date**: August 23, 2026  
> **Module Status**: Trained & Verified (Independent Module; V1 and V2 Risk Models untouched)  

---

## 1. Project Module Overview

The **Crop Recommendation ML Module** is a standalone machine learning component built for AgriSurge. Given 7 soil nutrient and climatic measurements (`Nitrogen`, `Phosphorus`, `Potassium`, `Temperature`, `Humidity`, `Soil pH`, `Rainfall`), the module predicts crop suitability across 22 crop categories and generates ranked **Top-3 Crop Recommendations** with model confidence scores and reliability warnings.

---

## 2. Dataset Information

- **Dataset File**: [`Crop_recommendation.csv`](file:///c:/Ronit%20Documents/AgriSurge/Crop_recommendation.csv)
- **Total Records**: `2,200`
- **Total Columns**: `8` (`7` input features + `1` target label)
- **Missing / Null Values**: `0` (100% complete)
- **Duplicate Rows**: `0` (100% unique observations)
- **Class Balance**: Perfectly balanced (`100` records per crop class across `22` classes)

---

## 3. Input Features

The model consumes 7 numerical environmental and soil parameters:

| Feature Name | Short Name | Unit | Range in Training Data |
| :--- | :--- | :--- | :--- |
| **Nitrogen** | `N` | `mg/kg` | `0.00` – `140.00` |
| **Phosphorus** | `P` | `mg/kg` | `5.00` – `145.00` |
| **Potassium** | `K` | `mg/kg` | `5.00` – `205.00` |
| **Temperature** | `temperature` | `°C` | `8.83` – `43.68` |
| **Humidity** | `humidity` | `%` | `14.26` – `99.98` |
| **Soil pH** | `ph` | `pH` | `3.50` – `9.94` |
| **Rainfall** | `rainfall` | `mm` | `20.21` – `298.56` |

---

## 4. Target Classes

The dataset contains `22` target crop classes:
`apple`, `banana`, `blackgram`, `chickpea`, `coconut`, `coffee`, `cotton`, `grapes`, `jute`, `kidneybeans`, `lentil`, `maize`, `mango`, `mothbeans`, `mungbean`, `muskmelon`, `orange`, `papaya`, `pigeonpeas`, `pomegranate`, `rice`, `watermelon`.

---

## 5. Data Quality Summary

- **Consistency**: High quality dataset. No extreme outliers or corrupted values detected.
- **Dtypes**: All 7 features are continuous numbers (`int64`/`float64`), enabling direct feature scaling and classification.

---

## 6. Train / Validation / Test Strategy

To prevent data leakage and ensure reliable real-world evaluation, the 2,200 records were partitioned using a **Stratified 70 / 15 / 15 Split** with a fixed random seed (`random_state=42`):

| Partition | Percentage | Samples | Purpose |
| :--- | :--- | :--- | :--- |
| **Train Set** | 70% | `1,540` | Model fitting & feature scaling fit |
| **Validation Set** | 15% | `330` | Algorithm selection & hyperparameter comparison |
| **Test Set** | 15% | `330` | **Untouched** final evaluation of the selected model |

---

## 7. Algorithms Compared

Five distinct classification architectures were evaluated using `StandardScaler` preprocessing pipelines:
1. `ExtraTreesClassifier` (100 trees)
2. `RandomForestClassifier` (100 trees)
3. `HistGradientBoostingClassifier`
4. `GradientBoostingClassifier`
5. `KNeighborsClassifier` ($k=5$)

---

## 8. Validation Results

Models evaluated on the 15% Validation Set (`330` samples):

| Model Algorithm | Val Accuracy | Val Macro Precision | Val Macro Recall | Val Macro F1 | Val Weighted F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ExtraTreesClassifier** 🏆 | **0.9939** | **0.9943** | **0.9939** | **0.9939** | **0.9939** |
| `RandomForestClassifier` | `0.9909` | `0.9915` | `0.9909` | `0.9909` | `0.9909` |
| `HistGradientBoostingClassifier` | `0.9879` | `0.9890` | `0.9879` | `0.9878` | `0.9878` |
| `GradientBoostingClassifier` | `0.9848` | `0.9859` | `0.9848` | `0.9848` | `0.9848` |
| `KNeighborsClassifier` | `0.9848` | `0.9861` | `0.9848` | `0.9848` | `0.9848` |

---

## 9. Best Model Selection Reason

`ExtraTreesClassifier` (Pipeline with `StandardScaler`) was selected as the winner:
- **Highest Validation F1 Score**: `99.39%`
- **Superior Probability Calibration**: Extremely smooth ensemble probability estimates (`predict_proba`) essential for ranking Top-3 crop recommendations.
- **Robustness**: Reduces variance by randomizing split thresholds across decision trees.

---

## 10. Final Test Results

The selected `ExtraTreesClassifier` pipeline was evaluated **once** on the completely unseen 15% Test set (`330` samples):

| Metric | Test Set Score |
| :--- | :--- |
| **Test Accuracy** | **99.39%** (`0.9939`) |
| **Test Macro Precision** | **99.43%** (`0.9943`) |
| **Test Macro Recall** | **99.39%** (`0.9939`) |
| **Test Macro F1 Score** | **99.39%** (`0.9939`) |
| **Test Weighted F1 Score** | **99.39%** (`0.9939`) |

---

## 11. Confusion Matrix Summary

- **Total Test Predictions**: 330
- **Correct Predictions**: 328
- **Misclassifications**: 2 samples (1 sample between legume classes `blackgram`/`mothbeans` due to near-identical NPK & moisture bounds).

---

## 12. Top-3 Recommendation Method

The model outputs softmax class probability vectors for all 22 crops via `predict_proba()`. The system sorts probabilities in descending order to return:
1. **Top 1 Recommended Crop** + Confidence Score
2. **Top 2 Recommended Crop** + Confidence Score
3. **Top 3 Recommended Crop** + Confidence Score

> [!IMPORTANT]
> Confidence scores represent **model class probabilities** (e.g., `0.91` confidence = 91% probability that environmental parameters match this crop class). They do **not** represent guaranteed yield or crop survival probabilities.

---

## 13. Input Range Validation Method

To detect telemetry anomalies or out-of-range sensor readings, the system records observed training feature boundaries:

- `NORMAL`: All 7 input parameters are inside training boundaries.
- `CAUTION`: 1 parameter is slightly outside training boundaries.
- `LOW`: 2 or more parameters are severely outside training boundaries (returns warning flags).

---

## 14. AgriSurge Compatibility Mapping

The model predicts 22 crops, mapped into two distinct categories:

### A. Supported by Existing AgriSurge Pipeline (5 Overlapping Crops)
These crops can flow directly into AgriSurge's yield prediction and underwriting models:
- `rice` → **`RICE`**
- `maize` → **`MAIZE`**
- `chickpea` → **`CHICKPEA`**
- `cotton` → **`COTTON`**
- `pigeonpeas` → **`PIGEONPEA`**

### B. Recommendation-Only Crops (17 Crops)
These crops are recommended for soil suitability, but do not yet have historical APY yield models in AgriSurge:
`apple`, `banana`, `blackgram`, `coconut`, `coffee`, `grapes`, `jute`, `kidneybeans`, `lentil`, `mango`, `mothbeans`, `mungbean`, `muskmelon`, `orange`, `papaya`, `pomegranate`, `watermelon`.

---

## 15. Important Limitations

1. **Synthetic / Lab Nature**: High accuracy (99.39%) reflects tightly clustered training data. Real-world soil test variability may be higher.
2. **Missing AgriSurge Crops**: 7 core Maharashtra crops (`WHEAT`, `SOYABEAN`, `SUGARCANE`, `KHARIF SORGHUM`, `RABI SORGHUM`, `PEARL MILLET`, `GROUNDNUT`) are absent from this 22-class CSV dataset.
3. **Yield Disconnect**: Suitability score does not guarantee crop yield or financial returns.

---

## 16. Real IoT Integration Plan

When AgriSurge IoT hardware (ESP32 node) is connected:
1. Sensor hardware feeds N, P, K, Temperature, Humidity, pH, Rainfall readings into `/api/risk/analyze` or `/api/crop-recommendation`.
2. Out-of-range boundaries check telemetry validity.
3. Top-3 crops are displayed on the frontend UI card.

---

## 17. Future Improvements

1. Augment training dataset with Maharashtra regional agricultural university NPK soil test data for Wheat, Soybean, and Sugarcane.
2. Connect API endpoint `/api/crop-recommendation` to serve predictions dynamically to the frontend.

---

*Report prepared for AgriSurge Machine Learning Platform.*
