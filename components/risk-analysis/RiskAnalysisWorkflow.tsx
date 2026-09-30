"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { SensorSoilDataStep, SensorData, DEFAULT_SENSOR_DATA } from "./SensorSoilDataStep";
import { LocationStep } from "./LocationStep";
import { FarmLocation } from "@/lib/geocoding/types";
import { FarmDetailsStep, FarmDetails, EMPTY_FARM_DETAILS } from "./FarmDetailsStep";
import { EnvironmentalDataStep } from "./EnvironmentalDataStep";
import { RiskAssessmentStep } from "./RiskAssessmentStep";
import { PremiumRecommendationStep, SubmissionResult } from "./PremiumRecommendationStep";
import { RiskPredictionResult } from "@/lib/ml/types";
import { PremiumBreakdown } from "@/lib/pricing/types";
import { CurrentWeather, HistoricalImdReading } from "@/lib/weather/types";
import { NdviReading } from "@/lib/satellite/types";

const STEPS = [
  "Sensor & soil data",
  "Select farm location",
  "Farm & crop details",
  "Environmental data",
  "AI risk assessment",
  "Premium recommendation",
];

export function RiskAnalysisWorkflow() {
  const [step, setStep] = useState(0);
  const [sensorData, setSensorData] = useState<SensorData>(DEFAULT_SENSOR_DATA);
  const [parcel, setParcel] = useState<FarmLocation | null>(null);
  const [details, setDetails] = useState<FarmDetails>(EMPTY_FARM_DETAILS);
  const [envData, setEnvData] = useState<{
    weather: CurrentWeather | null;
    ndvi: NdviReading | null;
    soilMoisturePct: number | null;
    historicalImd?: HistoricalImdReading | null;
    v2Features?: Record<string, number | null> | null;
  } | null>(null);

  const [assessing, setAssessing] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<RiskPredictionResult | null>(null);
  const [pricing, setPricing] = useState<PremiumBreakdown | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  const canAdvance = [
    sensorData.nitrogen !== "" &&
      sensorData.phosphorus !== "" &&
      sensorData.potassium !== "" &&
      sensorData.temperature !== "" &&
      sensorData.humidity !== "" &&
      sensorData.soilPH !== "" &&
      sensorData.rainfall !== "",
    !!parcel?.district && !!parcel?.taluka && !!parcel?.village && !!parcel?.geoJson && !!parcel?.isValid,
    !!details.farmName.trim() &&
      !!details.farmerName.trim() &&
      !!details.crop &&
      !!details.cropVariety &&
      (details.cropVariety !== "Other" || !!details.customCropVariety?.trim()) &&
      !!details.sowingDate &&
      !!details.growthStage &&
      !!details.irrigationType &&
      !!details.soilType,
    true,
    !!prediction,
    true,
  ];

  const runAssessment = async () => {
    if (!parcel || !envData?.weather) return;
    setAssessing(true);
    setAssessmentError(null);
    try {
      const res = await fetch("/api/risk/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: parcel.latitude,
          longitude: parcel.longitude,
          district: parcel.district,
          taluka: parcel.taluka,
          village: parcel.village,
          crop: details.crop,
          cropVariety: details.cropVariety === "Other" ? details.customCropVariety : details.cropVariety,
          sowingDate: details.sowingDate,
          growthStage: details.growthStage,
          soilType: details.soilType,
          irrigationType: details.irrigationType,
          areaAcres: parcel.areaAcres,
          rainfallMm: envData.weather.rainfallMm24h,
          temperatureC: envData.weather.temperatureC,
          humidityPct: envData.weather.humidityPct,
          soilMoisturePct: envData.soilMoisturePct ?? undefined,
          ndvi: envData.ndvi?.ndvi ?? null,
          v2Features: envData.v2Features ?? undefined,
          sensorData,
        }),
      });
      if (!res.ok) throw new Error("Risk model service is currently unavailable.");
      const data = await res.json();
      setPrediction(data.prediction);
      setPricing(data.pricing);
    } catch (err) {
      setAssessmentError(err instanceof Error ? err.message : "Risk assessment failed.");
    } finally {
      setAssessing(false);
    }
  };

  const goNext = () => {
    if (step === 3) {
      runAssessment();
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const submitUnderwriting = async () => {
    if (!parcel || !details || !envData || !prediction || !pricing) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/underwriting/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer: { name: details.farmName }, // mock
          farm: { name: details.farmName, region: parcel.displayName || "Unknown" },
          crop: details.crop,
          location: { 
            latitude: parcel.latitude, 
            longitude: parcel.longitude,
            boundaryImage: parcel.boundaryImage 
          },
          geoPolygon: parcel.geoJson,
          area: parcel.areaAcres,
          environmentalData: {
            ...envData,
            sensorData,
          },
          riskAssessment: {
            riskScore: prediction.riskScore,
            riskTier: prediction.riskLevel,
            factors: prediction.factors,
            predictedYieldKgHa: prediction.predictedYieldKgHa,
            expectedYieldKgHa: prediction.expectedYieldKgHa,
            yieldDeviationPct: prediction.yieldDeviationPct,
          },
          premiumRecommendation: pricing,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit for underwriting.");

      setSubmissionResult({
        assessmentId: data.assessmentId,
        status: data.status,
        recommendedPremium: pricing.recommendedPremium,
        riskLevel: prediction.riskLevel,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
      <Card className="h-fit px-3 py-3 lg:sticky lg:top-4">
        <ol className="flex flex-col gap-1">
          {STEPS.map((label, i) => {
            const state = i < step ? "done" : i === step ? "active" : "upcoming";
            return (
              <li key={label}>
                <button
                  onClick={() => i <= step && setStep(i)}
                  disabled={i > step}
                  className={`flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-left text-[12px] ${
                    state === "active"
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]"
                      : state === "done"
                      ? "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]"
                      : "text-[var(--color-text-dim)]"
                  }`}
                >
                  <span
                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      state === "done"
                        ? "bg-[var(--color-emerald)] text-white"
                        : state === "active"
                        ? "border border-[var(--color-emerald)] text-[var(--color-emerald)]"
                        : "border border-[var(--color-border-strong)]"
                    }`}
                  >
                    {state === "done" ? <Check size={10} className="stroke-[3]" /> : i + 1}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card className="px-5 py-5">
        <h2 className="mb-4 text-[14px] font-medium text-[var(--color-text)]">{STEPS[step]}</h2>

        {step === 0 && <SensorSoilDataStep data={sensorData} onChange={setSensorData} />}
        {step === 1 && <LocationStep onSelect={setParcel} />}
        {step === 2 && <FarmDetailsStep details={details} onChange={setDetails} sensorData={sensorData} />}
        {step === 3 && (
          <EnvironmentalDataStep
            lat={parcel?.latitude ?? null}
            lng={parcel?.longitude ?? null}
            farmDetails={details}
            farmLocation={parcel}
            onData={setEnvData}
          />
        )}
        {step === 4 && (
          <RiskAssessmentStep
            loading={assessing}
            result={prediction}
            error={assessmentError}
            onRetry={runAssessment}
          />
        )}
        {step === 5 && (
          <PremiumRecommendationStep
            breakdown={pricing}
            onSubmit={submitUnderwriting}
            isSubmitting={submitting}
            error={submitError}
            successData={submissionResult}
            farmDetails={details}
            farmLocation={parcel}
          />
        )}

        <div className="mt-6 flex justify-between border-t border-[var(--color-border)] pt-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-[6px] border border-[var(--color-border)] px-3.5 py-2 text-[12.5px] text-[var(--color-text-muted)] disabled:opacity-40 cursor-pointer"
          >
            Back
          </button>
          {step < STEPS.length - 1 && (
            <button
              onClick={goNext}
              disabled={!canAdvance[step]}
              className="rounded-[6px] bg-[var(--color-emerald)] px-3.5 py-2 text-[12.5px] font-medium text-white disabled:opacity-40 cursor-pointer hover:opacity-95"
            >
              {step === 3 ? "Run risk assessment" : "Continue"}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
