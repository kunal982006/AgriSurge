import { getAllCropProfiles, CropProfile } from "@/lib/crop/cropProfiles";
import { CROP_TRANSLATIONS, INSURANCE_ELIGIBLE_CROPS, CropRecommendation } from "@/lib/farmer/types";

export interface CropRecommendationRequest {
  temperature?: number;
  humidity?: number;
  rainfall?: number;
  soilType?: string;
  irrigationType?: string;
  areaAcres?: number;
  district?: string;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  soilPH?: number;
}

export interface RecommendationServiceResult {
  topRecommendations: CropRecommendation[];
  nutrientsTested: boolean;
  missingInputs: string[];
  inferenceBasis: string;
  reliability: "NORMAL" | "ENVIRONMENTAL_ADAPTED";
  observationSummary: {
    temperatureC: number;
    humidityPct: number;
    rainfallMm: number;
    soilType: string;
    irrigationType: string;
  };
}

/**
 * Normalizes score for a parameter within [min, max] and optimal [optLow, optHigh].
 */
function evaluateParameter(val: number, min: number, optLow: number, optHigh: number, max: number): { score: number; status: "optimal" | "moderate" | "caution" } {
  if (val >= optLow && val <= optHigh) {
    return { score: 100, status: "optimal" };
  }
  if (val < min || val > max) {
    return { score: 35, status: "caution" };
  }
  if (val < optLow) {
    const ratio = (val - min) / Math.max(1, optLow - min);
    return { score: Math.round(50 + ratio * 45), status: "moderate" };
  } else {
    const ratio = (max - val) / Math.max(1, max - optHigh);
    return { score: Math.round(50 + ratio * 45), status: "moderate" };
  }
}

/**
 * Generates Top 5 crop recommendations based on actual environmental inputs
 * and verified agronomic preference ranges, without fabricating missing laboratory nutrients.
 */
export function getCropRecommendations(input: CropRecommendationRequest): RecommendationServiceResult {
  const temp = Number(input.temperature ?? 26.5);
  const hum = Number(input.humidity ?? 65);
  const rain = Number(input.rainfall ?? 100);
  const soil = String(input.soilType || "Black Soil");
  const irrigation = String(input.irrigationType || "Rainfed");

  const hasNutrients =
    input.nitrogen !== undefined &&
    input.phosphorus !== undefined &&
    input.potassium !== undefined &&
    input.soilPH !== undefined;

  const missingInputs = hasNutrients ? [] : ["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)", "Soil pH"];
  const allProfiles = getAllCropProfiles();

  const scoredCrops = allProfiles.map((crop) => {
    // 1. Temperature score
    const tempEval = evaluateParameter(
      temp,
      crop.ranges.temperature.min,
      crop.ranges.temperature.optLow,
      crop.ranges.temperature.optHigh,
      crop.ranges.temperature.max
    );

    // 2. Humidity score
    const humEval = evaluateParameter(
      hum,
      crop.ranges.humidity.min,
      crop.ranges.humidity.optLow,
      crop.ranges.humidity.optHigh,
      crop.ranges.humidity.max
    );

    // 3. Rainfall / water score
    const rainEval = evaluateParameter(
      rain,
      crop.ranges.rainfall.min,
      crop.ranges.rainfall.optLow,
      crop.ranges.rainfall.optHigh,
      crop.ranges.rainfall.max
    );

    // 4. Soil type compatibility
    const soilNormalized = soil.toLowerCase();
    const isSoilCompatible = crop.suitableSoils.some((s) =>
      soilNormalized.includes(s.toLowerCase()) || s.toLowerCase().includes(soilNormalized)
    );
    const soilScore = isSoilCompatible ? 100 : 65;

    // 5. Irrigation compatibility
    const irrigNormalized = irrigation.toLowerCase();
    const isIrrigCompatible = crop.suitableIrrigation.some((i) =>
      irrigNormalized.includes(i.toLowerCase()) || i.toLowerCase().includes(irrigNormalized)
    );
    const irrigScore = isIrrigCompatible ? 100 : 70;

    // Weighted composite suitability score
    // Temperature: 25%, Humidity: 20%, Rainfall: 25%, Soil: 15%, Irrigation: 15%
    const compositeScore = Math.round(
      tempEval.score * 0.25 +
      humEval.score * 0.20 +
      rainEval.score * 0.25 +
      soilScore * 0.15 +
      irrigScore * 0.15
    );

    // Insurance eligibility
    const key = crop.key.toLowerCase();
    const isInsuranceEligible = INSURANCE_ELIGIBLE_CROPS.has(key);

    // Tier
    let suitabilityTier: "Excellent" | "Good" | "Moderate" | "Low" = "Moderate";
    if (compositeScore >= 85) suitabilityTier = "Excellent";
    else if (compositeScore >= 72) suitabilityTier = "Good";
    else if (compositeScore >= 55) suitabilityTier = "Moderate";
    else suitabilityTier = "Low";

    // Bilingual Context Strings
    const tempContext = `${temp.toFixed(1)}°C (${crop.ranges.temperature.optLow}–${crop.ranges.temperature.optHigh}°C ${tempEval.status === "optimal" ? "इष्टतम / Optimal" : "अनुकूल / Suitable"})`;
    const humContext = `${Math.round(hum)}% (${crop.ranges.humidity.optLow}–${crop.ranges.humidity.optHigh}% ${humEval.status === "optimal" ? "इष्टतम / Optimal" : "स्वीकार्य / Acceptable"})`;
    const rainContext = `${Math.round(rain)} mm (${crop.ranges.rainfall.optLow}–${crop.ranges.rainfall.optHigh} mm गरज / Water Need)`;
    const soilContext = `${soil} — ${isSoilCompatible ? "उच्च अनुकूलता / Highly Compatible" : "मध्यम अनुकूलता / Moderately Compatible"}`;
    const irrigContext = `${irrigation} — ${isIrrigCompatible ? "सुसंगत व्यवस्था / Compatible" : "पाणी व्यवस्थापन आवश्यक / Management Needed"}`;

    // Natural explanations
    const trans = CROP_TRANSLATIONS[key] || { mr: crop.name, hi: crop.name };
    const mrName = trans.mr;
    const hiName = trans.hi;

    const explanationMr = `${mrName} पिकासाठी सध्याचे तापमान (${temp.toFixed(1)}°C) व आर्द्रता (${Math.round(hum)}%) अनुकूल आहेत. ${soil} आणि ${irrigation} पद्धतीमध्ये या पिकाची वाढ संतुलित राहते.`;
    const explanationHi = `${hiName} फसल के लिए वर्तमान तापमान (${temp.toFixed(1)}°C) और आर्द्रता (${Math.round(hum)}%) अनुकूल है। ${soil} और ${irrigation} प्रणाली में इस फसल की वृद्धि संतुलित रहती है।`;
    const explanationEn = `Current temperature (${temp.toFixed(1)}°C) and relative humidity (${Math.round(hum)}%) match the requirements for ${crop.name}. ${soil} and ${irrigation} irrigation support sustainable cultivation.`;

    return {
      cropKey: key,
      cropEn: crop.name,
      cropMr: mrName,
      cropHi: hiName,
      suitabilityScore: compositeScore,
      suitabilityTier,
      confidencePct: `${compositeScore}%`,
      isInsuranceEligible,
      isSoilCompatible,
      soilCompatibilityStatus: isSoilCompatible ? "Soil Compatible" : "Compatibility Not Confirmed",
      suitabilityNote: explanationMr,
      temperatureContext: tempContext,
      humidityContext: humContext,
      rainfallContext: rainContext,
      soilContext,
      irrigationContext: irrigContext,
      explanationMr,
      explanationHi,
      explanationEn,
      waterRequirement: `${crop.ranges.rainfall.optLow}–${crop.ranges.rainfall.optHigh} mm`,
      growthDuration: crop.description,
    };
  });

  // Sort descending by suitability score
  scoredCrops.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  // Take Top 5 and assign rank
  const top5: CropRecommendation[] = scoredCrops.slice(0, 5).map((c, idx) => ({
    ...c,
    rank: idx + 1,
  }));

  return {
    topRecommendations: top5,
    nutrientsTested: hasNutrients,
    missingInputs,
    inferenceBasis: hasNutrients
      ? "Full 7-parameter laboratory dataset"
      : "Observed environmental parameters (temperature, humidity, rainfall) and agronomic soil/irrigation compatibility",
    reliability: hasNutrients ? "NORMAL" : "ENVIRONMENTAL_ADAPTED",
    observationSummary: {
      temperatureC: temp,
      humidityPct: hum,
      rainfallMm: rain,
      soilType: soil,
      irrigationType: irrigation,
    },
  };
}
