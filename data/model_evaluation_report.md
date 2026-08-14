# AgriSurge — Model Evaluation Report

> Generated: 2026-08-14 23:32

## 1. Dataset Summary

| Property | Value |
|---|---|
| Training rows | 10,052 |
| Validation rows | 1,834 |
| Test rows | 1,283 |
| Train years | 1967 – 2005 |
| Val years | 2006 – 2012 |
| Test years | 2013 – 2017 |
| Crops | ['CHICKPEA', 'COTTON', 'GROUNDNUT', 'KHARIF SORGHUM', 'MAIZE', 'PEARL MILLET', 'PIGEONPEA', 'RABI SORGHUM', 'RICE', 'SOYABEAN', 'SUGARCANE', 'WHEAT'] |
| Districts | 26 |
| IMD Rainfall Features | Yes |

## 2. Model Comparison (Validation Set)

| Model | MAE (Kg/ha) | RMSE (Kg/ha) | R² |
|---|---|---|---|
| Ridge Regression [BEST] | 286.42 | 465.84 | 0.938 |
| HistGradientBoosting | 288.75 | 469.2 | 0.9371 |
| Random Forest | 290.49 | 469.16 | 0.9371 |
| Gradient Boosting | 295.26 | 481.89 | 0.9337 |
| DummyRegressor (Baseline) | 1050.13 | 1885.8 | -0.0158 |

## 3. Best Model — Test Set Performance

**Model:** Ridge Regression

| Metric | Value |
|---|---|
| MAE | 419.13 Kg/ha |
| RMSE | 659.59 Kg/ha |
| R² | 0.8903 |

## 4. Feature Importance (Permutation — Validation Set)

| Feature | Importance (ΔR²) | Std |
|---|---|---|
| prev_yield_kg_ha | 0.5385 | 0.0096 |
| hist5y_mean_yield | 0.1618 | 0.0044 |
| prev2_yield_kg_ha | 0.0454 | 0.0018 |
| prev_area_1000ha | 0.0144 | 0.0005 |
| area_1000ha | 0.0119 | 0.0005 |
| season | 0.0043 | 0.0004 |
| crop | 0.0022 | 0.0004 |
| district | 0.0000 | 0.0000 |
| state | 0.0000 | 0.0000 |
| annual_rainfall | 0.0000 | 0.0000 |
| kharif_rainfall | 0.0000 | 0.0000 |
| rabi_rainfall | 0.0000 | 0.0000 |
| rainy_days | 0.0000 | 0.0000 |
| dry_days | 0.0000 | 0.0000 |
| max_daily_rainfall | 0.0000 | 0.0000 |

## 5. Why This Model Was Selected

The **Ridge Regression** was selected based on the highest R² on the held-out validation set (years 2006–2012). It outperformed the dummy baseline and shows a better balance of bias and variance than simpler linear models for this agricultural yield regression task.

## 6. Limitations

| Limitation | Detail |
|---|---|
| Geographic level | District-level only. Not village or farm level. |
| No crop variety | ICRISAT does not contain variety-level data. |
| IMD overlap | IMD files (2015–2025) overlap only 3 years of ICRISAT (2015–2017). |
| No soil data | Soil type not in any source dataset. |
| No temperature | No temperature time series in current datasets. |
| Target is yield | No genuine crop-failure binary label exists. |
| Time series | Crop yields are serially correlated; cross-validation requires care. |

## 7. Risk Score Derivation Methodology

The model predicts `yield_kg_ha`. A risk score is derived as:

```
yield_deviation = (predicted_yield - historical_mean_yield) / historical_mean_yield
risk_score = clip(1.0 - yield_deviation, 0, 1)  # higher deviation = higher risk
```
This is NOT a probability of failure. It is a relative yield-deviation score.
A `yield_deviation < -0.25` (>25% shortfall) triggers HIGH risk classification.

## 8. Additional Data Required

- Multi-decade district-level weather (temperature, humidity) for Maharashtra
- Crop variety-level yield records
- Farm-level satellite NDVI / soil moisture time series
- Historical crop insurance claim data (for a real crop-failure classification target)
