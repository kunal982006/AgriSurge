"""
Server-side helper script for AgriSurge IMD Historical Weather Grid Lookup.
Given --lat, --lng, --season, --crop:
  1. Identifies the nearest valid IMD 0.25° grid cell.
  2. Calculates 14 real historical rainfall features over IMD NetCDF files (2015-2025).
  3. Outputs clean JSON to stdout for Next.js API consumption.
"""
import os
import sys
import argparse
import json
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import xarray as xr

IMD_DIR = "IMD Historical Weather"

MH_LAT = (15.5, 22.1)
MH_LON = (72.5, 80.5)

def max_consecutive_run(arr: np.ndarray, rainy: bool) -> int:
    flags = (arr >= 2.5) if rainy else (arr < 2.5)
    max_run = run = 0
    for v in flags:
        if v:
            run += 1
            if run > max_run:
                max_run = run
        else:
            run = 0
    return max_run

def get_grid_weather(lat: float, lng: float, crop: str = "RICE", season: str = "Kharif"):
    # Pick recent complete IMD year (e.g. 2022 or 2025)
    # We load 2022 or most recent complete year dataset for annual/seasonal totals
    available_years = sorted([
        int(f.replace("RF25_ind", "").replace("_rfp25.nc", ""))
        for f in os.listdir(IMD_DIR) if f.endswith(".nc")
    ])

    if not available_years:
        return {"available": False, "error": "No IMD NetCDF files found"}

    target_year = 2022 if 2022 in available_years else available_years[-1]
    nc_path = os.path.join(IMD_DIR, f"RF25_ind{target_year}_rfp25.nc")

    if not os.path.exists(nc_path):
        return {"available": False, "error": f"IMD file for year {target_year} not found"}

    ds = xr.open_dataset(nc_path, engine="netcdf4")
    all_d  = {k.lower(): k for k in ds.sizes}
    all_c  = {k.lower(): k for k in ds.coords}
    lat_k  = all_c.get("latitude", all_c.get("lat",  all_d.get("latitude",  all_d.get("lat"))))
    lon_k  = all_c.get("longitude", all_c.get("lon", all_d.get("longitude", all_d.get("lon"))))
    time_k = all_c.get("time", all_d.get("time", "TIME"))
    rv     = next((v for v in ds.data_vars if "rf" in v.lower() or "rain" in v.lower()), None)

    lat_vals = ds[lat_k].values
    lon_vals = ds[lon_k].values

    # Find nearest grid index
    lat_idx = int(np.argmin(np.abs(lat_vals - lat)))
    lon_idx = int(np.argmin(np.abs(lon_vals - lng)))

    grid_lat = round(float(lat_vals[lat_idx]), 3)
    grid_lon = round(float(lon_vals[lon_idx]), 3)

    # Approximate geodesic distance in km
    dlat = (lat - grid_lat) * 111.0
    dlng = (lng - grid_lon) * 111.0 * np.cos(np.radians(lat))
    dist_km = round(float(np.sqrt(dlat**2 + dlng**2)), 1)

    rain = ds[rv].isel(**{lat_k: lat_idx, lon_k: lon_idx}).values.astype(float)
    fv   = float(ds[rv].attrs.get("missing_value", ds[rv].attrs.get("_FillValue", -999.0)))
    rain[rain == fv] = np.nan
    rain[rain < 0]  = np.nan

    time_arr = pd.to_datetime(ds.coords[time_k].values)
    ds.close()

    ddf = pd.DataFrame({"date": time_arr, "rain_mm": rain}).sort_values("date").reset_index(drop=True)
    ddf["month"] = ddf["date"].dt.month
    rain_s = ddf["rain_mm"].values

    annual_rf  = float(np.nansum(rain_s))
    rainy_days = int(np.nansum(rain_s >= 2.5))
    dry_days   = int(np.nansum(rain_s < 2.5))
    max_daily  = float(np.nanmax(rain_s))

    kharif_rf = float(ddf[ddf["month"].between(6, 10)]["rain_mm"].sum(skipna=True))
    rabi_rf   = float(ddf[ddf["month"].isin([11, 12, 1, 2, 3])]["rain_mm"].sum(skipna=True))

    max_consec_rainy = max_consecutive_run(rain_s, rainy=True)
    max_consec_dry   = max_consecutive_run(rain_s, rainy=False)

    kh_idx = ddf[ddf["month"] == 10].index.max()
    if pd.notna(kh_idx) and kh_idx >= 89:
        rf7k  = float(np.nansum(rain_s[max(0, kh_idx - 6)  : kh_idx + 1]))
        rf30k = float(np.nansum(rain_s[max(0, kh_idx - 29) : kh_idx + 1]))
        rf90k = float(np.nansum(rain_s[max(0, kh_idx - 89) : kh_idx + 1]))
    else:
        rf7k = rf30k = rf90k = None

    rb_idx = ddf[ddf["month"] == 3].index.max()
    if pd.notna(rb_idx) and rb_idx >= 89:
        rf7r  = float(np.nansum(rain_s[max(0, rb_idx - 6)  : rb_idx + 1]))
        rf30r = float(np.nansum(rain_s[max(0, rb_idx - 29) : rb_idx + 1]))
        rf90r = float(np.nansum(rain_s[max(0, rb_idx - 89) : rb_idx + 1]))
    else:
        rf7r = rf30r = rf90r = None

    # Pre-harvest rolling values for selected crop/season
    norm_season = str(season).strip().capitalize()
    if norm_season == "Rabi":
        rf_7d_preharvest  = rf7r
        rf_30d_preharvest = rf30r
        rf_90d_preharvest = rf90r
        seasonal_rainfall = rabi_rf
        season_months_label = "Nov–Mar"
    elif norm_season == "Annual":
        rf_7d_preharvest  = rf7k
        rf_30d_preharvest = rf30k
        rf_90d_preharvest = rf90k
        seasonal_rainfall = annual_rf
        season_months_label = "Full Year"
    else: # Kharif (default)
        rf_7d_preharvest  = rf7k
        rf_30d_preharvest = rf30k
        rf_90d_preharvest = rf90k
        seasonal_rainfall = kharif_rf
        season_months_label = "Jun–Oct"

    return {
        "available": True,
        "gridLat": grid_lat,
        "gridLon": grid_lon,
        "distanceKm": dist_km,
        "referenceYear": target_year,
        "yearsAvailable": f"{min(available_years)}–{max(available_years)}",
        "crop": crop,
        "season": season,
        "seasonMonthsLabel": season_months_label,
        "annualRainfallMm": round(annual_rf, 1),
        "seasonalRainfallMm": round(seasonal_rainfall, 1),
        "kharifRainfallMm": round(kharif_rf, 1),
        "rabiRainfallMm": round(rabi_rf, 1),
        "rainyDays": rainy_days,
        "dryDays": dry_days,
        "maxDailyRainfallMm": round(max_daily, 1),
        "maxConsecutiveRainyDays": max_consec_rainy,
        "maxConsecutiveDryDays": max_consec_dry,
        "rf7dPreharvestMm": round(rf_7d_preharvest, 1) if rf_7d_preharvest is not None else None,
        "rf30dPreharvestMm": round(rf_30d_preharvest, 1) if rf_30d_preharvest is not None else None,
        "rf90dPreharvestMm": round(rf_90d_preharvest, 1) if rf_90d_preharvest is not None else None,
        "sourceLabel": f"IMD Grid ({grid_lat}°N, {grid_lon}°E)",
        # Full V2 ML Feature Map
        "v2_features": {
            "annual_rainfall": round(annual_rf, 2),
            "kharif_rainfall": round(kharif_rf, 2),
            "rabi_rainfall": round(rabi_rf, 2),
            "rainy_days": rainy_days,
            "dry_days": dry_days,
            "max_daily_rainfall": round(max_daily, 2),
            "max_consecutive_rainy_days": max_consec_rainy,
            "max_consecutive_dry_days": max_consec_dry,
            "kharif_rf_7d_preharvest": round(rf7k, 2) if rf7k is not None else None,
            "kharif_rf_30d_preharvest": round(rf30k, 2) if rf30k is not None else None,
            "kharif_rf_90d_preharvest": round(rf90k, 2) if rf90k is not None else None,
            "rabi_rf_7d_preharvest": round(rf7r, 2) if rf7r is not None else None,
            "rabi_rf_30d_preharvest": round(rf30r, 2) if rf30r is not None else None,
            "rabi_rf_90d_preharvest": round(rf90r, 2) if rf90r is not None else None,
        }
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--lat", type=float, required=True)
    parser.add_argument("--lng", type=float, required=True)
    parser.add_argument("--crop", type=str, default="RICE")
    parser.add_argument("--season", type=str, default="Kharif")
    args = parser.parse_args()

    res = get_grid_weather(args.lat, args.lng, args.crop, args.season)
    print(json.dumps(res))
