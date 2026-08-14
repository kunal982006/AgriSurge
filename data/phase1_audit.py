"""
Phase 1 & 2: Data Audit Script
Inspects ICRISAT, Government APY and IMD NetCDF files and writes
data_audit_report.md — no data is modified.
"""
import os
import sys
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np

ICRISAT_PATH   = "ICRISAT/ICRISAT-District Level Data.csv"
APY_PROFILE    = "Government APY/maharashtra_crop_profile_2021-22_to_2025-26.csv"
APY_PROFILE2   = "Government APY/maharashtra_crop_profile_2024-25_2025-26.csv"
APY_DISTRICT   = "Government APY/maharashtra_district_data_2024-25.csv"
APY_RICE       = "Government APY/maharashtra_normal_rice_area_production_yield.csv"
IMD_DIR        = "IMD Historical Weather"
REPORT_PATH    = "data/data_audit_report.md"

os.makedirs("data", exist_ok=True)


def audit_csv(path: str, label: str) -> dict:
    """Return a dict with key stats for a CSV file."""
    df = pd.read_csv(path)
    result = {
        "label": label,
        "rows": len(df),
        "cols": len(df.columns),
        "columns": list(df.columns),
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "missing_per_col": df.isnull().sum().to_dict(),
        "total_missing": int(df.isnull().sum().sum()),
        "duplicates": int(df.duplicated().sum()),
    }
    return df, result


def audit_icrisat(path: str) -> tuple:
    df, base = audit_csv(path, "ICRISAT District Level Data")
    base["year_range"] = (int(df["Year"].min()), int(df["Year"].max()))
    base["states"] = sorted(df["State Name"].unique().tolist())
    base["num_districts"] = df["Dist Name"].nunique()
    base["geographic_level"] = "district"
    # Identify crop columns (every group of 3: AREA, PRODUCTION, YIELD)
    crop_cols = [c for c in df.columns if "AREA" in c or "PRODUCTION" in c or "YIELD" in c]
    crops_set = set()
    for c in crop_cols:
        parts = c.split(" ")
        # strip AREA/PRODUCTION/YIELD suffix
        for suffix in ("AREA", "PRODUCTION", "YIELD"):
            if suffix in parts:
                idx = parts.index(suffix)
                crop = " ".join(parts[:idx])
                crops_set.add(crop)
    base["crops"] = sorted(crops_set)
    base["units_note"] = "Area in 1000 ha; Production in 1000 tons; Yield in Kg/ha"
    return df, base


def audit_apy_profile(path: str, label: str) -> tuple:
    df, base = audit_csv(path, label)
    base["year_cols"] = [c for c in df.columns if any(yr in c for yr in ["21","22","23","24","25","26"])]
    # Extract unique year values from column names
    years = set()
    for col in base["year_cols"]:
        parts = col.split("-")
        for p in parts:
            if p.isdigit() and len(p) == 2:
                years.add(int("20" + p))
    base["year_range_inferred"] = (min(years), max(years)) if years else None
    base["crops"] = sorted(df["Crop"].dropna().unique().tolist()) if "Crop" in df.columns else []
    base["seasons"] = sorted(df["Season"].dropna().unique().tolist()) if "Season" in df.columns else []
    base["geographic_level"] = "state (Maharashtra aggregate)"
    return df, base


def audit_apy_district(path: str) -> tuple:
    df, base = audit_csv(path, "maharashtra_district_data_2024-25")
    base["year_range"] = ("2024-25", "2024-25")
    base["districts"] = sorted(df["District"].dropna().unique().tolist()) if "District" in df.columns else []
    base["num_districts"] = df["District"].nunique() if "District" in df.columns else 0
    base["crops"] = sorted(df["Crop"].dropna().unique().tolist()) if "Crop" in df.columns else []
    base["seasons"] = sorted(df["Season"].dropna().unique().tolist()) if "Season" in df.columns else []
    base["geographic_level"] = "district"
    base["units_note"] = "Area in lakh ha; Production in lakh tons; Yield in Kg/ha (check source)"
    return df, base


def audit_netcdf(nc_path: str) -> dict:
    """Inspect a single NetCDF file without loading all grids into memory."""
    try:
        import netCDF4 as nc4
    except ImportError:
        return {"error": "netCDF4 not installed"}
    try:
        import xarray as xr
        ds = xr.open_dataset(nc_path, engine="netcdf4")
        dims = dict(ds.dims)
        lats = ds.coords.get("lat", ds.coords.get("latitude", None))
        lons = ds.coords.get("lon", ds.coords.get("longitude", None))
        time_dim = ds.coords.get("time", None)
        rain_vars = [v for v in ds.data_vars if "rf" in v.lower() or "rain" in v.lower() or "precip" in v.lower()]
        result = {
            "file": os.path.basename(nc_path),
            "dimensions": dims,
            "lat_range": (float(lats.min()), float(lats.max())) if lats is not None else None,
            "lon_range": (float(lons.min()), float(lons.max())) if lons is not None else None,
            "time_start": str(time_dim.values[0])[:10] if time_dim is not None else None,
            "time_end": str(time_dim.values[-1])[:10] if time_dim is not None else None,
            "n_timesteps": int(len(time_dim)) if time_dim is not None else None,
            "temporal_resolution": "daily (inferred from IMD 0.25-deg product)",
            "spatial_resolution": "0.25 degrees",
            "rainfall_vars": rain_vars,
            "all_vars": list(ds.data_vars),
            "fill_values": {},
        }
        for v in rain_vars:
            arr = ds[v]
            fv = arr.attrs.get("missing_value", arr.attrs.get("_FillValue", "not set"))
            result["fill_values"][v] = str(fv)
        ds.close()
        return result
    except Exception as e:
        return {"file": os.path.basename(nc_path), "error": str(e)}


def format_missing(d: dict) -> str:
    items = [(k, v) for k, v in d.items() if v > 0]
    if not items:
        return "  _None_"
    return "\n".join(f"  - `{k}`: {v}" for k, v in items)


def build_report(icrisat_info, apy_profile_info, apy_profile2_info,
                 apy_district_info, apy_rice_info, nc_results) -> str:
    lines = []
    a = lines.append

    a("# AgriSurge Data Audit Report\n")
    a(f"> Generated by `phase1_audit.py`\n")

    # ─── ICRISAT ───────────────────────────────────────────────
    a("## 1. ICRISAT District Level Data\n")
    a(f"**File:** `{ICRISAT_PATH}`\n")
    a(f"| Property | Value |")
    a(f"|---|---|")
    a(f"| Rows | {icrisat_info['rows']:,} |")
    a(f"| Columns | {icrisat_info['cols']} |")
    a(f"| Year Range | {icrisat_info['year_range'][0]} – {icrisat_info['year_range'][1]} |")
    a(f"| Geographic Level | {icrisat_info['geographic_level']} |")
    a(f"| Number of Districts | {icrisat_info['num_districts']} |")
    a(f"| States | {', '.join(icrisat_info['states'])} |")
    a(f"| Duplicate Rows | {icrisat_info['duplicates']} |")
    a(f"| Total Missing Values | {icrisat_info['total_missing']:,} |")
    a(f"| Units | {icrisat_info['units_note']} |")
    a("")
    a(f"**Crops Covered:** {', '.join(icrisat_info['crops'])}\n")
    a(f"**Missing values by column (non-zero only):**\n")
    a(format_missing(icrisat_info['missing_per_col']))
    a("")

    # ─── APY PROFILE 2021-26 ───────────────────────────────────
    a("## 2. Government APY — Crop Profile 2021-22 to 2025-26\n")
    a(f"**File:** `{APY_PROFILE}`\n")
    a(f"| Property | Value |")
    a(f"|---|---|")
    a(f"| Rows | {apy_profile_info['rows']} |")
    a(f"| Columns | {apy_profile_info['cols']} |")
    a(f"| Year Range (inferred) | {apy_profile_info['year_range_inferred']} |")
    a(f"| Geographic Level | {apy_profile_info['geographic_level']} |")
    a(f"| Duplicate Rows | {apy_profile_info['duplicates']} |")
    a(f"| Total Missing | {apy_profile_info['total_missing']} |")
    a("")
    a(f"**Crops:** {', '.join(apy_profile_info['crops'])}\n")
    a(f"**Seasons:** {', '.join(apy_profile_info['seasons'])}\n")
    a(f"**Missing values by column:**\n")
    a(format_missing(apy_profile_info['missing_per_col']))
    a("")

    # ─── APY PROFILE 2024-26 ───────────────────────────────────
    a("## 3. Government APY — Crop Profile 2024-25 to 2025-26\n")
    a(f"**File:** `{APY_PROFILE2}`\n")
    a(f"| Property | Value |")
    a(f"|---|---|")
    a(f"| Rows | {apy_profile2_info['rows']} |")
    a(f"| Columns | {apy_profile2_info['cols']} |")
    a(f"| Year Range (inferred) | {apy_profile2_info['year_range_inferred']} |")
    a(f"| Geographic Level | {apy_profile2_info['geographic_level']} |")
    a(f"| Duplicate Rows | {apy_profile2_info['duplicates']} |")
    a(f"| Total Missing | {apy_profile2_info['total_missing']} |")
    a("")
    a(f"**Crops:** {', '.join(apy_profile2_info['crops'])}\n")
    a(f"**Missing values by column:**\n")
    a(format_missing(apy_profile2_info['missing_per_col']))
    a("")

    # ─── APY DISTRICT 2024-25 ─────────────────────────────────
    a("## 4. Government APY — District Data 2024-25\n")
    a(f"**File:** `{APY_DISTRICT}`\n")
    a(f"| Property | Value |")
    a(f"|---|---|")
    a(f"| Rows | {apy_district_info['rows']:,} |")
    a(f"| Columns | {apy_district_info['cols']} |")
    a(f"| Year Coverage | 2024-25 only (single year snapshot) |")
    a(f"| Geographic Level | {apy_district_info['geographic_level']} |")
    a(f"| Districts | {apy_district_info['num_districts']} |")
    a(f"| Duplicate Rows | {apy_district_info['duplicates']} |")
    a(f"| Total Missing | {apy_district_info['total_missing']} |")
    a("")
    a(f"**Crops:** {', '.join(apy_district_info['crops'])}\n")
    a(f"**Seasons:** {', '.join(apy_district_info['seasons'])}\n")
    a(f"**Districts (sample):** {', '.join(apy_district_info['districts'][:15])} …\n")
    a("")

    # ─── APY RICE NORMAL ──────────────────────────────────────
    a("## 5. Government APY — Normal Rice Area/Production/Yield\n")
    a(f"**File:** `{APY_RICE}`\n")
    a(f"| Property | Value |")
    a(f"|---|---|")
    a(f"| Rows | {apy_rice_info['rows']} |")
    a(f"| Columns | {apy_rice_info['cols']} |")
    a(f"| Geographic Level | {apy_rice_info['geographic_level']} |")
    a(f"| Notes | Contains average/max/min values — no year-level time series |")
    a("")

    # ─── IMD NetCDF ────────────────────────────────────────────
    a("## 6. IMD Historical Rainfall (NetCDF)\n")
    a(f"**Directory:** `{IMD_DIR}/`\n")
    for r in nc_results:
        if "error" in r:
            a(f"### {r.get('file','unknown')}\n")
            a(f"> ⚠ Error: {r['error']}\n")
            continue
        a(f"### {r['file']}\n")
        a(f"| Property | Value |")
        a(f"|---|---|")
        a(f"| Dimensions | {r['dimensions']} |")
        a(f"| Latitude Range | {r['lat_range']} |")
        a(f"| Longitude Range | {r['lon_range']} |")
        a(f"| Time Start | {r['time_start']} |")
        a(f"| Time End | {r['time_end']} |")
        a(f"| N Timesteps | {r['n_timesteps']} |")
        a(f"| Temporal Resolution | {r['temporal_resolution']} |")
        a(f"| Spatial Resolution | {r['spatial_resolution']} |")
        a(f"| Rainfall Variables | {r['rainfall_vars']} |")
        a(f"| All Variables | {r['all_vars']} |")
        a(f"| Fill Values | {r['fill_values']} |")
        a("")

    # ─── TEMPORAL OVERLAP ─────────────────────────────────────
    a("## 7. Temporal Overlap Analysis\n")
    a("| Dataset | Coverage |")
    a("|---|---|")
    a(f"| ICRISAT | {icrisat_info['year_range'][0]} – {icrisat_info['year_range'][1]} |")
    a(f"| Govt APY Crop Profile | 2021 – 2026 |")
    a(f"| Govt APY District Data | 2024-25 only |")
    a(f"| IMD NetCDF Rainfall | 2015 – 2025 |")
    a("")
    a("**ICRISAT ∩ IMD:** 2015 – 2017 (ICRISAT ends 2017; IMD starts 2015) → **3 years overlap**")
    a("")
    a("**APY Crop Profile ∩ IMD:** 2021 – 2025 → **5 years overlap** (state-level only)")
    a("")
    a("**APY District ∩ IMD:** 2024-25 only → **1 year** (too limited for supervised ML)")
    a("")
    a("**ICRISAT ∩ APY:** No overlap — ICRISAT ends 2017; APY starts 2021")
    a("")
    a("> [!IMPORTANT]")
    a("> The primary supervised ML training source will be **ICRISAT** (1966–2017).")
    a("> IMD rainfall (2015–2025) overlaps with only the last 3 ICRISAT years.")
    a("> For the initial model, ICRISAT yield data will be used without IMD features.")
    a("> IMD features will be incorporated when historical rainfall data covering")
    a("> 1966–2017 is available, or when ICRISAT is replaced with a multi-decade dataset.")
    a("")

    # ─── GEOGRAPHIC ALIGNMENT ────────────────────────────────
    a("## 8. Geographic Alignment\n")
    a("| Dataset | Level | State Filter |")
    a("|---|---|---|")
    a("| ICRISAT | District | Maharashtra only |")
    a("| Govt APY Profile | State (Maharashtra aggregate) | Maharashtra |")
    a("| Govt APY District | District | Maharashtra |")
    a("| IMD Rainfall | 0.25° grid cells | Spatial subset for Maharashtra |")
    a("")
    a("District names will be normalized (trimmed, lowercased, merged for known aliases).")
    a("Geographic level will be preserved as `district` — not projected to village/farm level.\n")

    # ─── POTENTIAL TARGETS ───────────────────────────────────
    a("## 9. Potential Target Variable\n")
    a("- **Yield** (Kg per ha) is consistently available in ICRISAT for every crop × district × year")
    a("- No pre-existing `crop_failure` binary label exists in any dataset")
    a("- Initial supervised learning problem: **Yield Regression**")
    a("- Crop loss / yield deviation can be derived from predicted vs historical expected yield\n")

    return "\n".join(lines)


def main():
    print("=== Phase 1 & 2: Data Audit ===\n")

    print(f"  Auditing ICRISAT: {ICRISAT_PATH}")
    df_ic, ic_info = audit_icrisat(ICRISAT_PATH)

    print(f"  Auditing APY crop profile (2021-26): {APY_PROFILE}")
    df_ap, ap_info = audit_apy_profile(APY_PROFILE, "maharashtra_crop_profile_2021-22_to_2025-26")

    print(f"  Auditing APY crop profile (2024-26): {APY_PROFILE2}")
    df_ap2, ap2_info = audit_apy_profile(APY_PROFILE2, "maharashtra_crop_profile_2024-25_2025-26")

    print(f"  Auditing APY district data (2024-25): {APY_DISTRICT}")
    df_ad, ad_info = audit_apy_district(APY_DISTRICT)

    print(f"  Auditing APY rice normal: {APY_RICE}")
    df_ar, ar_info = audit_csv(APY_RICE, "maharashtra_normal_rice")
    ar_info["geographic_level"] = "state (Maharashtra aggregate)"

    print(f"\n  Auditing IMD NetCDF files...")
    nc_files = sorted([
        os.path.join(IMD_DIR, f)
        for f in os.listdir(IMD_DIR) if f.endswith(".nc")
    ])
    nc_results = []
    for ncf in nc_files:
        print(f"    {os.path.basename(ncf)}")
        nc_results.append(audit_netcdf(ncf))

    print(f"\n  Writing {REPORT_PATH} ...")
    report_text = build_report(ic_info, ap_info, ap2_info, ad_info, ar_info, nc_results)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report_text)

    print(f"\nAudit complete. Report written to {REPORT_PATH}")

    # Print quick summary
    print(f"\n  ICRISAT: {ic_info['rows']} rows, {ic_info['num_districts']} districts, "
          f"years {ic_info['year_range'][0]}-{ic_info['year_range'][1]}")
    print(f"  APY Profile: {ap_info['rows']} rows (state-level, 2021-2026)")
    print(f"  APY District: {ad_info['rows']} rows (2024-25 only)")
    print(f"  IMD: {len(nc_files)} yearly NetCDF files (2015-2025)")


if __name__ == "__main__":
    main()
