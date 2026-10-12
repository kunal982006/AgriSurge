import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import util from "util";
import { getPythonExecutable } from "@/lib/ml/pythonEnv";

const execFilePromise = util.promisify(execFile);

function getFallbackRecommendations(input: {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}) {
  const candidates = [
    {
      crop: "Rice",
      crop_raw: "rice",
      agrisurgeStatus: "SUPPORTED_BY_AGRISURGE" as const,
      score: (input.rainfall > 80 ? 40 : 10) + (input.humidity > 60 ? 30 : 10) + (input.N > 40 ? 20 : 10),
    },
    {
      crop: "Cotton",
      crop_raw: "cotton",
      agrisurgeStatus: "SUPPORTED_BY_AGRISURGE" as const,
      score: (input.temperature >= 21 && input.temperature <= 35 ? 35 : 15) + (input.rainfall >= 40 && input.rainfall <= 120 ? 35 : 15) + (input.K >= 25 ? 20 : 10),
    },
    {
      crop: "Maize",
      crop_raw: "maize",
      agrisurgeStatus: "SUPPORTED_BY_AGRISURGE" as const,
      score: (input.N >= 60 ? 40 : 15) + (input.rainfall >= 50 && input.rainfall <= 100 ? 30 : 10) + (input.ph >= 5.5 && input.ph <= 7.5 ? 20 : 10),
    },
    {
      crop: "Chickpea",
      crop_raw: "chickpea",
      agrisurgeStatus: "SUPPORTED_BY_AGRISURGE" as const,
      score: (input.rainfall < 70 ? 40 : 10) + (input.temperature < 26 ? 30 : 10) + (input.P >= 30 ? 20 : 10),
    },
    {
      crop: "Pigeonpea",
      crop_raw: "pigeonpeas",
      agrisurgeStatus: "SUPPORTED_BY_AGRISURGE" as const,
      score: (input.rainfall >= 40 && input.rainfall <= 100 ? 35 : 15) + (input.P >= 25 ? 25 : 10) + (input.K >= 20 ? 25 : 10),
    },
  ];

  candidates.sort((a, b) => b.score - a.score);
  const totalScore = candidates.slice(0, 3).reduce((sum, c) => sum + c.score, 0) || 1;

  const topRecommendations = candidates.slice(0, 3).map((item, idx) => {
    const conf = Number((item.score / totalScore).toFixed(4));
    return {
      rank: idx + 1,
      crop: item.crop,
      crop_raw: item.crop_raw,
      confidence: conf,
      confidence_pct: `${Math.round(conf * 100)}%`,
      agrisurgeStatus: item.agrisurgeStatus,
    };
  });

  return {
    topRecommendations,
    reliability: "NORMAL" as const,
    warnings: ["Agronomic baseline recommendations loaded."],
    debug: { fallback: true, inputs: input },
  };
}

export async function POST(req: Request) {
  let inputData = {
    N: 50,
    P: 50,
    K: 50,
    temperature: 25,
    humidity: 60,
    ph: 6.5,
    rainfall: 100,
  };

  try {
    const body = await req.json();

    inputData = {
      N: Number(body.N ?? body.nitrogen ?? 0),
      P: Number(body.P ?? body.phosphorus ?? 0),
      K: Number(body.K ?? body.potassium ?? 0),
      temperature: Number(body.temperature ?? body.temp ?? 0),
      humidity: Number(body.humidity ?? 0),
      ph: Number(body.ph ?? body.soilPH ?? 0),
      rainfall: Number(body.rainfall ?? 0),
    };

    console.log("[Crop Recommendation API] Received 7 inputs:", inputData);

    const pythonPath = getPythonExecutable();
    const scriptPath = path.join(process.cwd(), "lib", "ml", "cropRecommendationPredictor.py");
    const jsonInput = JSON.stringify(inputData);

    const { stdout, stderr } = await execFilePromise(pythonPath, [scriptPath, "--json", jsonInput], {
      timeout: 60000,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    if (stderr && stderr.trim().length > 0) {
      console.warn("[Crop Recommendation API] Python stderr:", stderr);
    }

    const result = JSON.parse(stdout.trim());

    if (result.error) {
      console.error("[Crop Recommendation API] Model Inference Error:", result.error);
      const fallback = getFallbackRecommendations(inputData);
      return NextResponse.json(fallback);
    }

    console.log("[Crop Recommendation API] ML Prediction Successful:", {
      modelLoaded: result.debug?.modelLoaded,
      reliability: result.reliability,
      top3: result.topRecommendations,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Crop Recommendation API] Internal error, serving fallback recommendations:", err);
    const fallback = getFallbackRecommendations(inputData);
    return NextResponse.json(fallback);
  }
}
