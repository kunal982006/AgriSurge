# Government APY XLS Datasets — Inspection Report

> **Generated:** 2026-08-14 23:56
> Analysis of newly uploaded multi-year Government APY XLS files.

---

## 1. Overview of File 1 (`horizontal_crop_vertical_year_report.xls`)
- **File Size:** 1,902,163 bytes
- **Format:** HTML Table (in `.xls` container)
- **Dimensions:** 308 rows × 147 columns
- **MultiIndex Header Depth:** 3 levels `(Crop, Season, Metric)`
- **Year Coverage:** 2014 - 2015 to 2022 - 2023 (9 agricultural years)
- **District Coverage:** 35 districts in Maharashtra
- **Crop Coverage:** 28 crops: `Arhar/Tur, Bajra, Castor seed, Cotton(lint), Gram, Groundnut, Jowar, Linseed, Maize, Moong(Green Gram), Niger seed, Other Cereals, Other Kharif pulses, Other Rabi pulses, Other Summer Pulses, Ragi, Rapeseed &Mustard, Rice, Safflower, Sesamum, Small millets, Soyabean, Sugarcane, Sunflower, Tobacco, Urad, Wheat, other oilseeds`
- **Seasons Covered:** `Kharif, Rabi, Summer, Whole Year`
- **Metrics Recorded:** `Area (Hectare), Production (Bales), Production (Tonnes), Yield (Bales/Hectare), Yield (Tonne/Hectare)`
- **Missing Values:** `NaN` where crop is not sown in specific district/year
- **Duplicate Rows:** 0 (clean tabular format: 35 districts × 9 years)

## 2. Overview of File 2 (`horizontal_year_vertical_crop_report.xls`)
- **File Size:** 2,847,209 bytes
- **Format:** HTML Table (in `.xls` container)
- **Dimensions:** 1720 rows × 26 columns
- **MultiIndex Header Depth:** 2 levels `(Year, Metric)`
- **Year Coverage:** 2015 - 2016 to 2022 - 2023 (8 agricultural years)
- **District Coverage:** 195 distinct district entries
- **Crop Coverage:** 28 crops
- **Seasons Covered:** `Kharif, Rabi, Summer, Total, Whole Year`

## 3. Comparative Suitability Analysis for AgriSurge V2
| Property | File 1 (`horizontal_crop_vertical_year_report.xls`) | File 2 (`horizontal_year_vertical_crop_report.xls`) |
|---|---|---|
| **Year Range** | **2014-2015 to 2022-2023 (9 years)** | 2015-2016 to 2022-2023 (8 years) |
| **Row Structure** | Clean tabular rows (State, District, Year) | Hierarchical nested headers |
| **Parsing Reliability** | **100% Deterministic** (standard multi-index pivot) | Requires regex section header parsing |
| **District Names** | Explicit district per row | Prefixed numbers repeated per crop section |
| **Clean Long Records** | **7,734 records** | ~9,382 records (includes 0-area grid cells) |
| **Suitability** | **PREFERRED CHOICE FOR V2 PIPELINE** | Secondary |

## 4. Key Units & Harmonization Rules
- **Area Unit:** `Area (Hectare)` -> convert to `area_1000ha = Area / 1000.0` (matching ICRISAT).
- **Yield Unit:** `Yield (Tonne/Hectare)` -> convert to `yield_kg_ha = Yield * 1000.0` (matching ICRISAT).
- **Cotton Yield Unit:** `Yield (Bales/Hectare)` -> convert to `yield_kg_ha = Yield * 170.0` (1 Indian cotton bale = 170 Kg).
- **Production Unit:** `Production (Tonnes)` -> convert to `production_1000tons = Production / 1000.0`.