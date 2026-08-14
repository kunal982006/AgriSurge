import { RiskPredictionInput, RiskPredictionResult } from "./types";
import { execFile } from "child_process";
import path from "path";
import util from "util";

const execFilePromise = util.promisify(execFile);

/**
 * Predicts agricultural yield risk using the REAL AgriSurge V2 ML model.
 * 
 * NO mock predictor.
 * NO random numbers.
 * REAL agrisurge_v2_model.joblib predictions only.
 */
export async function predictRisk(input: RiskPredictionInput): Promise<RiskPredictionResult> {
  const serviceUrl = process.env.ML_SERVICE_URL;

  // 1. If external ML_SERVICE_URL is set, call FastAPI service
  if (serviceUrl) {
    try {
      const res = await fetch(`${serviceUrl}/predict-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const data = await res.json();
        return { ...data, isMock: false };
      }
    } catch (err) {
      console.warn("External ML service call failed, attempting local V2 model inference:", err);
    }
  }

  // 2. Execute local V2 Model Python Predictor (`lib/ml/v2Predictor.py`)
  try {
    const scriptPath = path.join(process.cwd(), "lib", "ml", "v2Predictor.py");
    const jsonInput = JSON.stringify({
      district: input.district || "ahilyanagar",
      crop: input.crop,
      season: input.growthStage?.toLowerCase().includes("rabi") ? "Rabi" : input.crop === "Sugarcane" ? "Annual" : "Kharif",
      area_acres: input.areaAcres || 5.0,
      v2_features: input.v2Features || null,
      rainfall_mm: input.rainfallMm,
      temperature_c: input.temperatureC,
      humidity_pct: input.humidityPct,
    });

    const { stdout } = await execFilePromise("python", [scriptPath, "--json", jsonInput], {
      timeout: 15000,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    const res = JSON.parse(stdout.trim());

    if (res.error) {
      throw new Error(res.error);
    }

    // Format risk factors from V2 top features
    const factors = (res.top_features || []).map((f: any) => {
      const featName = String(f.feature);
      const readableName = featName
        .replace("_kg_ha", "")
        .replace("_1000ha", "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      return {
        name: readableName,
        contribution: Number(Number(f.importance || 0).toFixed(3)),
        direction: "increases_risk" as const,
      };
    });

    return {
      riskScore: res.risk_score,
      riskLevel: res.risk_level,
      predictedYieldKgHa: res.predicted_yield_kg_ha,
      expectedYieldKgHa: res.expected_yield_kg_ha,
      yieldDeviationPct: res.yield_deviation_pct,
      riskBasis: res.risk_basis,
      modelMetadata: {
        modelName: res.model_metadata.model_name,
        modelType: res.model_metadata.model_type,
        modelVersion: res.model_metadata.model_version,
        target: res.model_metadata.target,
        geographicLevel: res.model_metadata.geographic_level,
        trainedAt: res.model_metadata.trained_at,
        trainRows: res.model_metadata.train_rows,
        testYears: res.model_metadata.test_years,
      },
      generatedAt: res.generated_at,
      factors,
      isMock: false,
      district: input.district,
      crop: input.crop,
    };
  } catch (err) {
    console.error("V2 model inference error:", err);
    throw new Error("Risk model service is currently unavailable. Ensure V2 model files are present.");
  }
}
