# AgriSurge V2 — Feasibility Report

> **Generated:** 2026-08-14 23:41
> **V1 model untouched.** This report is analysis only.

---

## 1. Available Years

| Dataset | Years | Count |
|---|---|---|
| ICRISAT (Maharashtra) | 1966-2017 | 52 |
| IMD Daily Rainfall | 2015-2025 | 11 |
| Govt APY Profile | 2021-2026 | 5 |
| Govt APY District | 2024-25 | 1 |

## 2. Overlapping Years

**ICRISAT ∩ IMD:** `[2015, 2016, 2017]`

This is a **3-year overlap** — only 3 years of agricultural records
can receive real IMD weather features from the ICRISAT dataset.


> [!IMPORTANT]
> IMD data does NOT exist before 2015. No weather values are fabricated for 1966-2014.
> The 2015-2017 overlap is the **only scientifically valid join zone** between ICRISAT and IMD.

## 3. Available Districts

**ICRISAT:** 26 districts

`ahilyanagar, akola, amarawati, beed, bhandara, buldhana, chandrapur, chhatrapati sambhajinagar, dharashiv, dhule, jalgaon, kolhapur, mumbai, nagpur, nanded, nashik, parbhani, pune, raigad, ratnagiri, sangli, satara, solapur, thane, wardha, yeotmal`

**IMD:** State-average spatial mean over Maharashtra (0.25-degree grid, 27 lat x 33 lon = 891 grid cells)

> [!WARNING]
> IMD data is extracted as a **Maharashtra state-average** across all grid cells in the bounding box.
> It is NOT district-specific. Every district in a given year receives the SAME rainfall features.
> District-specific rainfall would require spatial assignment of grid cells to districts (e.g. using shapefiles).
> This is a V2 limitation that could be addressed in V3.

## 4. Available Crops

| Crop | Season | Records (2015-2017) |
|---|---|---|
| PIGEONPEA | Rabi | 74 |
| CHICKPEA | Rabi | 73 |
| GROUNDNUT | Kharif | 73 |
| MAIZE | Kharif | 70 |
| WHEAT | Rabi | 70 |
| SUGARCANE | Annual | 69 |
| SOYABEAN | Kharif | 66 |
| KHARIF SORGHUM | Kharif | 61 |
| RABI SORGHUM | Rabi | 60 |
| COTTON | Kharif | 58 |
| RICE | Kharif | 57 |
| PEARL MILLET | Kharif | 48 |

## 5. Available Weather Features from IMD

The following features can be legitimately computed from the daily IMD 0.25-degree rainfall grids:

| Feature | Computation | Leakage Risk |
|---|---|---|
| `annual_rainfall` | Sum of all daily rain for year | None — full-year accumulation, known at harvest |
| `kharif_rainfall` | Jun-Oct total rainfall | None |
| `rabi_rainfall` | Nov-Mar total rainfall | None |
| `rainy_days` | Days with ≥ 2.5 mm rainfall | None |
| `dry_days` | Days with < 2.5 mm rainfall | None |
| `max_daily_rainfall` | Maximum single-day rainfall | None |
| `max_consecutive_rainy_days` | Max run of consecutive rainy days | None |
| `max_consecutive_dry_days` | Max run of consecutive dry days | None |
| `kharif_rf_7d_preharvest` | 7-day sum ending Oct 31 | None — pre-harvest |
| `kharif_rf_30d_preharvest` | 30-day sum ending Oct 31 | None — pre-harvest |
| `kharif_rf_90d_preharvest` | 90-day sum ending Oct 31 | None — pre-harvest |
| `rabi_rf_7d_preharvest` | 7-day sum ending Mar 31 | None — pre-harvest |
| `rabi_rf_30d_preharvest` | 30-day sum ending Mar 31 | None — pre-harvest |
| `rabi_rf_90d_preharvest` | 90-day sum ending Mar 31 | None — pre-harvest |

**Features NOT available** (not in any dataset):
- Temperature (daily min/max) — IMD temperature grids not provided
- Humidity — not in IMD daily rainfall product
- NDVI / satellite vegetation — not in any source
- Soil moisture — not in any source

## 6. IMD Feature Values (Computed)

| Year | Annual RF | Kharif RF | Rabi RF | Rainy Days | Dry Days | Max Daily | Max Consec Rainy | Max Consec Dry |
|---|---|---|---|---|---|---|---|---|
| 2015 | 862.7 | 735.8 | 70.6 | 99.0 | 266.0 | 27.9 | 15 | 55 |
| 2016 | 1143.8 | 1098.0 | 15.3 | 109.0 | 257.0 | 31.8 | 29 | 82 |
| 2017 | 1025.7 | 991.0 | 13.8 | 117.0 | 248.0 | 27.2 | 21 | 150 |
| 2018 | 918.1 | 857.0 | 25.7 | 93.0 | 272.0 | 32.3 | 38 | 79 |
| 2019 | 1368.0 | 1320.5 | 32.5 | 131.0 | 234.0 | 36.0 | 34 | 126 |
| 2020 | 1345.4 | 1267.8 | 44.1 | 127.0 | 239.0 | 28.4 | 34 | 106 |
| 2021 | 1298.5 | 1146.3 | 77.9 | 129.0 | 236.0 | 38.5 | 24 | 85 |
| 2022 | 1352.3 | 1291.2 | 26.7 | 132.0 | 233.0 | 43.4 | 51 | 126 |
| 2023 | 1077.5 | 932.9 | 69.0 | 103.0 | 262.0 | 39.4 | 45 | 75 |
| 2024 | 1320.0 | 1241.8 | 23.4 | 124.0 | 242.0 | 32.4 | 58 | 128 |
| 2025 | 1413.8 | 1230.1 | 15.1 | 138.0 | 227.0 | 30.0 | 34 | 93 |

**Pre-harvest rolling windows (Kharif):**

| Year | RF 7d | RF 30d | RF 90d |
|---|---|---|---|
| 2015 | 3.4 | 32.8 | 369.3 |
| 2016 | 0.7 | 56.1 | 497.9 |
| 2017 | 0.6 | 101.1 | 506.3 |
| 2018 | 0.8 | 16.7 | 333.2 |
| 2019 | 38.7 | 154.6 | 789.6 |
| 2020 | 2.9 | 123.7 | 746.8 |
| 2021 | 2.3 | 75.4 | 560.6 |
| 2022 | 0.0 | 123.7 | 629.5 |
| 2023 | 0.2 | 10.3 | 352.4 |
| 2024 | 1.8 | 88.4 | 585.1 |
| 2025 | 66.6 | 111.9 | 735.6 |

## 7. Number of Valid Joinable Records

| Scope | Records | % of V1 Total (13,169) |
|---|---|---|
| V1 total records | 13,169 | 100% |
| Records in IMD years (2015-2025) | 779 | 5.9% |
| Records **without** IMD (1967-2014) | 12,390 | 94.1% |
| **ICRISAT ∩ IMD overlap records** | **779** | **5.9%** |

Of the total 13,169 agricultural records, **only 779 (5.9%)** fall
within years covered by both ICRISAT and IMD (2015-2017).

## 8. Missingness Analysis

| Condition | Records |
|---|---|
| Total V1 records | 13,169 |
| Records with full IMD weather | 779 (100% of overlap) |
| Records without ANY weather | 12,390 |
| IMD weather coverage if trained on V1 | 5.9% |

> [!CAUTION]
> If V2 is trained **only on the 3-year overlap (2015-2017)**, the training set would be
> **779 records** — which is far too small for a robust model using a
> chronological split. No validation or test set can be formed reliably.

## 9. Possible V2 Targets

| Target | Feasibility | Notes |
|---|---|---|
| `yield_kg_ha` | YES | Available for all ICRISAT records 1966-2017 |
| `crop_failure` (binary) | NO | No genuine failure label in any dataset |
| `yield_deviation` | DERIVED | Computed from yield vs historical mean — valid |

## 10. Recommended V2 Training Strategy


### Option A — Pure IMD-Only Training (REJECT)

Train only on 2015-2017 ICRISAT × IMD overlap.

- **Records:** ~779 rows (3 years × 26 districts × ~10 crops after lag drop)
- **Problem:** Far too few rows for a meaningful chronological split.
- **Verdict: REJECT — dataset too small.**


### Option B — Hybrid V1+Weather (RECOMMENDED)

Train on all ICRISAT records (1967-2017) with:
- All V1 features (district, crop, season, area, lag yields)
- IMD features **where available** (2015-2017): 779 rows get real weather
- IMD features **missing** for 1967-2014: 12,390 rows have NaN weather
- Use `HistGradientBoostingRegressor` which natively handles NaN values
- Weather features improve predictions for the overlap zone
- The model learns yield from agricultural signals for all years,
  and additionally learns weather-yield relationships from 2015-2017


**Chronological split:**
| Split | Years | Rows (approx) |
|---|---|---|
| Train | 1967-2012 | ~11,500 |
| Validation | 2013-2016 | ~1,300 |
| Test | 2017 | ~260 |

> [!NOTE]
> In Option B, weather features have very sparse coverage (5.9% of training rows).
> Their marginal contribution during training is small but honest.
> In future, when post-2017 agricultural data is obtained, the weather coverage jumps to 100%.

### Option C — APY + IMD (SUPPLEMENTAL ONLY)

- APY district data covers only 2024-25 (1 year). IMD covers 2024-25.
- APY state-level profile covers 2021-2026 but is aggregate-only (no district breakdown per year).
- This gives 1 year of district × crop × weather records.
- **Insufficient** for V2 training alone.
- **Could supplement** Option B if APY data is joined carefully.
- **Risk:** APY area/production units differ from ICRISAT (need verification).
- **Verdict: SUPPLEMENTAL potential, not primary.**


## 11. Data Leakage Risks

| Risk | Mitigation |
|---|---|
| Using same-year production as feature | EXCLUDED — already not in V1 features |
| Using same-year yield as feature | EXCLUDED — it is the target |
| Using post-harvest rainfall as pre-harvest signal | MITIGATED — rolling windows end at harvest dates |
| Annual rainfall includes post-harvest months | ACCEPTABLE — annual total is a climate signal, not a season-level outcome |
| IMD is state-average, not district-level | DOCUMENTED LIMITATION — not leakage but a precision gap |

## 12. V2 IMD Feature Summary (All 11 Years)

All IMD features are computed from real daily grid data — no fabrication:

 year  annual_rainfall  kharif_rainfall  rabi_rainfall  rainy_days  dry_days  max_daily_rainfall  max_consecutive_rainy_days  max_consecutive_dry_days  kharif_rf_7d_preharvest  kharif_rf_30d_preharvest  kharif_rf_90d_preharvest  rabi_rf_7d_preharvest  rabi_rf_30d_preharvest  rabi_rf_90d_preharvest
 2015            862.7            735.8           70.6          99       266                27.9                          15                        55                      3.4                      32.8                     369.3                    1.5                    30.5                    54.4
 2016           1143.8           1098.0           15.3         109       257                31.8                          29                        82                      0.7                      56.1                     497.9                    1.0                     6.3                    12.9
 2017           1025.7            991.0           13.8         117       248                27.2                          21                       150                      0.6                     101.1                     506.3                    0.0                     5.1                     5.5
 2018            918.1            857.0           25.7          93       272                32.3                          38                        79                      0.8                      16.7                     333.2                    0.1                     2.8                     8.6
 2019           1368.0           1320.5           32.5         131       234                36.0                          34                       126                     38.7                     154.6                     789.6                    0.8                     2.0                    11.7
 2020           1345.4           1267.8           44.1         127       239                28.4                          34                       106                      2.9                     123.7                     746.8                    5.9                    14.9                    26.5
 2021           1298.5           1146.3           77.9         129       236                38.5                          24                        85                      2.3                      75.4                     560.6                    0.1                     4.0                    15.3
 2022           1352.3           1291.2           26.7         132       233                43.4                          51                       126                      0.0                     123.7                     629.5                    0.4                     2.0                    17.0
 2023           1077.5            932.9           69.0         103       262                39.4                          45                        75                      0.2                      10.3                     352.4                    1.1                    18.5                    18.8
 2024           1320.0           1241.8           23.4         124       242                32.4                          58                       128                      1.8                      88.4                     585.1                    0.5                     4.9                     9.5
 2025           1413.8           1230.1           15.1         138       227                30.0                          34                        93                     66.6                     111.9                     735.6                    0.9                     2.8                     2.9

---

## CONCLUSION

## V2 IS FEASIBLE (HYBRID APPROACH)

Using Option B (Hybrid), all 13,169 ICRISAT records are retained. IMD features are joined where available (779 rows, 5.9%) and treated as NaN elsewhere. HistGradientBoosting handles NaN natively. The V2 model will incorporate real weather signals without fabricating any values, and will be meaningfully better than V1 once post-2017 district-level APY data is added.


**V2 can be trained now using the Hybrid approach with the following realistic expectations:**
- Training rows: 13,169 (same as V1, plus weather features for 2015-2017)
- Weather-enriched rows: 779 (5.9%)
- Weather-naive rows: 12,390 (94.1%) — weather features = NaN, model falls back to V1-like behaviour
- Improvement over V1: marginal on overall set, potentially meaningful for 2015-2017 test zone
- **To get a fully weather-enriched model:** provide ICRISAT or equivalent data for 2018-2025

**What V2 CANNOT do:**
- Predict at farm or village level (still district-level)
- Use temperature, humidity, NDVI (not in any dataset)
- Distinguish crop varieties
- Assign district-specific (not state-average) rainfall without district shapefiles