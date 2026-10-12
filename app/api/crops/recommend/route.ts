import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import util from "util";
import { getCropRecommendations } from "@/lib/farmer/cropRecommendationService";

const execFilePromise = util.promisify(execFile);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const hasExplicitNutrients =
      body.N !== undefined &&
      body.P !== undefined &&
      body.K !== undefined &&
      body.ph !== undefined;

    // 1. If explicit lab nutrients are provided, execute the 7-feature ExtraTrees ML model
    if (hasExplicitNutrients) {
      const inputData = {
        N: Number(body.N ?? body.nitrogen ?? 0),
        P: Number(body.P ?? body.phosphorus ?? 0),
        K: Number(body.K ?? body.potassium ?? 0),
        temperature: Number(body.temperature ?? body.temp ?? 0),
        humidity: Number(body.humidity ?? 0),
        ph: Number(body.ph ?? body.soilPH ?? 0),
        rainfall: Number(body.rainfall ?? 0),
      };

      try {
        const scriptPath = path.join(process.cwd(), "lib", "ml", "cropRecommendationPredictor.py");
        const jsonInput = JSON.stringify(inputData);
        const { stdout } = await execFilePromise("python", [scriptPath, "--json", jsonInput], {
          timeout: 20000,
          env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        });
        const result = JSON.parse(stdout.trim());
        if (!result.error) {
          return NextResponse.json({
            ...result,
            nutrientsTested: true,
            missingInputs: [],
            inferenceBasis: "Full 7-parameter laboratory dataset",
          });
        }
      } catch (mlErr) {
        console.warn("[Crop Recommendation API] Python ML execution failed, falling back to agronomic engine:", mlErr);
      }
    }

    // 2. Standard farmer workflow: no fabricated lab nutrients
    // Generates recommendations honestly using real environmental observations & agronomic profiles
    const serviceResult = getCropRecommendations({
      temperature: body.temperature !== undefined ? Number(body.temperature) : undefined,
      humidity: body.humidity !== undefined ? Number(body.humidity) : undefined,
      rainfall: body.rainfall !== undefined ? Number(body.rainfall) : undefined,
      soilType: body.soilType ? String(body.soilType) : undefined,
      irrigationType: body.irrigationType ? String(body.irrigationType) : undefined,
      areaAcres: body.areaAcres ? Number(body.areaAcres) : undefined,
      district: body.district ? String(body.district) : undefined,
    });

    return NextResponse.json(serviceResult);
  } catch (err) {
    console.error("[Crop Recommendation API] Internal Server Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Crop recommendation inference failed" },
      { status: 500 }
    );
  }
}
