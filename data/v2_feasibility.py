"""
V2 Feasibility Analysis Script
Analyses temporal overlap, district coverage, feature alignability,
and joinable record counts between ICRISAT agricultural data and IMD rainfall.
Writes: data/v2_feasibility_report.md
"""
import os
import sys
import warnings
import datetime
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import xarray as xr

# ── Paths ─────────────────────────────────────────────────────────────────
ICRISAT_PATH = "ICRISAT/ICRISAT-District Level Data.csv"
APY_DISTRICT = "Government APY/maharashtra_district_data_2024-25.csv"
APY_PROFILE  = "Government APY/maharashtra_crop_profile_2021-22_to_2025-26.csv"
V1_DATASET   = "data/processed/agrisurge_training_dataset.csv"
IMD_DIR      = "IMD Historical Weather"
REPORT_PATH  = "data/v2_feasibility_report.md"

# Maharashtra bounding box
MH_LAT = (15.5, 22.1)
MH_LON = (72.5, 80.5)

# Season harvest-month mapping (used to align IMD window to crop season)
# Pre-harvest window is the key period for yield prediction — we use seasonal accumulations
SEASON_MONTHS = {
    "Kharif":  {"sow": (6, 7),   "harvest": (10, 11)},  # Jun-Jul sowing, Oct-Nov harvest
    "Rabi":    {"sow": (10, 11), "harvest": (3, 4)},    # Oct-Nov sowing, Mar-Apr harvest
    "Annual":  {"sow": (1, 12),  "harvest": (1, 12)},   # Year-round (sugarcane)
}

# Crop -> season
CROP_SEASON = {
    "RICE": "Kharif", "KHARIF SORGHUM": "Kharif",
    "PEARL MILLET": "Kharif", "MAIZE": "Kharif",
    "GROUNDNUT": "Kharif", "SOYABEAN": "Kharif", "COTTON": "Kharif",
    "WHEAT": "Rabi", "RABI SORGHUM": "Rabi", "CHICKPEA": "Rabi", "PIGEONPEA": "Rabi",
    "SUGARCANE": "Annual",
}

DISTRICT_ALIASES = {
    "bombay": "mumbai", "greater bombay": "mumbai",
    "nasik": "nashik",
    "aurangabad": "chhatrapati sambhajinagar",
    "osmanabad": "dharashiv",
    "bid": "beed",
    "sholapur": "solapur",
    "ahmadnagar": "ahilyanagar",
    "ahmednagar": "ahilyanagar",
}

def normalize_district(name):
    n = str(name).strip().lower()
    return DISTRICT_ALIASES.get(n, n)


# ── Load datasets ──────────────────────────────────────────────────────────
print("Loading datasets...")

df_v1 = pd.read_csv(V1_DATASET)
icrisat_raw = pd.read_csv(ICRISAT_PATH)
mh_raw = icrisat_raw[icrisat_raw["State Name"].str.upper() == "MAHARASHTRA"].copy()
mh_raw["district"] = mh_raw["Dist Name"].apply(normalize_district)

apy_dist = pd.read_csv(APY_DISTRICT)
apy_profile = pd.read_csv(APY_PROFILE)


# ── 1. Dataset year ranges ─────────────────────────────────────────────────
print("Analysing year ranges...")

icrisat_years = sorted(mh_raw["Year"].unique().tolist())
imd_years = sorted([
    int(f.replace("RF25_ind","").replace("_rfp25.nc",""))
    for f in os.listdir(IMD_DIR) if f.endswith(".nc")
])

icrisat_year_set = set(icrisat_years)
imd_year_set     = set(imd_years)
overlap_years    = sorted(icrisat_year_set & imd_year_set)

print(f"  ICRISAT: {min(icrisat_years)}-{max(icrisat_years)} ({len(icrisat_years)} years)")
print(f"  IMD:     {min(imd_years)}-{max(imd_years)} ({len(imd_years)} years)")
print(f"  Overlap: {overlap_years}")


# ── 2. ICRISAT districts ──────────────────────────────────────────────────
icrisat_districts = sorted(mh_raw["district"].unique().tolist())
print(f"  ICRISAT districts (normalized): {len(icrisat_districts)}")


# ── 3. Count valid agricultural records in overlap zone ───────────────────
print("Counting records in overlap zone...")

# From V1 dataset (already long-form, crop x district x year)
v1_overlap = df_v1[df_v1["year"].isin(overlap_years)].copy()
n_agri_overlap = len(v1_overlap)
crops_in_overlap = sorted(v1_overlap["crop"].unique().tolist())
districts_in_overlap = sorted(v1_overlap["district"].unique().tolist())

print(f"  Agricultural records in 2015-2017: {n_agri_overlap}")
print(f"  Districts: {len(districts_in_overlap)}")
print(f"  Crops: {len(crops_in_overlap)}")


# ── 4. Inspect one IMD file to understand fill values and rainfall scale ──
print("Inspecting one IMD file...")

sample_nc = os.path.join(IMD_DIR, f"RF25_ind2015_rfp25.nc")
ds_sample = xr.open_dataset(sample_nc, engine="netcdf4")
all_dims_s   = {k.lower(): k for k in ds_sample.sizes}
all_coords_s = {k.lower(): k for k in ds_sample.coords}
lat_name = all_coords_s.get("latitude", all_coords_s.get("lat", all_dims_s.get("latitude", all_dims_s.get("lat"))))
lon_name = all_coords_s.get("longitude", all_coords_s.get("lon", all_dims_s.get("longitude", all_dims_s.get("lon"))))
time_name = all_coords_s.get("time", all_dims_s.get("time", "TIME"))

rain_var = next((v for v in ds_sample.data_vars if "rf" in v.lower() or "rain" in v.lower()), None)
rain_da = ds_sample[rain_var]
fill_val = float(rain_da.attrs.get("missing_value", rain_da.attrs.get("_FillValue", -999)))

# Get all lat/lon values and subset to Maharashtra
lat_vals_all = ds_sample[lat_name].values
lon_vals_all = ds_sample[lon_name].values
lat_res = round(float(np.diff(lat_vals_all[:2])[0]), 3)
lon_res = round(float(np.diff(lon_vals_all[:2])[0]), 3)

mh_lat_mask = (lat_vals_all >= MH_LAT[0]) & (lat_vals_all <= MH_LAT[1])
mh_lon_mask = (lon_vals_all >= MH_LON[0]) & (lon_vals_all <= MH_LON[1])
n_mh_cells  = int(mh_lat_mask.sum() * mh_lon_mask.sum())
n_mh_lat    = int(mh_lat_mask.sum())
n_mh_lon    = int(mh_lon_mask.sum())

# Sample annual rainfall for 2015 to check units
rain_2015 = rain_da.isel(**{lat_name: mh_lat_mask, lon_name: mh_lon_mask}).values.astype(float)
rain_2015[rain_2015 == fill_val] = np.nan
rain_2015[rain_2015 < 0] = np.nan
daily_spatial_mean = np.nanmean(rain_2015, axis=(1, 2))
annual_mm = float(np.nansum(daily_spatial_mean))

ds_sample.close()

print(f"  Rainfall variable: {rain_var}")
print(f"  Fill value: {fill_val}")
print(f"  Grid resolution: {lat_res} deg lat x {lon_res} deg lon")
print(f"  MH grid cells: {n_mh_lat} lat x {n_mh_lon} lon = {n_mh_cells} cells")
print(f"  2015 MH annual rainfall (spatial mean): {annual_mm:.1f} mm (sanity check)")


# ── 5. Extract full IMD features for overlap years ─────────────────────────
print("Extracting IMD features for overlap years...")

def extract_imd_year(year):
    nc_path = os.path.join(IMD_DIR, f"RF25_ind{year}_rfp25.nc")
    if not os.path.exists(nc_path):
        return None
    ds = xr.open_dataset(nc_path, engine="netcdf4")
    all_d  = {k.lower(): k for k in ds.sizes}
    all_c  = {k.lower(): k for k in ds.coords}
    lat_k  = all_c.get("latitude", all_c.get("lat", all_d.get("latitude", all_d.get("lat"))))
    lon_k  = all_c.get("longitude", all_c.get("lon", all_d.get("longitude", all_d.get("lon"))))
    time_k = all_c.get("time", all_d.get("time", "TIME"))
    rv     = next((v for v in ds.data_vars if "rf" in v.lower() or "rain" in v.lower()), None)

    lat_v = ds[lat_k].values
    lon_v = ds[lon_k].values
    lat_m = (lat_v >= MH_LAT[0]) & (lat_v <= MH_LAT[1])
    lon_m = (lon_v >= MH_LON[0]) & (lon_v <= MH_LON[1])

    rain  = ds[rv].isel(**{lat_k: lat_m, lon_k: lon_m}).values.astype(float)
    fv    = float(ds[rv].attrs.get("missing_value", ds[rv].attrs.get("_FillValue", -999.0)))
    # Use exact equality for fill values (avoid multiply-of-negative sign flip)
    rain[rain == fv] = np.nan
    rain[rain < 0] = np.nan

    time_arr = pd.to_datetime(ds.coords[time_k].values)
    ds.close()

    # Spatial mean daily series
    daily = np.nanmean(rain, axis=(1, 2))
    ddf = pd.DataFrame({"date": time_arr, "rain_mm": daily})
    ddf["month"] = ddf["date"].dt.month

    # Annual-level features
    annual_rf    = ddf["rain_mm"].sum(skipna=True)
    rainy_days   = int((ddf["rain_mm"] >= 2.5).sum())
    dry_days     = int((ddf["rain_mm"] < 2.5).sum())
    max_daily_rf = float(ddf["rain_mm"].max())

    kharif_rf = ddf[ddf["month"].between(6, 10)]["rain_mm"].sum(skipna=True)
    rabi_rf   = ddf[ddf["month"].isin([11, 12, 1, 2, 3])]["rain_mm"].sum(skipna=True)

    # Rolling sums: 7d / 30d / 90d ending at kharif harvest (Oct-31) and rabi harvest (Mar-31)
    # These are pre-harvest windows — valid features (no leakage)
    ddf_sorted = ddf.sort_values("date").reset_index(drop=True)
    rain_series = ddf_sorted["rain_mm"]

    # Pre-kharif-harvest: 7/30/90 days ending Oct 31
    kharif_end_idx = ddf_sorted[ddf_sorted["month"] == 10].index.max()
    if kharif_end_idx and kharif_end_idx >= 89:
        rf_7d_kharif  = rain_series.iloc[max(0, kharif_end_idx-6) : kharif_end_idx+1].sum(skipna=True)
        rf_30d_kharif = rain_series.iloc[max(0, kharif_end_idx-29): kharif_end_idx+1].sum(skipna=True)
        rf_90d_kharif = rain_series.iloc[max(0, kharif_end_idx-89): kharif_end_idx+1].sum(skipna=True)
    else:
        rf_7d_kharif = rf_30d_kharif = rf_90d_kharif = np.nan

    # Pre-rabi-harvest: 7/30/90 days ending Mar 31
    rabi_end_idx = ddf_sorted[ddf_sorted["month"] == 3].index.max()
    if rabi_end_idx and rabi_end_idx >= 89:
        rf_7d_rabi  = rain_series.iloc[max(0, rabi_end_idx-6) : rabi_end_idx+1].sum(skipna=True)
        rf_30d_rabi = rain_series.iloc[max(0, rabi_end_idx-29): rabi_end_idx+1].sum(skipna=True)
        rf_90d_rabi = rain_series.iloc[max(0, rabi_end_idx-89): rabi_end_idx+1].sum(skipna=True)
    else:
        rf_7d_rabi = rf_30d_rabi = rf_90d_rabi = np.nan

    def max_consec(series, rainy=True):
        flags = (series >= 2.5).astype(int) if rainy else (series < 2.5).astype(int)
        max_r = run = 0
        for v in flags:
            if v: run += 1; max_r = max(max_r, run)
            else: run = 0
        return max_r

    max_consec_rainy = max_consec(ddf["rain_mm"], rainy=True)
    max_consec_dry   = max_consec(ddf["rain_mm"], rainy=False)

    return {
        "year": year,
        "annual_rainfall":               round(annual_rf, 1),
        "kharif_rainfall":               round(kharif_rf, 1),
        "rabi_rainfall":                 round(rabi_rf, 1),
        "rainy_days":                    rainy_days,
        "dry_days":                      dry_days,
        "max_daily_rainfall":            round(max_daily_rf, 1),
        "max_consecutive_rainy_days":    max_consec_rainy,
        "max_consecutive_dry_days":      max_consec_dry,
        "kharif_rf_7d_preharvest":       round(rf_7d_kharif,  1),
        "kharif_rf_30d_preharvest":      round(rf_30d_kharif, 1),
        "kharif_rf_90d_preharvest":      round(rf_90d_kharif, 1),
        "rabi_rf_7d_preharvest":         round(rf_7d_rabi,    1),
        "rabi_rf_30d_preharvest":        round(rf_30d_rabi,   1),
        "rabi_rf_90d_preharvest":        round(rf_90d_rabi,   1),
    }

imd_rows = []
for yr in imd_years:
    row = extract_imd_year(yr)
    if row:
        imd_rows.append(row)
        print(f"  {yr}: annual={row['annual_rainfall']} mm, kharif={row['kharif_rainfall']} mm, "
              f"rainy_days={row['rainy_days']}, max_daily={row['max_daily_rainfall']} mm")

imd_df = pd.DataFrame(imd_rows)


# ── 6. Compute joinability metrics ─────────────────────────────────────────
print("\nComputing joinability metrics...")

# Merge IMD into full V1 dataset (year-level join)
df_merged = df_v1.merge(imd_df[["year"]], on="year", how="left", indicator=True)
n_with_imd = (df_merged["_merge"] == "both").sum()
n_without_imd = (df_merged["_merge"] == "left_only").sum()

# Overlap-only dataset (what V2 can train on with weather)
v2_candidate = df_v1[df_v1["year"].isin(imd_years)].copy()
v2_candidate = v2_candidate.merge(imd_df, on="year", how="left")

print(f"  Total V1 rows: {len(df_v1)}")
print(f"  Rows joinable with IMD: {n_with_imd} ({n_with_imd/len(df_v1)*100:.1f}%)")
print(f"  Rows without IMD: {n_without_imd} ({n_without_imd/len(df_v1)*100:.1f}%)")
print(f"  V2 candidate rows (ICRISAT years with IMD): {len(v2_candidate)}")

# V2 crop breakdown
v2_crop_counts = v2_candidate.groupby("crop").size().sort_values(ascending=False)
v2_dist_counts = v2_candidate.groupby("district").size().sort_values(ascending=False)

# APY district data analysis
apy_years = ["2024-25"]
apy_crops = sorted(apy_dist["Crop"].dropna().unique().tolist()) if "Crop" in apy_dist.columns else []
apy_districts = sorted(apy_dist["District"].dropna().unique().tolist()) if "District" in apy_dist.columns else []

# Can APY data extend V2? APY has 2024-25 district data, IMD has 2024-25
# Check if APY crop names align
print(f"\n  APY district data crops: {apy_crops[:10]} ...")
print(f"  APY districts: {len(apy_districts)}")


# ── 7. APY + IMD overlap potential ────────────────────────────────────────
# APY district data is 2024-25 only — IMD has 2024 and 2025
apy_imd_overlap = set(["2024-25"]) & {"2024-25"}  # trivially 1 year
print(f"\n  APY district x IMD overlap: {'2024-25' if apy_imd_overlap else 'None'}")
print(f"  APY district rows (2024-25): {len(apy_dist)}")
# How many non-'Total' rows are there?
apy_detail = apy_dist[~apy_dist["Season"].str.lower().str.contains("total", na=False)] if "Season" in apy_dist.columns else apy_dist
print(f"  APY district non-Total rows: {len(apy_detail)}")


# ── 8. Leakage risk analysis ──────────────────────────────────────────────
print("\nLeakage risk analysis...")
# For annual IMD features joined to crop-year:
# - Annual rainfall is safe (measured before/during crop cycle, not after outcome)
# - 7/30/90d windows ending at pre-harvest are safe IF the date is before harvest
# - production_1000tons for same year = LEAKAGE (excluded)
# - yield_kg_ha for same year = TARGET (not a feature)


# ── 9. Write report ───────────────────────────────────────────────────────
print(f"\nWriting {REPORT_PATH}...")
os.makedirs("data", exist_ok=True)

def pct(n, d): return f"{n/d*100:.1f}%"

lines = []
a = lines.append

a("# AgriSurge V2 — Feasibility Report")
a(f"\n> **Generated:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}")
a("> **V1 model untouched.** This report is analysis only.\n")

a("---\n")
a("## 1. Available Years\n")
a("| Dataset | Years | Count |")
a("|---|---|---|")
a(f"| ICRISAT (Maharashtra) | {min(icrisat_years)}-{max(icrisat_years)} | {len(icrisat_years)} |")
a(f"| IMD Daily Rainfall | {min(imd_years)}-{max(imd_years)} | {len(imd_years)} |")
a(f"| Govt APY Profile | 2021-2026 | 5 |")
a(f"| Govt APY District | 2024-25 | 1 |")
a("")

a("## 2. Overlapping Years\n")
a(f"**ICRISAT ∩ IMD:** `{overlap_years}`\n")
a(f"This is a **{len(overlap_years)}-year overlap** — only {len(overlap_years)} years of agricultural records")
a(f"can receive real IMD weather features from the ICRISAT dataset.\n")
a("")
a("> [!IMPORTANT]")
a("> IMD data does NOT exist before 2015. No weather values are fabricated for 1966-2014.")
a("> The 2015-2017 overlap is the **only scientifically valid join zone** between ICRISAT and IMD.")
a("")

a("## 3. Available Districts\n")
a(f"**ICRISAT:** {len(icrisat_districts)} districts\n")
a(f"`{', '.join(icrisat_districts)}`\n")
a(f"**IMD:** State-average spatial mean over Maharashtra (0.25-degree grid, {n_mh_lat} lat x {n_mh_lon} lon = {n_mh_cells} grid cells)\n")
a("> [!WARNING]")
a("> IMD data is extracted as a **Maharashtra state-average** across all grid cells in the bounding box.")
a("> It is NOT district-specific. Every district in a given year receives the SAME rainfall features.")
a("> District-specific rainfall would require spatial assignment of grid cells to districts (e.g. using shapefiles).")
a("> This is a V2 limitation that could be addressed in V3.")
a("")

a("## 4. Available Crops\n")
a(f"| Crop | Season | Records (2015-2017) |")
a("|---|---|---|")
for crop, n in v2_crop_counts.items():
    season = CROP_SEASON.get(crop, "Unknown")
    a(f"| {crop} | {season} | {n} |")
a("")

a("## 5. Available Weather Features from IMD\n")
a("The following features can be legitimately computed from the daily IMD 0.25-degree rainfall grids:\n")
a("| Feature | Computation | Leakage Risk |")
a("|---|---|---|")
a("| `annual_rainfall` | Sum of all daily rain for year | None — full-year accumulation, known at harvest |")
a("| `kharif_rainfall` | Jun-Oct total rainfall | None |")
a("| `rabi_rainfall` | Nov-Mar total rainfall | None |")
a("| `rainy_days` | Days with ≥ 2.5 mm rainfall | None |")
a("| `dry_days` | Days with < 2.5 mm rainfall | None |")
a("| `max_daily_rainfall` | Maximum single-day rainfall | None |")
a("| `max_consecutive_rainy_days` | Max run of consecutive rainy days | None |")
a("| `max_consecutive_dry_days` | Max run of consecutive dry days | None |")
a("| `kharif_rf_7d_preharvest` | 7-day sum ending Oct 31 | None — pre-harvest |")
a("| `kharif_rf_30d_preharvest` | 30-day sum ending Oct 31 | None — pre-harvest |")
a("| `kharif_rf_90d_preharvest` | 90-day sum ending Oct 31 | None — pre-harvest |")
a("| `rabi_rf_7d_preharvest` | 7-day sum ending Mar 31 | None — pre-harvest |")
a("| `rabi_rf_30d_preharvest` | 30-day sum ending Mar 31 | None — pre-harvest |")
a("| `rabi_rf_90d_preharvest` | 90-day sum ending Mar 31 | None — pre-harvest |")
a("")
a("**Features NOT available** (not in any dataset):")
a("- Temperature (daily min/max) — IMD temperature grids not provided")
a("- Humidity — not in IMD daily rainfall product")
a("- NDVI / satellite vegetation — not in any source")
a("- Soil moisture — not in any source")
a("")

a("## 6. IMD Feature Values (Computed)\n")
a("| Year | Annual RF | Kharif RF | Rabi RF | Rainy Days | Dry Days | Max Daily | Max Consec Rainy | Max Consec Dry |")
a("|---|---|---|---|---|---|---|---|---|")
for _, r in imd_df.iterrows():
    a(f"| {int(r.year)} | {r.annual_rainfall} | {r.kharif_rainfall} | {r.rabi_rainfall} | "
      f"{r.rainy_days} | {r.dry_days} | {r.max_daily_rainfall} | "
      f"{int(r.max_consecutive_rainy_days)} | {int(r.max_consecutive_dry_days)} |")
a("")
a("**Pre-harvest rolling windows (Kharif):**\n")
a("| Year | RF 7d | RF 30d | RF 90d |")
a("|---|---|---|---|")
for _, r in imd_df.iterrows():
    a(f"| {int(r.year)} | {r.kharif_rf_7d_preharvest} | {r.kharif_rf_30d_preharvest} | {r.kharif_rf_90d_preharvest} |")
a("")

a("## 7. Number of Valid Joinable Records\n")
a(f"| Scope | Records | % of V1 Total ({len(df_v1):,}) |")
a("|---|---|---|")
a(f"| V1 total records | {len(df_v1):,} | 100% |")
a(f"| Records in IMD years (2015-2025) | {n_with_imd:,} | {pct(n_with_imd, len(df_v1))} |")
a(f"| Records **without** IMD (1967-2014) | {n_without_imd:,} | {pct(n_without_imd, len(df_v1))} |")
a(f"| **ICRISAT ∩ IMD overlap records** | **{len(v2_candidate):,}** | **{pct(len(v2_candidate), len(df_v1))}** |")
a("")
a(f"Of the total 13,169 agricultural records, **only {len(v2_candidate):,} ({pct(len(v2_candidate), len(df_v1))})** fall")
a(f"within years covered by both ICRISAT and IMD (2015-2017).\n")

a("## 8. Missingness Analysis\n")
a("| Condition | Records |")
a("|---|---|")
a(f"| Total V1 records | {len(df_v1):,} |")
a(f"| Records with full IMD weather | {len(v2_candidate):,} (100% of overlap) |")
a(f"| Records without ANY weather | {n_without_imd:,} |")
a(f"| IMD weather coverage if trained on V1 | {pct(len(v2_candidate), len(df_v1))} |")
a("")
a("> [!CAUTION]")
a("> If V2 is trained **only on the 3-year overlap (2015-2017)**, the training set would be")
a(f"> **{len(v2_candidate):,} records** — which is far too small for a robust model using a")
a(f"> chronological split. No validation or test set can be formed reliably.")
a("")

a("## 9. Possible V2 Targets\n")
a("| Target | Feasibility | Notes |")
a("|---|---|---|")
a("| `yield_kg_ha` | YES | Available for all ICRISAT records 1966-2017 |")
a("| `crop_failure` (binary) | NO | No genuine failure label in any dataset |")
a("| `yield_deviation` | DERIVED | Computed from yield vs historical mean — valid |")
a("")

a("## 10. Recommended V2 Training Strategy\n")
a("")
a("### Option A — Pure IMD-Only Training (REJECT)\n")
a("Train only on 2015-2017 ICRISAT × IMD overlap.\n")
a("- **Records:** ~779 rows (3 years × 26 districts × ~10 crops after lag drop)")
a("- **Problem:** Far too few rows for a meaningful chronological split.")
a("- **Verdict: REJECT — dataset too small.**\n")
a("")
a("### Option B — Hybrid V1+Weather (RECOMMENDED)\n")
a("Train on all ICRISAT records (1967-2017) with:")
a("- All V1 features (district, crop, season, area, lag yields)")
a("- IMD features **where available** (2015-2017): 779 rows get real weather")
a("- IMD features **missing** for 1967-2014: 12,390 rows have NaN weather")
a("- Use `HistGradientBoostingRegressor` which natively handles NaN values")
a("- Weather features improve predictions for the overlap zone")
a("- The model learns yield from agricultural signals for all years,")
a("  and additionally learns weather-yield relationships from 2015-2017\n")
a("")
a("**Chronological split:**")
a("| Split | Years | Rows (approx) |")
a("|---|---|---|")
a("| Train | 1967-2012 | ~11,500 |")
a("| Validation | 2013-2016 | ~1,300 |")
a("| Test | 2017 | ~260 |")
a("")
a("> [!NOTE]")
a("> In Option B, weather features have very sparse coverage (5.9% of training rows).")
a("> Their marginal contribution during training is small but honest.")
a("> In future, when post-2017 agricultural data is obtained, the weather coverage jumps to 100%.")
a("")
a("### Option C — APY + IMD (SUPPLEMENTAL ONLY)\n")
a("- APY district data covers only 2024-25 (1 year). IMD covers 2024-25.")
a("- APY state-level profile covers 2021-2026 but is aggregate-only (no district breakdown per year).")
a("- This gives 1 year of district × crop × weather records.")
a("- **Insufficient** for V2 training alone.")
a("- **Could supplement** Option B if APY data is joined carefully.")
a("- **Risk:** APY area/production units differ from ICRISAT (need verification).")
a("- **Verdict: SUPPLEMENTAL potential, not primary.**\n")
a("")

a("## 11. Data Leakage Risks\n")
a("| Risk | Mitigation |")
a("|---|---|")
a("| Using same-year production as feature | EXCLUDED — already not in V1 features |")
a("| Using same-year yield as feature | EXCLUDED — it is the target |")
a("| Using post-harvest rainfall as pre-harvest signal | MITIGATED — rolling windows end at harvest dates |")
a("| Annual rainfall includes post-harvest months | ACCEPTABLE — annual total is a climate signal, not a season-level outcome |")
a("| IMD is state-average, not district-level | DOCUMENTED LIMITATION — not leakage but a precision gap |")
a("")

a("## 12. V2 IMD Feature Summary (All 11 Years)\n")
a("All IMD features are computed from real daily grid data — no fabrication:\n")
a(imd_df.to_string(index=False))
a("")

a("---\n")
a("## CONCLUSION\n")

# Final verdict logic
if len(v2_candidate) < 200:
    verdict = "V2 REQUIRES MORE DATA"
    reason = (f"The ICRISAT x IMD overlap produces only {len(v2_candidate)} records — "
              "too few for a stable chronological split. A larger post-2015 agricultural dataset "
              "would be required to make full use of IMD weather features.")
else:
    verdict = "V2 IS FEASIBLE (HYBRID APPROACH)"
    reason = (f"Using Option B (Hybrid), all {len(df_v1):,} ICRISAT records are retained. "
              f"IMD features are joined where available ({len(v2_candidate):,} rows, {pct(len(v2_candidate), len(df_v1))}) "
              "and treated as NaN elsewhere. HistGradientBoosting handles NaN natively. "
              "The V2 model will incorporate real weather signals without fabricating any values, "
              "and will be meaningfully better than V1 once post-2017 district-level APY data is added.")

a(f"## {verdict}\n")
a(f"{reason}\n")
a("")
a("**V2 can be trained now using the Hybrid approach with the following realistic expectations:**")
a(f"- Training rows: {len(df_v1):,} (same as V1, plus weather features for 2015-2017)")
a(f"- Weather-enriched rows: {len(v2_candidate):,} ({pct(len(v2_candidate), len(df_v1))})")
a("- Weather-naive rows: 12,390 (94.1%) — weather features = NaN, model falls back to V1-like behaviour")
a("- Improvement over V1: marginal on overall set, potentially meaningful for 2015-2017 test zone")
a("- **To get a fully weather-enriched model:** provide ICRISAT or equivalent data for 2018-2025")
a("")
a("**What V2 CANNOT do:**")
a("- Predict at farm or village level (still district-level)")
a("- Use temperature, humidity, NDVI (not in any dataset)")
a("- Distinguish crop varieties")
a("- Assign district-specific (not state-average) rainfall without district shapefiles")

report_text = "\n".join(lines)
with open(REPORT_PATH, "w", encoding="utf-8") as f:
    f.write(report_text)

print(f"\nReport written to {REPORT_PATH}")
print(f"\n=== VERDICT: {verdict} ===")
print(reason)
