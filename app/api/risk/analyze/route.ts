/**
 * ========================================================================================
 * 🌐 API ROUTE: /api/risk/analyze (Risk & Actuarial Pricing Orchestration)
 * ========================================================================================
 * 
 * WHAT DOES THIS API DO?
 * This endpoint acts as the central brain when an underwriter submits a farm parcel for analysis.
 * It takes farm attributes & weather conditions, sends them to the Machine Learning model
 * to determine crop failure probability, and feeds the resulting risk score into the Actuarial
 * Pricing Engine to compute fair insurance premiums.
 * 
 * WORKFLOW:
 * [Frontend User Input] -> [Next.js API Route (Here)] -> [FastAPI ML Service / Heuristic]
 *                                                    -> [Pricing Engine Formula]
 *                                                    -> [JSON Response with Prediction & Premium]
 * ========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { predictRisk } from "@/lib/ml/riskClient";
import { calculatePremium } from "@/lib/pricing/pricingEngine";
import { RiskPredictionInput } from "@/lib/ml/types";

// Handles HTTP POST requests sent to /api/risk/analyze
export async function POST(req: NextRequest) {
  let body: Partial<RiskPredictionInput> & { basePremium?: number };

  // Step 1: Parse the incoming JSON payload from the request body
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body provided in request." }, { status: 400 });
  }

  // Step 2: Input Validation (DBMS & API Security principle: never trust unvalidated input)
  if (
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number" ||
    !body.crop ||
    typeof body.rainfallMm !== "number" ||
    typeof body.temperatureC !== "number" ||
    typeof body.humidityPct !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: latitude, longitude, crop, rainfallMm, temperatureC, humidityPct." },
      { status: 400 }
    );
  }

  // Step 3: Orchestrate Machine Learning Inference & Actuarial Pricing calculation
  try {
    // 3A: Predict failure risk probability using the ML service (or fallback heuristic)
    const prediction = await predictRisk(body as RiskPredictionInput);

    // 3B: Feed the risk score into the pricing mathematical engine
    const pricing = calculatePremium(prediction.riskScore, body.basePremium, {
      areaAcres: body.areaAcres,
      crop: body.crop,
      irrigationType: body.irrigationType,
      soilType: body.soilType,
    });

    // 3C: Return both prediction output and price breakdown to the frontend
    return NextResponse.json({ prediction, pricing });
  } catch (err) {
    console.error("Risk analysis failed:", err);
    return NextResponse.json({ error: "Risk model service is currently unavailable." }, { status: 502 });
  }
}

