"""
AgriSurge V2 — Dataset Builder
Option B (Hybrid): All 13,169 V1 records + 14 real IMD weather features.
Weather features are populated for 2015–2017 (ICRISAT × IMD overlap).
All other years get NaN — HistGradientBoosting handles this natively.

DO NOT modify V1 model or dataset.
"""
import os
import sys
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import xarray as xr

# ── Paths ──────────────────────────────────────────────────────────────────
V1_DATASET  = "data/processed/agrisurge_training_dataset.csv"
IMD_DIR     = "IMD Historical Weather"
OUT_PATH    = "data/processed/agrisurge_v2_training_dataset.csv"

MH_LAT = (15.5, 22.1)
MH_LON = (72.5, 80.5)

# V2 adds 14 new IMD features on top of all V1 features
NEW_IMD_COLS = [
    "v2_annual_rainfall",
    "v2_kharif_rainfall",
    "v2_rabi_rainfall",
    "v2_rainy_days",
    "v2_dry_days",
    "v2_max_daily_rainfall",
    "v2_max_consecutive_rainy_days",
    "v2_max_consecutive_dry_days",
    "v2_kharif_rf_7d_preharvest",
    "v2_kharif_rf_30d_preharvest",
    "v2_kharif_rf_90d_preharvest",
    "v2_rabi_rf_7d_preharvest",
    "v2_rabi_rf_30d_preharvest",
    "v2_rabi_rf_90d_preharvest",
]


def max_consecutive_run(series: np.ndarray, rainy: bool) -> int:
    """Count max consecutive rainy (>=2.5mm) or dry (<2.5mm) days."""
    flags = (series >= 2.5) if rainy else (series < 2.5)
    max_run = run = 0
    for v in flags:
        if v:
            run += 1
            if run > max_run:
                max_run = run
        else:
            run = 0
    return max_run


def extract_imd_year(year: int) -> dict | None:
    """
    Load one year's IMD NetCDF, spatially average over Maharashtra,
    compute all 14 V2 weather features.
    Returns a dict keyed by V2 column names, or None if file missing.
    """
    nc_path = os.path.join(IMD_DIR, f"RF25_ind{year}_rfp25.nc")
    if not os.path.exists(nc_path):
        return None

    ds = xr.open_dataset(nc_path, engine="netcdf4")

    # Detect dimension names (IMD uses uppercase)
    all_d  = {k.lower(): k for k in ds.sizes}
    all_c  = {k.lower(): k for k in ds.coords}
    lat_k  = all_c.get("latitude", all_c.get("lat",  all_d.get("latitude",  all_d.get("lat"))))
    lon_k  = all_c.get("longitude", all_c.get("lon", all_d.get("longitude", all_d.get("lon"))))
    time_k = all_c.get("time", all_d.get("time", "TIME"))
    rv     = next((v for v in ds.data_vars if "rf" in v.lower() or "rain" in v.lower()), None)

    if rv is None:
        ds.close()
        return None

    lat_v = ds[lat_k].values
    lon_v = ds[lon_k].values
    lat_m = (lat_v >= MH_LAT[0]) & (lat_v <= MH_LAT[1])
    lon_m = (lon_v >= MH_LON[0]) & (lon_v <= MH_LON[1])

    rain  = ds[rv].isel(**{lat_k: lat_m, lon_k: lon_m}).values.astype(float)
    fv    = float(ds[rv].attrs.get("missing_value", ds[rv].attrs.get("_FillValue", -999.0)))
    rain[rain == fv] = np.nan   # exact equality — fill value is -999.0
    rain[rain < 0]  = np.nan

    time_arr = pd.to_datetime(ds.coords[time_k].values)
    ds.close()

    # Spatial mean: one value per day
    daily_mean = np.nanmean(rain, axis=(1, 2))   # shape: (n_days,)

    ddf = pd.DataFrame({"date": time_arr, "rain_mm": daily_mean})
    ddf = ddf.sort_values("date").reset_index(drop=True)
    ddf["month"] = ddf["date"].dt.month

    rain_s = ddf["rain_mm"].values

    # Annual statistics
    annual_rf  = float(np.nansum(rain_s))
    rainy_days = int(np.nansum(rain_s >= 2.5))
    dry_days   = int(np.nansum(rain_s < 2.5))
    max_daily  = float(np.nanmax(rain_s))

    # Seasonal accumulations
    kharif_rf = float(ddf[ddf["month"].between(6, 10)]["rain_mm"].sum(skipna=True))
    rabi_rf   = float(ddf[ddf["month"].isin([11, 12, 1, 2, 3])]["rain_mm"].sum(skipna=True))

    # Max consecutive runs
    max_consec_rainy = max_consecutive_run(rain_s, rainy=True)
    max_consec_dry   = max_consecutive_run(rain_s, rainy=False)

    # Pre-harvest rolling windows
    # Kharif harvest: Oct 31 → find last October index
    kh_idx = ddf[ddf["month"] == 10].index.max()
    if pd.notna(kh_idx) and kh_idx >= 89:
        rf7k  = float(np.nansum(rain_s[max(0, kh_idx - 6)  : kh_idx + 1]))
        rf30k = float(np.nansum(rain_s[max(0, kh_idx - 29) : kh_idx + 1]))
        rf90k = float(np.nansum(rain_s[max(0, kh_idx - 89) : kh_idx + 1]))
    else:
        rf7k = rf30k = rf90k = np.nan

    # Rabi harvest: Mar 31 → find last March index
    rb_idx = ddf[ddf["month"] == 3].index.max()
    if pd.notna(rb_idx) and rb_idx >= 89:
        rf7r  = float(np.nansum(rain_s[max(0, rb_idx - 6)  : rb_idx + 1]))
        rf30r = float(np.nansum(rain_s[max(0, rb_idx - 29) : rb_idx + 1]))
        rf90r = float(np.nansum(rain_s[max(0, rb_idx - 89) : rb_idx + 1]))
    else:
        rf7r = rf30r = rf90r = np.nan

    return {
        "year":                          year,
        "v2_annual_rainfall":            round(annual_rf, 2),
        "v2_kharif_rainfall":            round(kharif_rf, 2),
        "v2_rabi_rainfall":              round(rabi_rf, 2),
        "v2_rainy_days":                 rainy_days,
        "v2_dry_days":                   dry_days,
        "v2_max_daily_rainfall":         round(max_daily, 2),
        "v2_max_consecutive_rainy_days": max_consec_rainy,
        "v2_max_consecutive_dry_days":   max_consec_dry,
        "v2_kharif_rf_7d_preharvest":    round(rf7k,  2) if not np.isnan(rf7k)  else np.nan,
        "v2_kharif_rf_30d_preharvest":   round(rf30k, 2) if not np.isnan(rf30k) else np.nan,
        "v2_kharif_rf_90d_preharvest":   round(rf90k, 2) if not np.isnan(rf90k) else np.nan,
        "v2_rabi_rf_7d_preharvest":      round(rf7r,  2) if not np.isnan(rf7r)  else np.nan,
        "v2_rabi_rf_30d_preharvest":     round(rf30r, 2) if not np.isnan(rf30r) else np.nan,
        "v2_rabi_rf_90d_preharvest":     round(rf90r, 2) if not np.isnan(rf90r) else np.nan,
    }


def main():
    print("=== AgriSurge V2 — Dataset Builder ===\n")

    # 1. Load the V1 dataset (all 13,169 rows, unchanged)
    print(f"Loading V1 dataset: {V1_DATASET}")
    df = pd.read_csv(V1_DATASET)
    print(f"  V1 rows: {len(df)}, cols: {len(df.columns)}")
    assert "yield_kg_ha" in df.columns, "ERROR: yield_kg_ha missing from V1 dataset"

    # 2. Extract IMD features for ALL available IMD years (2015–2025)
    print("\nExtracting IMD weather features...")
    imd_files = sorted([
        int(f.replace("RF25_ind", "").replace("_rfp25.nc", ""))
        for f in os.listdir(IMD_DIR) if f.endswith(".nc")
    ])

    imd_rows = []
    for yr in imd_files:
        row = extract_imd_year(yr)
        if row:
            imd_rows.append(row)
            print(f"  {yr}: annual={row['v2_annual_rainfall']} mm, "
                  f"kharif={row['v2_kharif_rainfall']} mm, "
                  f"rainy_days={row['v2_rainy_days']}, "
                  f"max_daily={row['v2_max_daily_rainfall']} mm")
        else:
            print(f"  {yr}: skipped (file not found)")

    imd_df = pd.DataFrame(imd_rows)
    print(f"\n  IMD features computed for {len(imd_df)} years: {sorted(imd_df['year'].tolist())}")

    # 3. Merge by year (left join — NaN for years outside IMD range)
    print("\nMerging IMD features into V1 dataset...")
    df_v2 = df.merge(imd_df, on="year", how="left")

    # Verify no rows were lost
    assert len(df_v2) == len(df), f"Row count mismatch: {len(df_v2)} != {len(df)}"

    # 4. Coverage statistics
    n_with_weather = df_v2["v2_annual_rainfall"].notna().sum()
    n_without      = df_v2["v2_annual_rainfall"].isna().sum()
    coverage_pct   = n_with_weather / len(df_v2) * 100

    print(f"\n  Total rows: {len(df_v2):,}")
    print(f"  Rows WITH weather features: {n_with_weather:,}  ({coverage_pct:.1f}%)")
    print(f"  Rows without weather (NaN): {n_without:,}  ({100-coverage_pct:.1f}%)")

    # 5. Breakdown by year/split
    print("\n  Weather coverage by split:")
    for split in ["train", "validation", "test"]:
        sub = df_v2[df_v2["split"] == split]
        has = sub["v2_annual_rainfall"].notna().sum()
        print(f"    {split}: {has}/{len(sub)} rows have weather  "
              f"(years {sub['year'].min()}-{sub['year'].max()})")

    # 6. Verify IMD values are physically plausible (sanity checks)
    print("\n  Sanity checks:")
    annual_vals = df_v2["v2_annual_rainfall"].dropna()
    print(f"    annual_rainfall range: {annual_vals.min():.1f} – {annual_vals.max():.1f} mm  (expect 700-1500 for MH)")
    assert annual_vals.min() > 400, "ERROR: Implausibly low annual rainfall detected"
    assert annual_vals.max() < 3000, "ERROR: Implausibly high annual rainfall detected"

    kharif_vals = df_v2["v2_kharif_rainfall"].dropna()
    print(f"    kharif_rainfall range: {kharif_vals.min():.1f} – {kharif_vals.max():.1f} mm")

    max_daily_vals = df_v2["v2_max_daily_rainfall"].dropna()
    print(f"    max_daily_rainfall range: {max_daily_vals.min():.1f} – {max_daily_vals.max():.1f} mm")

    # 7. Save V2 dataset
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    df_v2.to_csv(OUT_PATH, index=False)
    print(f"\n  Saved: {OUT_PATH}  ({len(df_v2)} rows x {len(df_v2.columns)} cols)")
    print(f"  New columns added: {NEW_IMD_COLS}")

    # 8. Print column list
    print(f"\n  All columns ({len(df_v2.columns)}):")
    print(f"  {list(df_v2.columns)}")

    print("\nV2 dataset build complete.")


if __name__ == "__main__":
    main()
