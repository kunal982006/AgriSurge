# Central Risk Thresholds and Model Feature Configurations for AgriSurge

TARGET_COLUMN = "crop_failure"

NUMERICAL_FEATURES = [
    "rainfall_mm",
    "temperature_c",
    "humidity_pct",
    "soil_moisture_pct",
    "ndvi",
    "latitude",
    "longitude",
]

CATEGORICAL_FEATURES = [
    "crop",
    "soil_type",
    "irrigation_type",
]

ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES

# Risk Categories & Configurable Thresholds
RISK_THRESHOLDS = {
    "LOW_MAX": 0.39,      # 0% - 39%
    "MODERATE_MAX": 0.69, # 40% - 69%
    # >= 0.70 is HIGH
}

def get_risk_level(score: float) -> str:
    if score <= RISK_THRESHOLDS["LOW_MAX"]:
        return "low"
    elif score <= RISK_THRESHOLDS["MODERATE_MAX"]:
        return "moderate"
    else:
        return "high"
