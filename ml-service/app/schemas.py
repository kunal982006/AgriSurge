from typing import Optional, Literal
from pydantic import BaseModel, Field

class RiskPredictionInput(BaseModel):
    latitude: float
    longitude: float
    crop: str
    soil_type: Optional[str] = Field(default="Black Soil", alias="soilType")
    irrigation_type: Optional[str] = Field(default="Rainfed", alias="irrigationType")
    rainfall_mm: float = Field(alias="rainfallMm")
    temperature_c: float = Field(alias="temperatureC")
    humidity_pct: float = Field(alias="humidityPct")
    soil_moisture_pct: Optional[float] = Field(default=30.0, alias="soilMoisturePct")
    ndvi: Optional[float] = Field(default=0.5, alias="ndvi")

    class Config:
        populate_by_name = True

class RiskFactor(BaseModel):
    name: str
    contribution: float
    direction: Literal["increases_risk", "decreases_risk"]

class RiskPredictionOutput(BaseModel):
    risk_score: float = Field(serialization_alias="riskScore")
    risk_level: Literal["low", "moderate", "high"] = Field(serialization_alias="riskLevel")
    model_name: str = Field(serialization_alias="modelName")
    model_version: str = Field(serialization_alias="modelVersion")
    generated_at: str = Field(serialization_alias="generatedAt")
    factors: list[RiskFactor]
    is_mock: bool = Field(serialization_alias="isMock")
