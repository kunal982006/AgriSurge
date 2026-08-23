# Crop Recommendation Dataset Analysis Report — AgriSurge

> **File Analyzed**: [`Crop_recommendation.csv`](file:///c:/Ronit%20Documents/AgriSurge/Crop_recommendation.csv)  
> **Report Target**: `data/crop_recommendation_analysis_report.md`  
> **Phase**: Data Quality Inspection & Feasibility Analysis (No ML Model Training Executed)  
> **Date**: August 23, 2026  

---

## 1. Dataset Summary

The dataset `Crop_recommendation.csv` provides soil nutrient levels (Nitrogen, Phosphorus, Potassium), climatic conditions (Temperature, Humidity, Rainfall), and Soil pH levels linked to optimal crop suitability.

| Metric | Value |
| :--- | :--- |
| **Total Rows** | `2,200` |
| **Total Columns** | `8` |
| **Feature Columns** | `7` (`N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`) |
| **Target Column** | `1` (`label`) |
| **Unique Crops** | `22` |
| **File Format** | Comma-Separated Values (CSV) |
| **Data Cleanliness** | 100% Complete (0 Missing Values, 0 Duplicates) |

---

## 2. Dataset Structure

| Column Name | Data Type | Role | Description & Unit |
| :--- | :--- | :--- | :--- |
| `N` | `int64` | Numerical Input Feature | Ratio of Nitrogen content in soil (`mg/kg`) |
| `P` | `int64` | Numerical Input Feature | Ratio of Phosphorus content in soil (`mg/kg`) |
| `K` | `int64` | Numerical Input Feature | Ratio of Potassium content in soil (`mg/kg`) |
| `temperature` | `float64` | Numerical Input Feature | Ambient air temperature in degrees Celsius (`°C`) |
| `humidity` | `float64` | Numerical Input Feature | Relative humidity in percentage (`%`) |
| `ph` | `float64` | Numerical Input Feature | Soil pH value (`0.0 - 14.0`) |
| `rainfall` | `float64` | Numerical Input Feature | Annual / seasonal rainfall in millimeters (`mm`) |
| `label` | `object` (`str`) | Target Class Label | Suitable crop category (`22 classes`) |

### Sample Data Preview (First 5 Rows)
```csv
N,P,K,temperature,humidity,ph,rainfall,label
90,42,43,20.879744,82.002744,6.502985,202.935536,rice
85,58,41,21.770462,80.319644,7.038096,226.655537,rice
60,55,44,23.004459,82.320763,7.840207,263.964248,rice
74,35,40,26.491096,80.158363,6.980401,242.864034,rice
78,42,42,20.130175,81.604873,7.628473,262.717340,rice
```

---

## 3. Data Quality Results

- **Data Integrity**: Excellent. No corrupted formatting, invalid delimiters, or broken rows found.
- **Data Types**: All 7 input features are numerical (`int64` / `float64`), perfectly suited for Machine Learning modeling.
- **Target Consistency**: All crop labels are lowercase strings without leading or trailing spaces.

---

## 4. Missing Value Analysis

- **Total Null / Missing Cells**: `0` (0.00%)
- Every single row contains complete data across all 8 fields.

---

## 5. Duplicate Analysis

- **Total Duplicate Rows**: `0` (0.00%)
- Every sample in the 2,200 rows is a unique observation.

---

## 6. Feature Statistics

The overall statistical distribution across all 2,200 records:

| Feature | Min | Max | Mean | Median | Std Dev |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **N** (Nitrogen) | `0.00` | `140.00` | `50.55` | `37.00` | `36.92` |
| **P** (Phosphorus) | `5.00` | `145.00` | `53.36` | `51.00` | `32.99` |
| **K** (Potassium) | `5.00` | `205.00` | `48.15` | `32.00` | `50.65` |
| **temperature** (°C) | `8.83` | `43.68` | `25.62` | `25.60` | `5.06` |
| **humidity** (%) | `14.26` | `99.98` | `71.48` | `80.47` | `22.26` |
| **ph** (pH) | `3.50` | `9.94` | `6.47` | `6.43` | `0.77` |
| **rainfall** (mm) | `20.21` | `298.56` | `103.46` | `94.87` | `54.96` |

---

## 7. Crop Distribution

The dataset contains `22` crop categories.

| Crop Label | Row Count | Percentage |
| :--- | :--- | :--- |
| `rice` | 100 | 4.55% |
| `maize` | 100 | 4.55% |
| `chickpea` | 100 | 4.55% |
| `kidneybeans` | 100 | 4.55% |
| `pigeonpeas` | 100 | 4.55% |
| `mothbeans` | 100 | 4.55% |
| `mungbean` | 100 | 4.55% |
| `blackgram` | 100 | 4.55% |
| `lentil` | 100 | 4.55% |
| `pomegranate` | 100 | 4.55% |
| `banana` | 100 | 4.55% |
| `mango` | 100 | 4.55% |
| `grapes` | 100 | 4.55% |
| `watermelon` | 100 | 4.55% |
| `muskmelon` | 100 | 4.55% |
| `apple` | 100 | 4.55% |
| `orange` | 100 | 4.55% |
| `papaya` | 100 | 4.55% |
| `coconut` | 100 | 4.55% |
| `cotton` | 100 | 4.55% |
| `jute` | 100 | 4.55% |
| `coffee` | 100 | 4.55% |
| **TOTAL** | **2,200** | **100.00%** |

---

## 8. List of All Crop Labels

All 22 unique crop labels present in `Crop_recommendation.csv`:
1. `apple`
2. `banana`
3. `blackgram`
4. `chickpea`
5. `coconut`
6. `coffee`
7. `cotton`
8. `grapes`
9. `jute`
10. `kidneybeans`
11. `lentil`
12. `maize`
13. `mango`
14. `mothbeans`
15. `mungbean`
16. `muskmelon`
17. `orange`
18. `papaya`
19. `pigeonpeas`
20. `pomegranate`
21. `rice`
22. `watermelon`

---

## 9. Dataset Balance Analysis

- **Balance Status**: **PERFECTLY BALANCED**
- **Count per Class**: Exactly `100` records per crop class across all 22 crops.
- **Impact on ML**:
  - No class imbalance mitigation (e.g. SMOTE, class weighting) is required.
  - Standard accuracy, F1-score, precision, and recall metrics will be directly interpretable without bias toward majority classes.

---

## 10. Feature Range Analysis by Crop Group

Key observations on distinct feature clusters:
- **High Potassium (K)**: `grapes` (K: 195–205) and `apple` (K: 195–205) require exceptionally high potassium levels compared to staple grains (K: 15–45).
- **High Nitrogen (N)**: `cotton` (N: 110–140), `coffee` (N: 80–120), and `rice` (N: 60–90) require heavy nitrogen inputs.
- **High Rainfall**: `rice` (182–298 mm), `coconut` (140–225 mm), and `jute` (150–199 mm) cluster at high moisture levels.
- **Dry / Low Rainfall**: `mothbeans` (35–75 mm) and `mungbean` (36–72 mm) thrive under low rainfall conditions.
- **pH Extremes**: Most crops cluster around pH `5.5 - 7.5`, with `mothbeans` tolerating higher pH up to `9.9`.

---

## 11. AgriSurge Crop Comparison

Comparison between the 22 crops in `Crop_recommendation.csv` and the 12 core crops in AgriSurge / Maharashtra APY dataset:

### Existing AgriSurge Supported Crops (12 Crops)
`RICE`, `WHEAT`, `KHARIF SORGHUM`, `RABI SORGHUM`, `PEARL MILLET`, `MAIZE`, `CHICKPEA`, `PIGEONPEA`, `GROUNDNUT`, `SOYABEAN`, `SUGARCANE`, `COTTON`

### Comparison Results

| Category | Crops Included | Count |
| :--- | :--- | :--- |
| **Crops in Both Datasets** | `rice` (RICE), `maize` (MAIZE), `chickpea` (CHICKPEA), `cotton` (COTTON), `pigeonpeas` (PIGEONPEA) | **5** |
| **Crops in CSV but NOT in AgriSurge** | `apple`, `banana`, `blackgram`, `coconut`, `coffee`, `grapes`, `jute`, `kidneybeans`, `lentil`, `mango`, `mothbeans`, `mungbean`, `muskmelon`, `orange`, `papaya`, `pomegranate`, `watermelon` | **17** |
| **Crops in AgriSurge but MISSING in CSV** | `WHEAT`, `KHARIF SORGHUM` (Jowar), `RABI SORGHUM` (Jowar), `PEARL MILLET` (Bajra), `GROUNDNUT`, `SOYABEAN` (Soybean), `SUGARCANE` | **7** |

---

## 12. Maharashtra Relevance Notes

1. **High Relevance Crops**:
   - `cotton`, `chickpea`, `maize`, `rice`, `pigeonpeas`, `grapes`, `pomegranate`, `banana`, `mango`, `orange` are major agricultural commodities produced across Maharashtra districts (e.g. Nashik grapes, Solapur pomegranate, Vidarbha cotton, Marathwada pulses).
2. **Missing Key Maharashtra Crops**:
   - `SUGARCANE` (major cash crop in Western Maharashtra like Kolhapur/Sangli) is missing from this generic dataset.
   - `SOYABEAN` (dominant pulse/oilseed in Latur/Nanded) is missing.
   - `KHARIF / RABI SORGHUM` (Jowar) & `PEARL MILLET` (Bajra) (staple dryland grains in Solapur/Ahmednagar) are missing.
   - `WHEAT` is missing.

---

## 13. Potential Issues or Limitations

1. **Missing Key Staple Crops for AgriSurge**:
   - 7 major crops from AgriSurge (Wheat, Soybean, Sugarcane, Sorghum, Pearl Millet, Groundnut) are not present in `Crop_recommendation.csv`.
2. **Naming Convention Discrepancy**:
   - Plural vs Singular (`pigeonpeas` vs `PIGEONPEA`, `soybeans` if added).
3. **Synthetic / Laboratory Feature Separability**:
   - The feature clusters in `Crop_recommendation.csv` show minimal variance per crop, suggesting the dataset was synthetically generated or sampled under controlled experimental conditions. While this yields near 99% accuracy in ML training, real-world farm soil test data may exhibit higher noise and variance.

---

## 14. Recommendations for the Next Training Phase

1. **Label Standardization**:
   - Normalize target crop names to uppercase matching AgriSurge conventions (e.g. `pigeonpeas` -> `PIGEONPEA`).
2. **Dataset Augmentation / Multi-Model Strategy**:
   - For crops present in `Crop_recommendation.csv` (22 crops), train a dedicated Crop Recommendation classifier (RandomForest / XGBoost / LightGBM).
   - For AgriSurge crops missing in the CSV (Wheat, Soybean, Sugarcane, Sorghum), supplement with soil range guidelines or regional APY datasets during Phase 2 training.
3. **Pipeline Structure**:
   - Keep `Crop_recommendation.csv` as the baseline training set in `data/Crop_recommendation.csv`.
   - Save trained model artifacts into `ml-service/models/crop_recommendation.joblib` or `lib/ml/models/` when authorized for the next training phase.

---

*Report generated automatically for AgriSurge ML Engineering Pipeline.*
