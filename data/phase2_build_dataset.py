"""
Phase 3–8: Build the Training Dataset

Steps:
  3.  Geographic alignment — filter ICRISAT to Maharashtra, normalize district names.
  4.  IMD rainfall processing — extract Maharashtra grid cells, compute seasonal features.
      (Only 2015–2017 can be joined to ICRISAT; features are added where available.)
  5.  Target selection — yield (Kg/ha) per crop × district × year.
  6.  Feature engineering — previous-year yield, area, lagged rolling rainfall.
  7.  Chronological train / validation / test split.
  8.  Save processed dataset to data/processed/agrisurge_training_dataset.csv
"""
import os
import sys
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np

# ── Configuration ──────────────────────────────────────────────────────────
ICRISAT_PATH = "ICRISAT/ICRISAT-District Level Data.csv"
IMD_DIR      = "IMD Historical Weather"
OUT_DIR      = "data/processed"

MAHARASHTRA_LAT = (15.5, 22.1)   # bounding box for grid-cell extraction
MAHARASHTRA_LON = (72.5, 80.5)

# Crops to model individually (must have enough non-zero rows in ICRISAT Maharashtra)
TARGET_CROPS = [
    "RICE", "WHEAT", "KHARIF SORGHUM", "RABI SORGHUM",
    "PEARL MILLET", "MAIZE", "CHICKPEA", "PIGEONPEA",
    "GROUNDNUT", "SOYABEAN", "SUGARCANE", "COTTON"
]

# ── District name normalisation map ───────────────────────────────────────
DISTRICT_ALIASES = {
    "bombay": "mumbai",
    "greater bombay": "mumbai",
    "thane": "thane",
    "nasik": "nashik",
    "aurangabad": "chhatrapati sambhajinagar",
    "osmanabad": "dharashiv",
    "parbhani": "parbhani",
    "bid": "beed",
    "sholapur": "solapur",
    "kolhapur": "kolhapur",
    "sangli": "sangli",
    "satara": "satara",
    "ratnagiri": "ratnagiri",
    "sindhudurg": "sindhudurg",
    "pune": "pune",
    "ahmadnagar": "ahilyanagar",
    "ahmednagar": "ahilyanagar",
    "ahilyanagar": "ahilyanagar",
}

def normalize_district(name: str) -> str:
    n = str(name).strip().lower()
    return DISTRICT_ALIASES.get(n, n)


# ── Phase 3: Load & Filter ICRISAT ────────────────────────────────────────
def load_icrisat_maharashtra() -> pd.DataFrame:
    print("  [3] Loading ICRISAT …")
    df = pd.read_csv(ICRISAT_PATH)
    # Filter Maharashtra
    mh = df[df["State Name"].str.upper() == "MAHARASHTRA"].copy()
    mh["district"] = mh["Dist Name"].apply(normalize_district)
    mh["year"]     = mh["Year"].astype(int)
    mh["state"]    = "Maharashtra"
    print(f"       Maharashtra rows: {len(mh)}, districts: {mh['district'].nunique()}, "
          f"years: {mh['year'].min()}–{mh['year'].max()}")
    return mh


# ── Phase 4: IMD Rainfall Processing ─────────────────────────────────────
def extract_maharashtra_rainfall(year: int) -> pd.DataFrame | None:
    """
    Read one year's IMD NetCDF, extract grid cells within Maharashtra bounding box,
    return a DataFrame with columns: year, annual_rainfall, rainy_days,
    dry_days, max_daily_rain, seasonal_kharif_rain, seasonal_rabi_rain.
    Returns None if file not found or package unavailable.
    """
    try:
        import xarray as xr
    except ImportError:
        return None

    nc_path = os.path.join(IMD_DIR, f"RF25_ind{year}_rfp25.nc")
    if not os.path.exists(nc_path):
        return None

    ds = xr.open_dataset(nc_path, engine="netcdf4")

    # Detect dimension names case-insensitively (IMD files use uppercase)
    all_dims  = {k.lower(): k for k in ds.dims}
    all_coords = {k.lower(): k for k in ds.coords}

    lat_name = all_coords.get("latitude", all_coords.get("lat",
               all_dims.get("latitude",  all_dims.get("lat", None))))
    lon_name = all_coords.get("longitude", all_coords.get("lon",
               all_dims.get("longitude",  all_dims.get("lon", None))))
    time_name = all_coords.get("time", all_dims.get("time", None))

    if lat_name is None or lon_name is None:
        ds.close()
        print(f"       Cannot find lat/lon dims in {os.path.basename(nc_path)}")
        return None

    # Subset to Maharashtra bounding box
    lat_vals = ds[lat_name].values
    lon_vals = ds[lon_name].values

    lat_mask = (lat_vals >= MAHARASHTRA_LAT[0]) & (lat_vals <= MAHARASHTRA_LAT[1])
    lon_mask = (lon_vals >= MAHARASHTRA_LON[0]) & (lon_vals <= MAHARASHTRA_LON[1])

    if not lat_mask.any() or not lon_mask.any():
        ds.close()
        print(f"       No Maharashtra grid cells found in {os.path.basename(nc_path)}")
        return None

    ds_mh = ds.isel(**{lat_name: lat_mask, lon_name: lon_mask})

    # Find the rainfall variable
    rain_var = next((v for v in ds.data_vars
                     if "rf" in v.lower() or "rain" in v.lower() or "precip" in v.lower()), None)
    if rain_var is None:
        ds.close()
        return None

    rain = ds_mh[rain_var]

    # Replace fill values with NaN
    fill_val = rain.attrs.get("missing_value", rain.attrs.get("_FillValue", None))
    rain_np = rain.values.astype(float)
    if fill_val is not None:
        rain_np[rain_np >= float(fill_val) * 0.9] = np.nan

    # rain_np shape: (time, lat, lon)
    # Compute spatial mean over Maharashtra for each day
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        daily_mean = np.nanmean(rain_np, axis=(1, 2))  # shape: (time,)

    # Derive time index using detected time_name (may be uppercase 'TIME')
    time_key = time_name if time_name is not None else "time"
    time_arr = pd.to_datetime(ds_mh.coords[time_key].values)
    ds.close()

    daily_df = pd.DataFrame({"date": time_arr, "rain_mm": daily_mean})
    daily_df["month"] = daily_df["date"].dt.month

    # Annual features
    annual_rain     = daily_df["rain_mm"].sum(skipna=True)
    rainy_days      = int((daily_df["rain_mm"] >= 2.5).sum())
    dry_days        = int((daily_df["rain_mm"] < 2.5).sum())
    max_daily_rain  = daily_df["rain_mm"].max()

    # Kharif season: June–October (months 6–10)
    kharif = daily_df[daily_df["month"].between(6, 10)]["rain_mm"].sum(skipna=True)
    # Rabi season: November–March (months 11, 12, 1, 2, 3)
    rabi   = daily_df[daily_df["month"].isin([11, 12, 1, 2, 3])]["rain_mm"].sum(skipna=True)

    # Max consecutive rainy / dry days
    def max_consecutive(series: pd.Series, condition: bool) -> int:
        if condition:
            flags = (series >= 2.5).astype(int)
        else:
            flags = (series < 2.5).astype(int)
        max_run = 0
        run = 0
        for v in flags:
            if v:
                run += 1
                max_run = max(max_run, run)
            else:
                run = 0
        return max_run

    max_consec_rainy = max_consecutive(daily_df["rain_mm"], True)
    max_consec_dry   = max_consecutive(daily_df["rain_mm"], False)

    return pd.DataFrame([{
        "year": year,
        "annual_rainfall":           round(annual_rain, 1),
        "kharif_rainfall":           round(kharif, 1),
        "rabi_rainfall":             round(rabi, 1),
        "rainy_days":                rainy_days,
        "dry_days":                  dry_days,
        "max_daily_rainfall":        round(float(max_daily_rain), 1),
        "max_consecutive_rainy_days": max_consec_rainy,
        "max_consecutive_dry_days":   max_consec_dry,
    }])


def load_imd_rainfall_features() -> pd.DataFrame:
    """Load IMD for all available years, return one row per year."""
    print("  [4] Extracting IMD rainfall features …")
    frames = []
    for year in range(2015, 2026):
        df_y = extract_maharashtra_rainfall(year)
        if df_y is not None:
            frames.append(df_y)
            print(f"       {year}: OK  (annual={df_y['annual_rainfall'].iloc[0]} mm)")
        else:
            print(f"       {year}: skipped (file not found or package missing)")
    if frames:
        return pd.concat(frames, ignore_index=True)
    return pd.DataFrame()


# ── Phase 5 & 6: Build long-form crop × district × year dataset ───────────
def build_crop_records(mh_df: pd.DataFrame, imd_df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert wide ICRISAT into long form:
    one row per (district, year, crop) with area, production, yield as columns.
    Then add lag features (prev-year yield, prev-year area) and IMD rainfall.
    """
    print("  [5–6] Building crop × district × year records …")

    records = []
    for crop_tag in TARGET_CROPS:
        area_col  = f"{crop_tag} AREA (1000 ha)"
        prod_col  = f"{crop_tag} PRODUCTION (1000 tons)"
        yield_col = f"{crop_tag} YIELD (Kg per ha)"

        if area_col not in mh_df.columns:
            print(f"       Skipping '{crop_tag}' — column not found")
            continue

        sub = mh_df[["district", "year", "state", area_col, prod_col, yield_col]].copy()
        sub.columns = ["district", "year", "state", "area_1000ha", "production_1000tons", "yield_kg_ha"]
        sub["crop"] = crop_tag

        # Replace 0 yield with NaN (0 yield when area is also 0 means crop not grown there)
        sub.loc[sub["area_1000ha"] == 0, ["area_1000ha", "production_1000tons", "yield_kg_ha"]] = np.nan
        sub = sub.dropna(subset=["yield_kg_ha"])

        records.append(sub)

    if not records:
        print("  ERROR: No crop records built.")
        return pd.DataFrame()

    long_df = pd.concat(records, ignore_index=True)
    long_df = long_df.sort_values(["district", "crop", "year"]).reset_index(drop=True)

    # ── Lag features (use previous year — no leakage) ────────────────────
    long_df["prev_yield_kg_ha"]    = long_df.groupby(["district", "crop"])["yield_kg_ha"].shift(1)
    long_df["prev_area_1000ha"]    = long_df.groupby(["district", "crop"])["area_1000ha"].shift(1)
    long_df["prev2_yield_kg_ha"]   = long_df.groupby(["district", "crop"])["yield_kg_ha"].shift(2)

    # Historical mean yield over 5-year rolling window (ends at t-1)
    long_df["hist5y_mean_yield"] = (
        long_df.groupby(["district", "crop"])["yield_kg_ha"]
        .transform(lambda s: s.shift(1).rolling(5, min_periods=2).mean())
    )

    # ── Assign season based on crop ───────────────────────────────────────
    SEASON_MAP = {
        "RICE": "Kharif", "KHARIF SORGHUM": "Kharif",
        "PEARL MILLET": "Kharif", "MAIZE": "Kharif",
        "GROUNDNUT": "Kharif", "SOYABEAN": "Kharif", "COTTON": "Kharif",
        "WHEAT": "Rabi", "RABI SORGHUM": "Rabi", "CHICKPEA": "Rabi",
        "PIGEONPEA": "Rabi", "SUGARCANE": "Annual",
    }
    long_df["season"] = long_df["crop"].map(SEASON_MAP).fillna("Unknown")

    # ── Merge IMD rainfall (year-level, Maharashtra state average) ─────────
    if not imd_df.empty:
        long_df = long_df.merge(imd_df, on="year", how="left")
        imd_cols = [c for c in imd_df.columns if c != "year"]
        print(f"       IMD features added for years: {sorted(imd_df['year'].unique().tolist())}")
        print(f"       IMD cols: {imd_cols}")
    else:
        print("       No IMD data merged (no overlap / package missing).")

    # ── Source traceability ───────────────────────────────────────────────
    long_df["geographic_level"] = "district"
    long_df["source"]           = "ICRISAT"
    long_df["data_note"]        = (
        "yield_kg_ha is the actual observed district-level yield. "
        "Rainfall features are Maharashtra state-average from IMD where available."
    )

    n_before = len(long_df)
    # Drop rows where lag features are all missing (first year per district/crop)
    long_df = long_df.dropna(subset=["prev_yield_kg_ha"])
    print(f"       After dropping rows with no lag yield: {len(long_df)} (was {n_before})")

    return long_df


# ── Phase 7: Chronological Train / Val / Test split ───────────────────────
def chronological_split(df: pd.DataFrame):
    """
    Split by year:
      Train      : years <= 2005
      Validation : 2006–2012
      Test       : 2013–2017
    Returns annotated df with a 'split' column.
    """
    df = df.copy()
    df["split"] = "train"
    df.loc[df["year"].between(2006, 2012), "split"] = "validation"
    df.loc[df["year"] >= 2013,            "split"] = "test"
    print(f"  [7] Chronological split:")
    for s, g in df.groupby("split"):
        print(f"       {s}: {len(g)} rows  (years {g['year'].min()}–{g['year'].max()})")
    return df


# ── Phase 8: Save ─────────────────────────────────────────────────────────
def save_dataset(df: pd.DataFrame):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, "agrisurge_training_dataset.csv")
    df.to_csv(path, index=False)
    print(f"\n  [8] Saved: {path}  ({len(df)} rows × {len(df.columns)} cols)")
    return path


def main():
    print("=== Phases 3–8: Build Training Dataset ===\n")
    mh_df = load_icrisat_maharashtra()
    imd_df = load_imd_rainfall_features()
    long_df = build_crop_records(mh_df, imd_df)

    if long_df.empty:
        print("ERROR: Training dataset is empty — cannot proceed.")
        sys.exit(1)

    long_df = chronological_split(long_df)
    out_path = save_dataset(long_df)

    # Quick summary
    print("\n  -- Dataset Summary --")
    print(f"  Total rows: {len(long_df):,}")
    print(f"  Crops: {sorted(long_df['crop'].unique().tolist())}")
    print(f"  Districts: {long_df['district'].nunique()}")
    print(f"  Year range: {long_df['year'].min()} to {long_df['year'].max()}")
    print(f"  Target: yield_kg_ha")
    imd_cover = long_df["annual_rainfall"].notna().sum() if "annual_rainfall" in long_df else 0
    print(f"  Rows with IMD rainfall: {imd_cover} / {len(long_df)}")
    print(f"\n  Columns: {list(long_df.columns)}")


if __name__ == "__main__":
    main()
