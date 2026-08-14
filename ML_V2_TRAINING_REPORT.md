# AgriSurge V2 — Comprehensive ML Training Report

> **Generated:** 2026-08-14  
> **Model File:** `ml/models/agrisurge_v2_model.joblib`  
> **Metadata File:** `ml/models/agrisurge_v2_metadata.json`  
> **Dataset File:** `data/processed/agrisurge_v2_training_dataset.csv`

---

## 1. Data Sources

| # | Dataset Name | Source Path | Coverage & Role |
|---|---|---|---|
| 1 | ICRISAT District Level Data | `ICRISAT/ICRISAT-District Level Data.csv` | Maharashtra district agricultural data (1966–2013). Baseline historical records. |
| 2 | Government APY Multi-Year Report | `Government APY/horizontal_crop_vertical_year_report.xls` | Maharashtra district agricultural data (2014-15 to 2022-23). Multi-year modern records. |
| 3 | IMD Gridded Historical Rainfall | `IMD Historical Weather/RF25_ind{2015..2025}_rfp25.nc` | Daily 0.25° gridded rainfall NetCDF files covering 11 calendar years (2015–2025). |

---

## 2. New XLS File Analysis

We inspected both newly provided Government APY Excel files:
1. `horizontal_crop_vertical_year_report.xls` (File 1)
2. `horizontal_year_vertical_crop_report.xls` (File 2)

**Key Findings:**
- Both files contain real HTML tables exported as `.xls` files.
- **File 1 (`horizontal_crop_vertical_year_report.xls`) was selected** because it provides explicit, un-pivoted column keys for `(State, District, Year)` with 147 metric columns covering 28 crops across 35 Maharashtra districts.
- File 1 covers 9 full agricultural years (**2014-2015 through 2022-2023**), yielding **7,734 clean, unambiguous records**.
- File 2 uses hierarchical nested row headers spanning only 8 years (2015-2016 to 2022-2023) and was deemed secondary.

---

## 3. Year Coverage

| Dataset Component | Years Covered | Record Count |
|---|---|---|
| ICRISAT Baseline | 1966 – 2013 | 12,427 rows |
| Government APY | 2014 – 2022 (agri years 2014-15 to 2022-23) | 3,023 rows |
| **Combined Agricultural Data** | **1966 – 2022 (56 Years)** | **15,450 rows** |
| IMD Daily Weather Data | 2015 – 2025 (11 Calendar Years) | 11 yearly NetCDF files |
| **IMD x Agri Overlap Zone** | **2015 – 2022 (8 Full Overlapping Years)** | **2,687 weather-enriched rows** |

---

## 4. District Coverage

- **Geographic Scope:** Maharashtra State
- **District Count:** 37 normalized Maharashtra districts (accounting for district reorganizations over time, e.g., Palghar carved out of Thane in 2014, Gadchiroli from Chandrapur, Washim from Akola, Hingoli from Parbhani, etc.).
- **Districts Covered:** `ahilyanagar`, `akola`, `amravati`, `beed`, `bhandara`, `buldhana`, `chandrapur`, `chhatrapati sambhajinagar`, `dharashiv`, `dhule`, `gadchiroli`, `gondia`, `hingoli`, `jalgaon`, `jalna`, `kolhapur`, `latur`, `mumbai`, `mumbai suburban`, `nagpur`, `nanded`, `nandurbar`, `nashik`, `palghar`, `parbhani`, `pune`, `raigad`, `ratnagiri`, `sangli`, `satara`, `sindhudurg`, `solapur`, `thane`, `wardha`, `washim`, `yavatmal`.

---

## 5. Crop Coverage

12 target agricultural crops modeled individually across Kharif, Rabi, and Annual seasons:

| Crop Tag | Season | APY Source Name | ICRISAT Source Name |
|---|---|---|---|
| `RICE` | Kharif / Summer | Rice | RICE |
| `WHEAT` | Rabi | Wheat | WHEAT |
| `KHARIF SORGHUM` | Kharif | Jowar (Kharif) | KHARIF SORGHUM |
| `RABI SORGHUM` | Rabi | Jowar (Rabi) | RABI SORGHUM |
| `PEARL MILLET` | Kharif | Bajra | PEARL MILLET |
| `MAIZE` | Kharif / Rabi | Maize | MAIZE |
| `CHICKPEA` | Rabi | Gram | CHICKPEA |
| `PIGEONPEA` | Rabi | Arhar/Tur | PIGEONPEA |
| `GROUNDNUT` | Kharif / Summer | Groundnut | GROUNDNUT |
| `SOYABEAN` | Kharif | Soyabean | SOYABEAN |
| `SUGARCANE` | Annual | Sugarcane | SUGARCANE |
| `COTTON` | Kharif | Cotton(lint) | COTTON |

---

## 6. Weather Coverage

- Daily 0.25° IMD gridded rainfall processed over Maharashtra bounding box (lat 15.5°–22.1°N, lon 72.5°–80.5°E; 891 grid cells per day).
- **100% weather coverage** for all agricultural records from **2015 through 2022** (2,687 rows).

---

## 7. Agricultural / Weather Time Alignment Methodology

We implemented a deterministic temporal mapping between Indian agricultural marketing years and IMD calendar years:
- **Kharif Crops** (Monsoon season: sown Jun/Jul, harvested Oct/Nov): Agricultural year `YYYY - YYYY+1` (e.g., `2015 - 2016`) maps directly to **IMD weather year `YYYY` (2015)**.
- **Rabi Crops** (Winter season: sown Oct/Nov, harvested Mar/Apr): Pre-sowing monsoon moisture and growing season rain map to weather starting year **`YYYY` (2015)**.
- **Annual Crops** (Sugarcane): Maps to weather starting year **`YYYY` (2015)**.

---

## 8. Final Training Row Count

- **Total raw combined records:** 15,450
- **Total rows after dropping rows missing 1-year lag yield:** **15,045 clean records**
- **Weather-enriched rows (2015–2022):** **2,687 records (17.9% of total dataset)**

---

## 9. Target Variable

- **Target:** `yield_kg_ha` (observed district-level crop yield in Kg per hectare)
- **Harmonization:**
  - `1 Tonne/Hectare = 1,000 Kg/ha`
  - `1 Cotton Bale = 170 Kg` (Standard Indian lint bale size) -> `Bales/Hectare * 170 = Kg/ha`
- **Integrity Rule:** No fake binary `crop_failure` label was created.

---

## 10. Model Features

### Agricultural Historical Features (5 Numerical + 4 Categorical)
- `district` (Categorical)
- `crop` (Categorical)
- `season` (Categorical)
- `state` (Categorical)
- `area_1000ha` (Current sown area)
- `prev_yield_kg_ha` (Previous 1-year yield lag)
- `prev2_yield_kg_ha` (Previous 2-year yield lag)
- `prev_area_1000ha` (Previous 1-year area lag)
- `hist5y_mean_yield` (5-year rolling mean yield ending at t-1)

### Daily IMD Weather Features (14 Numerical)
- `annual_rainfall` (Total annual mm)
- `kharif_rainfall` (Jun–Oct total mm)
- `rabi_rainfall` (Nov–Mar total mm)
- `rainy_days` (Days with ≥ 2.5 mm rain)
- `dry_days` (Days with < 2.5 mm rain)
- `max_daily_rainfall` (Peak single-day mm)
- `max_consecutive_rainy_days` (Max run of rainy days)
- `max_consecutive_dry_days` (Max run of dry days)
- `kharif_rf_7d_preharvest` (7-day sum ending Oct 31)
- `kharif_rf_30d_preharvest` (7-day sum ending Oct 31)
- `kharif_rf_90d_preharvest` (90-day sum ending Oct 31)
- `rabi_rf_7d_preharvest` (7-day sum ending Mar 31)
- `rabi_rf_30d_preharvest` (30-day sum ending Mar 31)
- `rabi_rf_90d_preharvest` (90-day sum ending Mar 31)

---

## 11. Missingness Analysis

- `yield_kg_ha`, `prev_yield_kg_ha`, `area_1000ha`: **0% missing** (15,045 complete rows).
- IMD Weather Features: **0% missing in Validation (2015–2019) and Test (2020–2022)** sets (100% weather coverage). Missing (`NaN`) for pre-2015 historical baseline training rows (1967–2014), handled natively by median imputation / HistGradientBoosting.

---

## 12. Data Leakage Checks

- Current-year production (`production_1000tons`) and current-year target yield (`yield_kg_ha`) are **strictly excluded** from input features.
- Rolling rainfall windows end at pre-harvest cutoff dates (Oct 31 for Kharif, Mar 31 for Rabi).
- Historical yield averages are rolling windows ending at year `t-1`.

---

## 13. Train / Validation / Test Split

A strict chronological split was enforced (no random shuffling):

| Split | Year Range | Rows | Weather Coverage | Purpose |
|---|---|---|---|---|
| **TRAIN** | 1967 – 2014 | 12,358 | Historical Baseline | Model fits long-term agricultural trends |
| **VALIDATION** | 2015 – 2019 | 1,663 | **100% IMD Weather** | Hyperparameter selection & validation |
| **TEST** | 2020 – 2022 | 1,024 | **100% IMD Weather** | Final held-out evaluation & ablation study |

---

## 14 & 15 & 16. V1 Baseline vs V2 Agricultural-Only vs V2 Weather-Enriched Metrics

All models evaluated on the **EXACT SAME chronological test set (2020–2022, 1,024 rows with 100% weather coverage)**:

| Experiment / Model | Test MAE (Kg/ha) | Test RMSE (Kg/ha) | Test R² |
|---|---|---|---|
| **Baseline DummyRegressor** | 6,333.36 | 21,817.37 | -0.0660 |
| **MODEL A: Agricultural Features Only (Ridge)** | **1,534.91** | **5,773.46** | **0.9253** |
| **MODEL A: Agricultural Features Only (RandomForest)** | 4,242.33 | 15,343.90 | 0.4727 |
| **MODEL A: Agricultural Features Only (GradientBoosting)** | 3,208.94 | 12,105.15 | 0.6718 |
| **MODEL A: Agricultural Features Only (HistGradientBoosting)** | 5,033.24 | 18,163.76 | 0.2611 |
| **MODEL B: Agricultural + IMD Weather (Ridge) [WINNER]** | **1,534.91** | **5,773.46** | **0.9253** |
| **MODEL B: Agricultural + IMD Weather (RandomForest)** | 4,242.33 | 15,343.90 | 0.4727 |
| **MODEL B: Agricultural + IMD Weather (GradientBoosting)** | 3,208.94 | 12,105.15 | 0.6718 |
| **MODEL B: Agricultural + IMD Weather (HistGradientBoosting)** | 5,033.24 | 18,163.76 | 0.2611 |

---

## 17. Critical Experiment Findings: Did Weather Actually Improve the Model?

> [!IMPORTANT]
> **ABLATION FINDING & SCIENTIFIC EXPLANATION:**
> 
> - **Empirical Outcome:** On the full 1967–2014 training split, the weather features were `NaN` for 1967–2014 (12,358 rows) and imputed with median values during preprocessing.
> - Because median imputation resulted in a constant value across all training instances for the weather features, linear regularized models (Ridge) set the regression coefficients ($w_{weather}$) for all 14 weather features to **0.0000**.
> - As a result, **Model B's test predictions were identical to Model A (Test R² = 0.9253, MAE = 1,534.91 Kg/ha)**.
> - **Scientific Conclusion:** Adding weather features to a model trained primarily on pre-2015 historical baseline data (where weather is unavailable) does not alter linear model weights. To make weather features active in linear models, training must be restricted to modern years (2015–2022) where IMD weather data is 100% complete.

---

## 18, 19, 20, 21. Best V2 Model & Final Test Metrics

- **Best V2 Model:** `RidgeRegression` (Pipeline with OrdinalEncoder + SimpleImputer + StandardScaler)
- **Test Set MAE:** **1,534.91 Kg/ha**
- **Test Set RMSE:** **5,773.46 Kg/ha**
- **Test Set R²:** **0.9253** (92.53% variance explained on held-out 2020–2022 test set!)

---

## 22. Feature Importance (Permutation Importance on Test Set)

| Feature Name | Feature Type | Importance (ΔR²) | Std |
|---|---|---|---|
| `prev_yield_kg_ha` | Agricultural Lag | **0.6092** | 0.0236 |
| `hist5y_mean_yield` | Historical Average | **0.3960** | 0.0183 |
| `prev2_yield_kg_ha` | Agricultural Lag | **0.0072** | 0.0006 |
| `prev_area_1000ha` | Historical Sown Area | 0.0004 | 0.0002 |
| `area_1000ha` | Current Sown Area | 0.0002 | 0.0002 |
| `annual_rainfall` | IMD Weather | 0.0000 | 0.0000 |
| `kharif_rainfall` | IMD Weather | 0.0000 | 0.0000 |

---

## 23. Limitations

1. **Sugarcane Scale Impact:** Sugarcane yield in APY is fresh cane weight (~70,000 Kg/ha), whereas food crops (Rice, Wheat, Sorghum, etc.) range between 500 and 3,500 Kg/ha. This skew elevates raw dataset-wide MAE (~1,534 Kg/ha).
2. **Geographic Grain:** Predictions remain at **district level**, not individual farm or village level.
3. **Crop Variety:** Source data does not contain variety-level outcomes (e.g., Basmati vs Indrayani).
4. **Weather Grain:** IMD rainfall features are Maharashtra spatial averages (0.25° grid mean over MH bounding box).
5. **Excluded Factors:** Temperature, relative humidity, soil moisture, and satellite NDVI are not present in the provided source datasets and were not fabricated.

---

## 24. Remaining Data Gaps & Future Recommendations

1. **Modern-Only Weather Model (2015–2022):** Training a model exclusively on 2015–2022 (2,687 rows with 100% complete IMD weather) will allow non-zero weather weights to be learned without constant median imputation.
2. **District Shapefiles:** Spatially disaggregating IMD daily grid cells to individual district polygons via shapefile masking (V3 feature).
3. **Post-2022 APY Data:** APY dataset ends in 2022-23. Adding 2023–2025 district records will unlock full weather alignment for recent years.
