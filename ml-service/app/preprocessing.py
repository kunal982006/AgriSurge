import pandas as pd

FEATURE_COLUMNS = [
    "rainfall_mm",
    "temperature_c",
    "humidity_pct",
    "soil_moisture_pct",
    "ndvi",
    "latitude",
    "longitude",
    "crop",
    "soil_type",
    "irrigation_type",
]

def build_feature_frame(record: dict) -> pd.DataFrame:
    row = {
        "rainfall_mm": float(record.get("rainfall_mm", 100.0)),
        "temperature_c": float(record.get("temperature_c", 25.0)),
        "humidity_pct": float(record.get("humidity_pct", 60.0)),
        "soil_moisture_pct": float(record.get("soil_moisture_pct") or 30.0),
        "ndvi": float(record.get("ndvi") if record.get("ndvi") is not None else 0.5),
        "latitude": float(record.get("latitude", 19.5)),
        "longitude": float(record.get("longitude", 75.5)),
        "crop": str(record.get("crop", "Cotton")),
        "soil_type": str(record.get("soil_type") or "Black Soil"),
        "irrigation_type": str(record.get("irrigation_type") or "Rainfed"),
    }
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)
