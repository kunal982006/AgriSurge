import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import util from "util";

const execFilePromise = util.promisify(execFile);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const inputData = {
      N: Number(body.N ?? body.nitrogen ?? 0),
      P: Number(body.P ?? body.phosphorus ?? 0),
      K: Number(body.K ?? body.potassium ?? 0),
      temperature: Number(body.temperature ?? body.temp ?? 0),
      humidity: Number(body.humidity ?? 0),
      ph: Number(body.ph ?? body.soilPH ?? 0),
      rainfall: Number(body.rainfall ?? 0),
    };

    console.log("[Crop Recommendation API] Received 7 inputs:", inputData);

    const scriptPath = path.join(process.cwd(), "lib", "ml", "cropRecommendationPredictor.py");
    const jsonInput = JSON.stringify(inputData);

    const { stdout, stderr } = await execFilePromise("python", [scriptPath, "--json", jsonInput], {
      timeout: 15000,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    if (stderr && stderr.trim().length > 0) {
      console.warn("[Crop Recommendation API] Python stderr:", stderr);
    }

    const result = JSON.parse(stdout.trim());

    if (result.error) {
      console.error("[Crop Recommendation API] Model Inference Error:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log("[Crop Recommendation API] ML Prediction Successful:", {
      modelLoaded: result.debug?.modelLoaded,
      reliability: result.reliability,
      top3: result.topRecommendations,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Crop Recommendation API] Internal Server Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Crop recommendation inference failed" },
      { status: 500 }
    );
  }
}
