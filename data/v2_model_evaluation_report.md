# AgriSurge V2 — Model Evaluation Report

> Generated: 2026-08-14 23:50
> V2 Hybrid Approach: All 13,169 ICRISAT records + 14 real IMD weather features

## 1. Dataset

| Property | Value |
|---|---|
| Total rows | 13,169 |
| Train (1967-2012) | 11,886 |
| Validation (2013-2016) | 1,027 |
| Test (2017 only) | 256 |
| Train rows with weather | 0 (0%) |
| Val rows with weather | 523 (51%) |
| Test rows with weather | 256 (100%) |
| Total weather features | 14 new V2 features |
| Total V1 features | 9 (4 categorical, 5 numerical) |
| Total V2 features | 23 (4 categorical, 19 numerical) |

## 2. V2 Model Comparison (Validation Set)

| Model | Val MAE | Val RMSE | Val R2 |
|---|---|---|---|
| Ridge Regression [BEST] | 444.27 | 677.25 | 0.8846 |
| Random Forest | 453.9 | 714.47 | 0.8716 |
| HistGradientBoosting | 455.71 | 717.8 | 0.8704 |
| Gradient Boosting | 461.22 | 728.94 | 0.8664 |
| DummyRegressor (Baseline) | 1170.78 | 1999.51 | -0.0055 |

## 3. V1 vs V2 — Head-to-Head Comparison

> Note: V1 test set = 2013-2017 (5 years). V2 test set = 2017 only (stricter).

| Metric | V1 Model | V2 Model | Change |
|---|---|---|---|
| Best model | HistGradientBoosting | Ridge Regression | |
| Features | 9 | 23 (+14 weather) | +14 IMD features |
| Test period | 2013-2017 (5 yr) | 2017 only (1 yr, 100% weather) | Stricter |
| Test R2 | 0.8903 | 0.9181 | (different test sets) |
| Test MAE | 419.13 Kg/ha | 308.93 Kg/ha | |
| Weather on test set | 5.9% avg (2013-2017) | 100% (2017 only) | Full coverage |
| V1 model file | ml/models/agrisurge_model.joblib | ml/models/agrisurge_model_v2.joblib | Separate |

## 4. Best V2 Model — Test Set (2017)

**Model:** Ridge Regression

| Metric | Value |
|---|---|
| MAE | 308.93 Kg/ha |
| RMSE | 566.44 Kg/ha |
| R2 | 0.9181 |
| Test year | 2017 (100% IMD weather coverage) |

## 5. Feature Importance (Permutation — Validation Set)

| Feature | Importance (delta-R2) | Std |
|---|---|---|
| prev_yield_kg_ha | 0.4469 | 0.0175 |
| hist5y_mean_yield | 0.1807 | 0.0080 |
| prev2_yield_kg_ha | 0.0428 | 0.0033 |
| prev_area_1000ha | 0.0141 | 0.0017 |
| area_1000ha | 0.0137 | 0.0016 |
| season | 0.0004 | 0.0008 |
| district | 0.0001 | 0.0001 |
| v2_max_consecutive_rainy_days [NEW] | 0.0000 | 0.0000 |
| state | 0.0000 | 0.0000 |
| v2_annual_rainfall [NEW] | 0.0000 | 0.0000 |
| v2_kharif_rainfall [NEW] | 0.0000 | 0.0000 |
| v2_rabi_rainfall [NEW] | 0.0000 | 0.0000 |
| v2_rainy_days [NEW] | 0.0000 | 0.0000 |
| v2_dry_days [NEW] | 0.0000 | 0.0000 |
| v2_max_daily_rainfall [NEW] | 0.0000 | 0.0000 |
| v2_kharif_rf_90d_preharvest [NEW] | 0.0000 | 0.0000 |
| v2_max_consecutive_dry_days [NEW] | 0.0000 | 0.0000 |
| v2_kharif_rf_7d_preharvest [NEW] | 0.0000 | 0.0000 |
| v2_kharif_rf_30d_preharvest [NEW] | 0.0000 | 0.0000 |
| v2_rabi_rf_30d_preharvest [NEW] | 0.0000 | 0.0000 |

## 6. V2 Limitations (Unchanged from V1)

| Limitation | Detail |
|---|---|
| Geographic level | District only — not farm or village |
| No crop variety | ICRISAT does not contain variety-level data |
| IMD is state-average | All districts get the same rainfall; not spatially disaggregated |
| 94.1% of training rows lack weather | Only 2015-2017 overlap — weather learns from a narrow window |
| No temperature / humidity / NDVI | Not available in any provided dataset |
| Target is yield, not loss | No genuine crop-failure label exists |
| ICRISAT ends 2017 | 8-year gap to present — no modern agricultural reference data |

## 7. Path to a Fully Weather-Enriched V3

To achieve 100% IMD weather coverage across all training rows:
1. Provide district-level agricultural data (area, production, yield) for **2018-2025**
   in the same format as ICRISAT (district x crop x year)
2. This immediately fills the 2018-2025 IMD years, giving ~11 fully-enriched years
3. With post-2015 data: train on 2015-2022, validate 2023, test 2024-2025
4. A V3 enhancement: spatially disaggregate IMD grid cells to districts using shapefiles