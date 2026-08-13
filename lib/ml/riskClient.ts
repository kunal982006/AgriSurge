import { RiskPredictionInput, RiskPredictionResult } from "./types";

// Client for the Python/FastAPI risk service (see ml-service/).
// ML_SERVICE_URL must be set; if it isn't (e.g. running the frontend
// standalone during development), this falls back to a clearly-marked
// mock predictor so the UI remains usable. The mock output is NEVER
// presented as a real model result — isMock is surfaced to the caller.
export async function predictRisk(input: RiskPredictionInput): Promise<RiskPredictionResult> {
  const serviceUrl = process.env.ML_SERVICE_URL;

  if (!serviceUrl) {
    return mockPredictRisk(input);
  }

  try {
    const res = await fetch(`${serviceUrl}/predict-risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`ML service responded with ${res.status}`);
    const data = await res.json();
    return { ...data, isMock: false };
  } catch (err) {
    console.error("ML service unavailable, falling back to mock predictor:", err);
    return mockPredictRisk(input);
  }
}

// Development-only mock predictor. Deterministic-ish heuristic, NOT a
// trained model. Replace by pointing ML_SERVICE_URL at a running
// ml-service instance with model/model.pkl in place.
function mockPredictRisk(input: RiskPredictionInput): RiskPredictionResult {
  const rainfallDeficit = Math.max(0, (80 - input.rainfallMm) / 80);
  const heatStress = Math.max(0, (input.temperatureC - 28) / 15);
  const moistureDeficit = input.soilMoisturePct != null ? Math.max(0, (35 - input.soilMoisturePct) / 35) : 0.3;
  const vegetationStress = input.ndvi != null ? Math.max(0, (0.5 - input.ndvi) / 0.5) : 0.25;

  const raw =
    rainfallDeficit * 0.35 + heatStress * 0.25 + moistureDeficit * 0.2 + vegetationStress * 0.2;
  const riskScore = Math.min(0.97, Math.max(0.05, Number(raw.toFixed(2))));

  const riskLevel = riskScore >= 0.7 ? "high" : riskScore >= 0.4 ? "moderate" : "low";

  return {
    riskScore,
    riskLevel,
    modelName: "Development mock predictor",
    modelVersion: "mock-0.1",
    generatedAt: new Date().toISOString(),
    isMock: true,
    factors: (
      [
        { name: "Rainfall deficit", contribution: rainfallDeficit, direction: "increases_risk" },
        { name: "Heat stress", contribution: heatStress, direction: "increases_risk" },
        { name: "Soil moisture deficit", contribution: moistureDeficit, direction: "increases_risk" },
        { name: "Vegetation stress (NDVI)", contribution: vegetationStress, direction: "increases_risk" },
      ] as const
    )
      .map((f) => ({ ...f }))
      .sort((a, b) => b.contribution - a.contribution),
  };
}
