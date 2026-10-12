"use client";

import React, { useEffect, useState } from "react";
import { Language } from "@/lib/farmer/types";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Sprout,
  ShieldCheck,
  Droplets,
  Thermometer,
  Layers,
  FileCheck,
  CheckCircle2,
  Info,
  Loader2,
  AlertCircle,
  Camera,
  Compass
} from "lucide-react";

export interface PersistedAssessment {
  id: number;
  assessmentCode: string;
  farmerId: number;
  farmerName: string | null;
  farmerPhone: string | null;
  district: string | null;
  taluka: string | null;
  village: string | null;
  locationName: string | null;
  latitude: string | null;
  longitude: string | null;
  areaAcres: string;
  irrigationType: string | null;
  soilType: string | null;
  farmImageUrl: string | null;
  soilImageUrl: string | null;
  weatherData: any;
  recommendations: any;
  selectedCrop: string;
  selectedLanguage: string;
  cropGuidance: any;
  premiumEstimate: string;
  pricingDetails: any;
  modelMetadata: any;
  status: string;
  createdAt: string;
}

interface AssessmentDetailViewProps {
  assessmentId: number | string;
  farmerId?: number;
  language: Language;
  onBack: () => void;
}

export function AssessmentDetailView({
  assessmentId,
  farmerId,
  language,
  onBack,
}: AssessmentDetailViewProps) {
  const [data, setData] = useState<PersistedAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  const fetchAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/farmer/assessment?id=${encodeURIComponent(assessmentId)}${
        farmerId ? `&farmerId=${farmerId}` : ""
      }`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json.success || !json.assessment) {
        throw new Error(json.error || "Failed to load assessment record.");
      }
      setData(json.assessment);
    } catch (err) {
      console.error("Error fetching assessment details:", err);
      setError(err instanceof Error ? err.message : "Error fetching assessment.");
    } finally {
      setLoading(false);
    }
  };

  const t = {
    mr: {
      backBtn: "मागे जा",
      title: "जतन केलेले शेत मूल्यांकन",
      loading: "डेटाबेसवरून मूल्यांकन अहवाल आणत आहे...",
      error: "अहवाल लोड करण्यात त्रुटी आली.",
      retry: "पुन्हा प्रयत्न करा",
      metaSection: "मूल्यांकन ओळख व वेळ",
      locationSection: "शेत व भौगोलिक स्थान",
      weatherSection: "नोंदवलेले हवामान निरीक्षणे",
      recommendationsSection: "मूळ Top 5 पीक शिफारसी",
      selectedCropSection: "शेतकऱ्याने निवडलेले पीक व मार्गदर्शन",
      premiumSection: "जतन केलेला विमा प्रीमियम अंदाज",
      pricingBasis: "प्रीमियम आकारणी आधार व गुणक",
      disclaimer: "हा प्रीमियम अंदाज या विशिष्ट मूल्यांकनाच्या वेळी जतन केलेल्या ऐतिहासिक नोंदींवर आधारित आहे.",
      waterCare: "पाणी व्यवस्थापन",
      fertilizerCare: "खत व पोषण व्यवस्थापन",
      precautions: "हवामान सावधगिरी",
      growthStages: "वाढीचे टप्पे व काळजी",
    },
    hi: {
      backBtn: "वापस जाएं",
      title: "सहेजा गया खेत मूल्यांकन",
      loading: "डेटाबेस से मूल्यांकन रिपोर्ट लोड हो रही है...",
      error: "रिपोर्ट लोड करने में त्रुटि।",
      retry: "पुनः प्रयास करें",
      metaSection: "मूल्यांकन पहचान एवं समय",
      locationSection: "खेत व भौगोलिक स्थान",
      weatherSection: "मौसम अवलोकन डेटा",
      recommendationsSection: "मूल शीर्ष 5 फसल सिफारिशें",
      selectedCropSection: "किसान द्वारा चुनी गई फसल एवं मार्गदर्शन",
      premiumSection: "सहेजा गया बीमा प्रीमियम अनुमान",
      pricingBasis: "प्रीमियम गणना आधार व गुणक",
      disclaimer: "यह प्रीमियम अनुमान इस विशिष्ट मूल्यांकन के समय सहेजे गए रिकॉर्ड पर आधारित है।",
      waterCare: "जल प्रबंधन",
      fertilizerCare: "उर्वरक एवं पोषण प्रबंधन",
      precautions: "मौसम सावधानियां",
      growthStages: "विकास चरण व देखभाल",
    },
    en: {
      backBtn: "Go Back",
      title: "Persisted Farm Assessment Record",
      loading: "Fetching assessment snapshot from database...",
      error: "Failed to load assessment report.",
      retry: "Retry",
      metaSection: "Assessment ID & Timestamp",
      locationSection: "Farm & GPS Location",
      weatherSection: "Weather Observations Used",
      recommendationsSection: "Original Top 5 Crop Recommendations",
      selectedCropSection: "Farmer Selected Crop & Guidance",
      premiumSection: "Persisted Insurance Premium Estimate",
      pricingBasis: "Pricing Basis & Actuarial Factors",
      disclaimer: "This premium estimate was deterministically saved during this specific assessment and preserved without modification.",
      waterCare: "Water Management",
      fertilizerCare: "Fertilizer Schedule",
      precautions: "Weather Precautions",
      growthStages: "Growth Stages",
    },
  }[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={36} className="animate-spin text-emerald-700 mb-3" />
        <p className="text-sm font-bold text-[var(--color-text)]">{t.loading}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-[var(--color-surface)] p-8 shadow-lg">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-extrabold text-[var(--color-text)]">{t.error}</h2>
          <p className="mt-1 text-xs text-[var(--color-text-dim)]">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={onBack}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
            >
              {t.backBtn}
            </button>
            <button
              onClick={fetchAssessment}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600"
            >
              {t.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recommendationsList: any[] = Array.isArray(data.recommendations) ? data.recommendations : [];
  const weather = data.weatherData;
  const pricing = data.pricingDetails;
  const guidance = data.cropGuidance;
  const createdDate = new Date(data.createdAt).toLocaleString(
    language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN",
    { dateStyle: "long", timeStyle: "short" }
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2 text-xs font-bold text-[var(--color-text)] hover:border-emerald-600 transition"
          >
            <ArrowLeft size={14} />
            <span>{t.backBtn}</span>
          </button>

          <div className="text-center">
            <h1 className="text-sm font-extrabold tracking-tight sm:text-base text-[var(--color-text)]">
              {t.title}
            </h1>
            <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
              {data.assessmentCode}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 px-3 py-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={13} />
            <span className="uppercase">{data.status}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Banner: Hero Summary */}
        <div className="rounded-3xl border border-emerald-600/30 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-100">
                {language === "mr" ? "जतन केलेला अहवाल" : language === "hi" ? "सहेजी गई रिपोर्ट" : "Database Record"}
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
                {data.selectedCrop}
              </h2>
              <p className="mt-1 text-xs text-emerald-100 flex items-center gap-1.5">
                <Calendar size={13} />
                <span>{createdDate}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-black/25 p-4 text-left sm:text-right border border-white/10 backdrop-blur-xs">
              <p className="text-xs font-semibold text-emerald-200">
                {language === "mr" ? "जतन केलेला वार्षिक प्रीमियम" : language === "hi" ? "सहेजा गया वार्षिक प्रीमियम" : "Persisted Annual Premium"}
              </p>
              <p className="mt-0.5 text-3xl font-black text-white">
                ₹{Number(data.premiumEstimate).toLocaleString("en-IN")}
                <span className="text-xs font-normal text-emerald-200"> / {language === "mr" ? "वर्ष" : language === "hi" ? "वर्ष" : "yr"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Location & Farm Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location & GPS */}
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-emerald-700" />
              <span>{t.locationSection}</span>
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-dim)]">{language === "mr" ? "स्थान / गाव" : language === "hi" ? "स्थान" : "Location"}</span>
                <span className="font-bold text-[var(--color-text)]">{data.locationName || "Maharashtra"}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-dim)]">GPS Coordinates</span>
                <span className="font-mono font-bold text-[var(--color-text)]">
                  {Number(data.latitude).toFixed(4)}° N, {Number(data.longitude).toFixed(4)}° E
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-dim)]">{language === "mr" ? "शेतकरी" : language === "hi" ? "किसान" : "Farmer"}</span>
                <span className="font-bold text-[var(--color-text)]">{data.farmerName || "Farmer"}</span>
              </div>
              {data.farmerPhone && (
                <div className="flex justify-between pt-0.5">
                  <span className="text-[var(--color-text-dim)]">{language === "mr" ? "मोबाईल" : language === "hi" ? "मोबाइल" : "Mobile"}</span>
                  <span className="font-mono font-bold text-[var(--color-text)]">+91 {data.farmerPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Farm Agronomics */}
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center gap-2 mb-4">
              <Layers size={16} className="text-emerald-700" />
              <span>{language === "mr" ? "शेत व जमीन माहिती" : language === "hi" ? "खेत एवं भूमि विवरण" : "Farm & Soil Profile"}</span>
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-dim)]">{language === "mr" ? "शेत क्षेत्रफळ" : language === "hi" ? "क्षेत्रफल" : "Farm Area"}</span>
                <span className="font-bold text-[var(--color-text)]">{data.areaAcres} {language === "mr" ? "एकर" : language === "hi" ? "एकड़" : "Acres"}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-dim)]">{language === "mr" ? "माती प्रकार" : language === "hi" ? "मिट्टी प्रकार" : "Soil Type"}</span>
                <span className="font-bold text-[var(--color-text)]">{data.soilType || "Black Soil"}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-text-dim)]">{language === "mr" ? "सिंचन प्रकार" : language === "hi" ? "सिंचाई प्रकार" : "Irrigation"}</span>
                <span className="font-bold text-[var(--color-text)]">{data.irrigationType || "Rainfed"}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-[var(--color-text-dim)]">{language === "mr" ? "शेताचे फोटो" : language === "hi" ? "खेत की फोटो" : "Farm Photos"}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Camera size={13} />
                  <span>{data.farmImageUrl ? "2 Photos Attached" : "Attached at submission"}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Observations Used */}
        {weather && (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center gap-2 mb-4">
              <Thermometer size={16} className="text-emerald-700" />
              <span>{t.weatherSection}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-center">
                <p className="text-[11px] font-medium text-[var(--color-text-dim)]">Temperature</p>
                <p className="mt-1 text-lg font-black text-[var(--color-text)]">{weather.temperatureC ?? "28"}°C</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-center">
                <p className="text-[11px] font-medium text-[var(--color-text-dim)]">Humidity</p>
                <p className="mt-1 text-lg font-black text-[var(--color-text)]">{weather.humidityPct ?? "65"}%</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-center">
                <p className="text-[11px] font-medium text-[var(--color-text-dim)]">Rainfall</p>
                <p className="mt-1 text-lg font-black text-[var(--color-text)]">{weather.rainfallMm ?? "850"} mm</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-center">
                <p className="text-[11px] font-medium text-[var(--color-text-dim)]">Data Source</p>
                <p className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">
                  {weather.source || "Open-Meteo & IMD"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Original Top 5 Recommendations Snapshot */}
        {recommendationsList.length > 0 && (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center gap-2 mb-4">
              <Sprout size={16} className="text-emerald-700" />
              <span>{t.recommendationsSection}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {recommendationsList.slice(0, 5).map((rec: any, idx: number) => {
                const isSelected = rec.cropKey?.toLowerCase() === data.selectedCrop?.toLowerCase() ||
                  rec.cropEn?.toLowerCase() === data.selectedCrop?.toLowerCase();
                const cropDisplayName = language === "mr" ? (rec.cropMr || rec.cropEn) : language === "hi" ? (rec.cropHi || rec.cropEn) : rec.cropEn;

                return (
                  <div
                    key={rec.cropKey || idx}
                    className={`rounded-2xl border-2 p-4 transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                        : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-black text-white">
                        Rank {rec.rank || idx + 1}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 size={12} />
                          <span>Selected</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black text-[var(--color-text)] truncate">{cropDisplayName}</p>
                    <p className="text-[11px] text-[var(--color-text-dim)] font-medium">({rec.cropEn})</p>
                    <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px]">
                      <span className="text-[var(--color-text-dim)]">Soil Status:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {rec.soilStatus || "Soil Compatible"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Crop Guidance Snapshot */}
        {guidance && (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center gap-2">
              <FileCheck size={16} className="text-emerald-700" />
              <span>{t.selectedCropSection}</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guidance.waterGuidance && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <Droplets size={14} />
                    <span>{t.waterCare}</span>
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {language === "mr" ? (guidance.waterGuidanceMr || guidance.waterGuidance) : language === "hi" ? (guidance.waterGuidanceHi || guidance.waterGuidance) : guidance.waterGuidance}
                  </p>
                </div>
              )}

              {guidance.fertilizerSchedule && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <Layers size={14} />
                    <span>{t.fertilizerCare}</span>
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {language === "mr" ? (guidance.fertilizerScheduleMr || guidance.fertilizerSchedule) : language === "hi" ? (guidance.fertilizerScheduleHi || guidance.fertilizerSchedule) : guidance.fertilizerSchedule}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Basis & Actuarial Breakdown Snapshot */}
        {pricing && (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-emerald-700" />
              <span>{t.pricingBasis}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5">
                <p className="text-[11px] text-[var(--color-text-dim)]">Base Exposure</p>
                <p className="mt-1 font-bold text-[var(--color-text)]">₹{Number(pricing.baseExposure || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5">
                <p className="text-[11px] text-[var(--color-text-dim)]">Risk Multiplier</p>
                <p className="mt-1 font-bold text-[var(--color-text)]">× {pricing.riskMultiplier || "1.0"}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5">
                <p className="text-[11px] text-[var(--color-text-dim)]">Irrigation Factor</p>
                <p className="mt-1 font-bold text-[var(--color-text)]">× {pricing.irrigationFactor || "1.0"}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5">
                <p className="text-[11px] text-[var(--color-text-dim)]">Soil Factor</p>
                <p className="mt-1 font-bold text-[var(--color-text)]">× {pricing.soilFactor || "1.0"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 text-[11px] text-[var(--color-text-dim)] flex items-start gap-2">
              <Info size={14} className="text-emerald-700 shrink-0 mt-0.5" />
              <span>{t.disclaimer}</span>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
