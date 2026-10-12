"use client";

import { useState, useEffect, useRef } from "react";
import { useFarmer } from "./FarmerContext";
import {
  CROP_TRANSLATIONS,
  INSURANCE_ELIGIBLE_CROPS,
  Language,
  SoilInputs,
  CropRecommendation,
  WeatherData
} from "@/lib/farmer/types";
import { CROP_GUIDANCE, getFallbackGuidance } from "@/lib/farmer/cropGuidance";
import { calculateAgriSurgePremium } from "@/lib/pricing/pricingConfig";
import { MonthlyRainfallChart, AnnualYoYRainfallChart } from "./WeatherCharts";
import { CropAiAnalysis } from "./CropAiAnalysis";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Loader2,
  Camera,
  X,
  CheckCircle2,
  Volume2,
  VolumeX,
  AlertCircle,
  Info,
  ShieldCheck,
  Sprout,
  User,
  CloudSun,
  Layers,
  BookOpen,
  Thermometer,
  Droplets,
  Wind,
  Calendar,
  Clock,
  Sparkles,
  FileCheck,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Compass
} from "lucide-react";

// ── Step sequence ───────────────────────────────────────────────────────────
const STEPS = [
  "details",
  "location",
  "photos",
  "weather",
  "soil",
  "crops",
  "guidance",
  "premium"
] as const;
type StepId = typeof STEPS[number];

const STEP_LABELS: Record<Language, Record<StepId, string>> = {
  mr: {
    details: "शेतकरी माहिती",
    location: "शेत स्थान (GPS)",
    photos: "शेताचे फोटो",
    weather: "हवामान माहिती",
    soil: "शेत व माती",
    crops: "पीक शिफारस",
    guidance: "पीक मार्गदर्शन",
    premium: "विमा अंदाज",
  },
  hi: {
    details: "किसान जानकारी",
    location: "खेत स्थान (GPS)",
    photos: "खेत की फोटो",
    weather: "मौसम जानकारी",
    soil: "खेत और मिट्टी",
    crops: "फसल सिफारिश",
    guidance: "फसल मार्गदर्शन",
    premium: "बीमा अनुमान",
  },
  en: {
    details: "Farmer Details",
    location: "Farm GPS",
    photos: "Farm Photos",
    weather: "Weather Intelligence",
    soil: "Farm & Soil",
    crops: "Crop Advice",
    guidance: "Crop Guidance",
    premium: "Insurance Estimate",
  },
};

const STEP_ICONS: Record<StepId, React.ComponentType<{ size?: number; className?: string }>> = {
  details: User,
  location: MapPin,
  photos: Camera,
  weather: CloudSun,
  soil: Layers,
  crops: Sprout,
  guidance: BookOpen,
  premium: ShieldCheck,
};

// ── Main Wizard Component ───────────────────────────────────────────────────
type Props = { onExit: () => void };

export function AssessmentWizard({ onExit }: Props) {
  const { farmer, language, assessment, updateAssessment } = useFarmer();
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; id?: string; error?: string } | null>(null);

  const currentStep = STEPS[stepIdx];
  const stepLabels = STEP_LABELS[language];

  const next = () => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => {
    if (stepIdx === 0) onExit();
    else setStepIdx((i) => i - 1);
  };

  const jumpToStep = (idx: number) => {
    // Only allow jumping back to already completed steps
    if (idx < stepIdx) {
      setStepIdx(idx);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={back}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-dim)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {stepLabels[currentStep]}
              </p>
              <h1 className="text-sm font-extrabold text-[var(--color-text)] sm:text-base">
                {language === "mr" ? "शेत मूल्यांकन प्रक्रिया" : language === "hi" ? "फार्म असेसमेंट प्रक्रिया" : "Farm Assessment Workflow"}
              </h1>
            </div>
          </div>

          {/* Progress fraction pill */}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-300">
              {stepIdx + 1} / {STEPS.length}
            </span>
            <button
              onClick={onExit}
              className="text-xs font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition hidden sm:inline"
            >
              {language === "mr" ? "बाहेर पडा" : language === "hi" ? "बाहर निकलें" : "Exit"}
            </button>
          </div>
        </div>

        {/* Thin progress bar */}
        <div className="mt-2.5 h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
            style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content Area — Desktop Wide 7xl Multi-Column Layout */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* LEFT SIDEBAR: Step Overview & Farm Snapshot (Desktop: 4 cols) */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-6">
            {/* Step Stepper Navigation Card */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-dim)] mb-4">
                {language === "mr" ? "मूल्यांकन टप्पे" : language === "hi" ? "असेसमेंट चरण" : "Assessment Steps"}
              </h2>

              <nav className="flex flex-col gap-2" aria-label="Step Progress">
                {STEPS.map((sId, idx) => {
                  const Icon = STEP_ICONS[sId];
                  const isCurrent = idx === stepIdx;
                  const isPast = idx < stepIdx;

                  return (
                    <button
                      key={sId}
                      onClick={() => jumpToStep(idx)}
                      disabled={!isPast}
                      className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all ${
                        isCurrent
                          ? "bg-emerald-700 text-white shadow-md font-extrabold"
                          : isPast
                          ? "hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] font-semibold cursor-pointer"
                          : "text-[var(--color-text-dim)] opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                          isCurrent
                            ? "bg-white/20 text-white"
                            : isPast
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-[var(--color-border)] text-[var(--color-text-dim)]"
                        }`}
                      >
                        {isPast ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{stepLabels[sId]}</p>
                      </div>

                      <span className="text-[10px] font-bold opacity-75">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Farm Snapshot Card */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-1.5">
                <Compass size={14} className="text-emerald-700" />
                <span>{language === "mr" ? "शेत तपशील सारांश" : language === "hi" ? "खेत विवरण सारांश" : "Farm Snapshot"}</span>
              </h3>

              <div className="mt-3 flex flex-col gap-2.5 text-xs text-[var(--color-text-dim)]">
                <div className="flex justify-between border-b border-[var(--color-border)] pb-1.5">
                  <span>{language === "mr" ? "शेतकरी" : language === "hi" ? "किसान" : "Farmer"}:</span>
                  <span className="font-bold text-[var(--color-text)]">{farmer?.name || "—"}</span>
                </div>

                <div className="flex justify-between border-b border-[var(--color-border)] pb-1.5">
                  <span>{language === "mr" ? "स्थान" : language === "hi" ? "स्थान" : "Location"}:</span>
                  <span className="font-bold text-[var(--color-text)] truncate max-w-[140px]">
                    {farmer?.village ? `${farmer.village}, ${farmer.district}` : farmer?.district || "—"}
                  </span>
                </div>

                {assessment.location && (
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-1.5">
                    <span>GPS:</span>
                    <span className="font-mono font-bold text-[var(--color-text)]">
                      {assessment.location.latitude.toFixed(3)}°, {assessment.location.longitude.toFixed(3)}°
                    </span>
                  </div>
                )}

                {assessment.weather && (
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-1.5">
                    <span>{language === "mr" ? "हवामान" : language === "hi" ? "मौसम" : "Weather"}:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {assessment.weather.temperatureC.toFixed(1)}°C · {assessment.weather.humidityPct}%
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-b border-[var(--color-border)] pb-1.5">
                  <span>{language === "mr" ? "शेत क्षेत्र" : language === "hi" ? "क्षेत्रफल" : "Area"}:</span>
                  <span className="font-bold text-[var(--color-text)]">
                    {assessment.soilInputs.areaAcres} {language === "mr" ? "एकर" : language === "hi" ? "एकड़" : "Acres"}
                  </span>
                </div>

                {assessment.selectedCrop && (
                  <div className="flex justify-between pt-0.5">
                    <span>{language === "mr" ? "निवडलेले पीक" : language === "hi" ? "चुनी फसल" : "Crop"}:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {assessment.selectedCrop.cropMr || assessment.selectedCrop.cropEn}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT / MAIN CONTENT AREA (Desktop: 8 cols) */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
              {currentStep === "details" && (
                <DetailsStep language={language} onNext={next} />
              )}
              {currentStep === "location" && (
                <LocationStep language={language} onNext={next} />
              )}
              {currentStep === "photos" && (
                <PhotosStep language={language} onNext={next} />
              )}
              {currentStep === "weather" && (
                <WeatherStep language={language} onNext={next} />
              )}
              {currentStep === "soil" && (
                <SoilStep language={language} onNext={next} />
              )}
              {currentStep === "crops" && (
                <CropsStep language={language} onNext={next} />
              )}
              {currentStep === "guidance" && (
                <GuidanceStep language={language} onNext={next} />
              )}
              {currentStep === "premium" && (
                <PremiumStep
                  language={language}
                  saving={saving}
                  saveResult={saveResult}
                  onSave={async () => {
                    setSaving(true);
                    setSaveResult(null);
                    try {
                      const body = {
                        farmerId: farmer?.id,
                        district: farmer?.district,
                        taluka: farmer?.taluka,
                        village: farmer?.village,
                        latitude: assessment.location?.latitude,
                        longitude: assessment.location?.longitude,
                        farmImageUrl: assessment.photos.farmImageUrl || assessment.photos.farmImageFile?.name || null,
                        soilImageUrl: assessment.photos.soilImageUrl || assessment.photos.soilImageFile?.name || null,
                        soilType: assessment.soilInputs.soilType,
                        irrigationType: assessment.soilInputs.irrigationType,
                        crop: assessment.selectedCrop?.cropKey || "",
                        selectedCrop: assessment.selectedCrop?.cropEn || assessment.selectedCrop?.cropKey || "",
                        areaAcres: assessment.soilInputs.areaAcres,
                        recommendations: assessment.recommendations,
                        weather: assessment.weather,
                        cropGuidance: assessment.selectedCrop ? CROP_GUIDANCE[assessment.selectedCrop.cropKey] : null,
                        language,
                        premiumDetails: assessment.premiumDetails,
                      };
                      const res = await fetch("/api/farmer/assessment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.success) {
                        throw new Error(data.error || "Failed to persist assessment in database.");
                      }
                      setSaveResult({ success: true, id: data.assessmentId });
                    } catch (err) {
                      setSaveResult({
                        success: false,
                        error: err instanceof Error ? err.message : "Error saving assessment to database.",
                      });
                    } finally {
                      setSaving(false);
                    }
                  }}
                  onExit={onExit}
                />
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 1 — Farmer Profile Details
// ═══════════════════════════════════════════════════════════
function DetailsStep({ language: lang, onNext }: { language: Language; onNext: () => void }) {
  const { farmer, setFarmer, t } = useFarmer();
  const [name, setName] = useState(farmer?.name || "");
  const [district, setDistrict] = useState(farmer?.district || "");
  const [taluka, setTaluka] = useState(farmer?.taluka || "");
  const [village, setVillage] = useState(farmer?.village || "");
  const [districts, setDistricts] = useState<string[]>([]);
  const [talukas, setTalukas] = useState<string[]>([]);
  const [villages, setVillages] = useState<{ nameEnglish: string; nameLocal: string }[]>([]);
  const [villageQuery, setVillageQuery] = useState("");

  useEffect(() => {
    fetch("/api/locations?type=districts")
      .then((r) => r.json())
      .then((d) => setDistricts(d.districts || []));
  }, []);

  useEffect(() => {
    if (!district) { setTalukas([]); setTaluka(""); return; }
    fetch(`/api/locations?type=talukas&district=${encodeURIComponent(district)}`)
      .then((r) => r.json())
      .then((d) => setTalukas(d.talukas || []));
  }, [district]);

  useEffect(() => {
    if (!district || !taluka) { setVillages([]); return; }
    const q = villageQuery ? `&query=${encodeURIComponent(villageQuery)}` : "";
    fetch(`/api/locations?type=villages&district=${encodeURIComponent(district)}&taluka=${encodeURIComponent(taluka)}${q}`)
      .then((r) => r.json())
      .then((d) => setVillages(d.villages || []));
  }, [district, taluka, villageQuery]);

  const canContinue = name.trim().length >= 2 && district && taluka && village;

  const handleNext = () => {
    if (!farmer) return;
    setFarmer({ ...farmer, name: name.trim(), district, taluka, village, language: lang });
    onNext();
  };

  const lbl = {
    title: { mr: "तुमची माहिती", hi: "आपकी जानकारी", en: "Your Details" }[lang],
    subtitle: {
      mr: "शेताच्या अचूक हवामान व स्थानिक पीक सल्ल्यासाठी गाव व तालुका निवडा.",
      hi: "खेत के सटीक मौसम व स्थानीय फसल सलाह के लिए गाँव व तहसील चुनें।",
      en: "Select your village and taluka for localized weather and advisory.",
    }[lang],
    state: { mr: "राज्य / State", hi: "राज्य / State", en: "State" }[lang],
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">{lbl.title}</h2>
        <p className="mt-1 text-xs text-[var(--color-text-dim)]">{lbl.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Name */}
        <FormField label={t.nameLabel}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="farmer-input"
          />
        </FormField>

        {/* State */}
        <FormField label={lbl.state}>
          <input
            type="text"
            value="Maharashtra"
            disabled
            className="farmer-input opacity-70 bg-[var(--color-surface-raised)] cursor-not-allowed"
          />
        </FormField>

        {/* District */}
        <FormField label={t.districtLabel}>
          <select
            value={district}
            onChange={(e) => { setDistrict(e.target.value); setTaluka(""); setVillage(""); }}
            className="farmer-input"
          >
            <option value="">{lang === "mr" ? "जिल्हा निवडा" : lang === "hi" ? "जिला चुनें" : "Select district"}</option>
            {districts.filter((d) => d !== "478").map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </FormField>

        {/* Taluka */}
        <FormField label={t.talukaLabel}>
          <select
            value={taluka}
            onChange={(e) => { setTaluka(e.target.value); setVillage(""); }}
            disabled={!district}
            className="farmer-input disabled:opacity-50"
          >
            <option value="">{lang === "mr" ? "तालुका निवडा" : lang === "hi" ? "तहसील चुनें" : "Select taluka"}</option>
            {talukas.map((tk) => <option key={tk} value={tk}>{tk}</option>)}
          </select>
        </FormField>
      </div>

      {/* Village Search */}
      {taluka && (
        <FormField label={t.villageLabel}>
          <input
            type="text"
            value={villageQuery}
            onChange={(e) => { setVillageQuery(e.target.value); setVillage(""); }}
            placeholder={lang === "mr" ? "गाव शोधा किंवा निवडा..." : lang === "hi" ? "गाँव खोजें या चुनें..." : "Search village..."}
            className="farmer-input mb-2"
          />
          {villages.length > 0 && !village && (
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md">
              {villages.slice(0, 40).map((v) => (
                <button
                  key={v.nameEnglish}
                  type="button"
                  onClick={() => { setVillage(v.nameEnglish); setVillageQuery(v.nameEnglish); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] transition flex items-center justify-between"
                >
                  <span className="font-bold">{v.nameEnglish}</span>
                  {v.nameLocal && <span className="text-[11px] text-[var(--color-text-dim)]">({v.nameLocal})</span>}
                </button>
              ))}
            </div>
          )}
          {village && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 text-sm font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={16} />
              <span>{village}</span>
              <button
                type="button"
                onClick={() => { setVillage(""); setVillageQuery(""); }}
                className="ml-auto text-[var(--color-text-dim)] hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </FormField>
      )}

      <div className="pt-2">
        <WizardButton disabled={!canContinue} onClick={handleNext} label={t.continueBtn} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 2 — GPS Farm Location
// ═══════════════════════════════════════════════════════════
function LocationStep({ language: lang, onNext }: { language: Language; onNext: () => void }) {
  const { assessment, updateAssessment, t, farmer } = useFarmer();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (assessment.location) setStatus("success");
  }, []);

  const handleUseDistrictCenter = () => {
    const districtCoords: Record<string, [number, number]> = {
      Pune: [18.5204, 73.8567],
      Nashik: [19.9975, 73.7898],
      Nagpur: [21.1458, 79.0882],
      Kolhapur: [16.7050, 74.2433],
      Solapur: [17.6599, 75.9064],
      Satara: [17.6805, 74.0183],
      Sangli: [16.8524, 74.5815],
      Aurangabad: [19.8762, 75.3433],
      "Chhatrapati Sambhajinagar": [19.8762, 75.3433],
      Ahmednagar: [19.0952, 74.7496],
      Amravati: [20.9374, 77.7796],
      Nanded: [19.1383, 77.3210],
      Jalgaon: [21.0077, 75.5626],
      Latur: [18.4088, 76.5604],
      Dhule: [20.9042, 74.7749],
      Beed: [18.9891, 75.7601],
      Yavatmal: [20.3888, 78.1204],
      Chandrapur: [19.9615, 79.2961],
    };
    const dist = farmer?.district || "Pune";
    const [lat, lng] = districtCoords[dist] || [18.5204, 73.8567];
    updateAssessment({
      location: {
        latitude: lat,
        longitude: lng,
        accuracy: 1000,
        source: "manual",
      },
    });
    setStatus("success");
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg(lang === "mr" ? "ब्राउझरमध्ये GPS उपलब्ध नाही." : lang === "hi" ? "ब्राउज़र में GPS उपलब्ध नहीं है।" : "GPS is not available in browser.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateAssessment({
          location: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            source: "gps",
          },
        });
        setStatus("success");
      },
      () => {
        setStatus("error");
        setErrorMsg(
          lang === "mr"
            ? "GPS सिग्नल मिळाला नाही किंवा परवानगी नाकारली गेली. खाली दिलेल्या पर्यायातून गावाचे स्थान वापरा."
            : lang === "hi"
            ? "GPS सिग्नल प्राप्त नहीं हुआ। नीचे दिए गए विकल्प से गाँव का स्थान उपयोग करें।"
            : "GPS signal unavailable or denied. You can proceed with district coordinates."
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  const loc = assessment.location;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">{t.locationTitle}</h2>
        <p className="mt-1 text-xs text-[var(--color-text-dim)]">{t.locationInstruction}</p>
      </div>

      {status === "success" && loc ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={20} className="text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                {lang === "mr" ? "शेत स्थान यशस्वीरित्या मिळाले" : lang === "hi" ? "खेत स्थान सफलतापूर्वक प्राप्त हुआ" : "Farm Coordinates Captured"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-[11px] font-medium text-[var(--color-text-dim)]">Latitude (अक्षांश)</p>
                <p className="font-mono text-sm font-black text-[var(--color-text)]">{loc.latitude.toFixed(6)}° N</p>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-[11px] font-medium text-[var(--color-text-dim)]">Longitude (रेखांश)</p>
                <p className="font-mono text-sm font-black text-[var(--color-text)]">{loc.longitude.toFixed(6)}° E</p>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 col-span-2 sm:col-span-1">
                <p className="text-[11px] font-medium text-[var(--color-text-dim)]">
                  {lang === "mr" ? "स्रोत / अचूकता" : lang === "hi" ? "स्रोत / सटीकता" : "Source / Accuracy"}
                </p>
                <p className="text-xs font-bold text-[var(--color-text)]">
                  {loc.source === "gps" ? `GPS (±${Math.round(loc.accuracy || 10)}m)` : "जिल्हा केंद्र / District"}
                </p>
              </div>
            </div>
          </div>

          {/* Map Preview */}
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-inner">
            <iframe
              title="Farm location map"
              width="100%"
              height="220"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.008},${loc.latitude - 0.008},${loc.longitude + 0.008},${loc.latitude + 0.008}&layer=mapnik&marker=${loc.latitude},${loc.longitude}`}
              loading="lazy"
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <button
              onClick={getLocation}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw size={12} />
              <span>{lang === "mr" ? "GPS पुन्हा तपासा" : lang === "hi" ? "GPS पुनः जांचें" : "Re-acquire GPS"}</span>
            </button>
            <button
              onClick={handleUseDistrictCenter}
              className="text-xs font-semibold text-[var(--color-text-dim)] hover:underline"
            >
              {lang === "mr" ? "जिल्हा स्थान वापरा" : lang === "hi" ? "जिला स्थान उपयोग करें" : "Use District Center"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            onClick={getLocation}
            disabled={status === "loading"}
            className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-8 py-5 text-base font-extrabold text-white shadow-xl transition hover:bg-emerald-600 disabled:opacity-60 active:scale-[0.99]"
          >
            {status === "loading" ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <MapPin size={22} />
            )}
            <span>{status === "loading" ? (lang === "mr" ? "स्थान शोधत आहे..." : lang === "hi" ? "स्थान खोज रहा है..." : "Locating...") : t.locationBtn}</span>
          </button>

          {status === "error" && (
            <div className="rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-4 text-xs text-red-700 dark:text-red-300">
              <p className="font-semibold">{errorMsg}</p>
              <button
                onClick={handleUseDistrictCenter}
                className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition"
              >
                <Compass size={14} />
                <span>
                  {lang === "mr"
                    ? `जिल्हा केंद्र स्थान वापरा (${farmer?.district || "महाराष्ट्र"})`
                    : lang === "hi"
                    ? `जिला केंद्र स्थान उपयोग करें (${farmer?.district || "महाराष्ट्र"})`
                    : `Use district center coordinates (${farmer?.district || "Maharashtra"})`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="pt-2">
        <WizardButton disabled={status !== "success"} onClick={onNext} label={t.continueBtn} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 3 — Upload Two Farm Photos
// ═══════════════════════════════════════════════════════════
function PhotosStep({ language: lang, onNext }: { language: Language; onNext: () => void }) {
  const { assessment, updateAssessment, t } = useFarmer();
  const [farmPreview, setFarmPreview] = useState<string | null>(null);
  const [soilPreview, setSoilPreview] = useState<string | null>(null);
  const [farmError, setFarmError] = useState("");
  const [soilError, setSoilError] = useState("");
  const farmRef = useRef<HTMLInputElement>(null);
  const soilRef = useRef<HTMLInputElement>(null);

  const handleFile = (
    file: File | null,
    setPreview: (s: string | null) => void,
    setError: (s: string) => void,
    key: "farmImageFile" | "soilImageFile"
  ) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(lang === "mr" ? "फक्त फोटो फाइल निवडा." : lang === "hi" ? "केवल फोटो फाइल चुनें।" : "Image file required.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      updateAssessment({
        photos: { ...assessment.photos, [key]: file },
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">{t.photosTitle}</h2>
        <p className="mt-1 text-xs text-[var(--color-text-dim)]">
          {lang === "mr"
            ? "शेताच्या नोंदीसाठी शेताचा एक विहंगम फोटो आणि मातीचा जवळून एक स्पष्ट फोटो जोडा."
            : lang === "hi"
            ? "खेत के रिकॉर्ड के लिए खेत का एक दृश्य फोटो और मिट्टी का एक स्पष्ट फोटो जोड़ें।"
            : "Upload two clear photos: a landscape farm view and a close-up soil sample."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Farm Photo */}
        <PhotoUploadBox
          title={t.farmPhotoLabel}
          preview={farmPreview}
          error={farmError}
          inputRef={farmRef}
          onFile={(f) => handleFile(f, setFarmPreview, setFarmError, "farmImageFile")}
          onRemove={() => { setFarmPreview(null); updateAssessment({ photos: { ...assessment.photos, farmImageFile: undefined } }); }}
          lang={lang}
        />

        {/* Soil Photo */}
        <PhotoUploadBox
          title={t.soilPhotoLabel}
          preview={soilPreview}
          error={soilError}
          inputRef={soilRef}
          onFile={(f) => handleFile(f, setSoilPreview, setSoilError, "soilImageFile")}
          onRemove={() => { setSoilPreview(null); updateAssessment({ photos: { ...assessment.photos, soilImageFile: undefined } }); }}
          lang={lang}
        />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-xs text-[var(--color-text-dim)] flex items-start gap-2">
        <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
        <p>
          {lang === "mr"
            ? "हे फोटो शेत ओळख व दृश्य नोंदीसाठी आहेत. मातीतील रासायनिक घटक या फोटोवरून ठरवले जात नाहीत."
            : lang === "hi"
            ? "ये फोटो खेत पहचान व दृश्य रिकॉर्ड के लिए हैं। मिट्टी के रासायनिक तत्व फोटो से नहीं तय किए जाते।"
            : "These photographs serve as visual verification records for your farm parcel."}
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <WizardButton disabled={!farmPreview || !soilPreview} onClick={onNext} label={t.continueBtn} />
        {(!farmPreview || !soilPreview) && (
          <button
            onClick={onNext}
            className="text-center text-xs font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition py-2"
          >
            {lang === "mr" ? "फोटो नंतर जोडा (पुढे जा)" : lang === "hi" ? "फोटो बाद में जोड़ें (आगे बढ़ें)" : "Continue for now without photos"}
          </button>
        )}
      </div>
    </div>
  );
}

function PhotoUploadBox({
  title,
  preview,
  error,
  inputRef,
  onFile,
  onRemove,
  lang,
}: {
  title: string;
  preview: string | null;
  error: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File) => void;
  onRemove: () => void;
  lang: Language;
}) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
          <Camera size={16} className="text-emerald-700" />
          <span>{title}</span>
        </h3>

        <div className="mt-3">
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)]">
              <img src={preview} alt={title} className="h-48 w-full object-cover" />
              <button
                onClick={onRemove}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-500 transition"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:border-emerald-600 hover:text-emerald-700 transition"
            >
              <Camera size={32} />
              <span className="text-xs font-bold">
                {lang === "mr" ? "कॅमेरा किंवा गॅलरीतून फोटो जोडा" : lang === "hi" ? "कैमरा या गैलरी से फोटो जोड़ें" : "Upload or Take Photo"}
              </span>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
          />

          {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 4 — Weather Information Step (Rich Environmental Dashboard)
// ═══════════════════════════════════════════════════════════
function WeatherStep({ language: lang, onNext }: { language: Language; onNext: () => void }) {
  const { assessment, updateAssessment, t } = useFarmer();
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const loc = assessment.location;
  const wx = assessment.weather;

  useEffect(() => {
    if (loc && (!wx || !wx.historical)) {
      fetchAllWeatherData();
    }
  }, []);

  const fetchAllWeatherData = async () => {
    if (!loc) {
      setError(lang === "mr" ? "स्थान माहिती आवश्यक आहे." : lang === "hi" ? "स्थान जानकारी आवश्यक है।" : "Location coordinates required.");
      return;
    }
    setFetching(true);
    setError("");

    try {
      // 1. Fetch Live weather & 7-day forecast from Open-Meteo
      const liveRes = await fetch(`/api/weather?lat=${loc.latitude}&lng=${loc.longitude}`);
      const liveData = await liveRes.json();

      // 2. Fetch Historical IMD NetCDF grid analysis
      const histRes = await fetch(`/api/weather/historical?lat=${loc.latitude}&lng=${loc.longitude}&season=Kharif`);
      const histData = await histRes.json();

      const live = liveData.weather;
      const combinedWeather: WeatherData = {
        temperatureC: live?.temperatureC ?? 26.5,
        humidityPct: live?.humidityPct ?? 65,
        rainfallMm: live?.rainfallMm24h ?? 0.0,
        windSpeedKph: live?.windSpeedKph ?? 10.0,
        status: live?.status ?? "live",
        source: live?.source ?? "Open-Meteo",
        fetchedAt: live?.observedAt ?? new Date().toISOString(),
        forecast: live?.forecast ?? null,
        historical: histData.available ? histData : null,
      };

      updateAssessment({ weather: combinedWeather });
    } catch (err) {
      console.warn("Weather fetch error:", err);
      setError(lang === "mr" ? "हवामान डेटा मिळवताना त्रुटी आली." : lang === "hi" ? "मौसम डेटा प्राप्त करने में त्रुटि।" : "Could not fetch all weather metrics.");
    } finally {
      setFetching(false);
    }
  };

  const hist = wx?.historical;
  const forecast = wx?.forecast;

  const monthlyChartData = hist?.monthlyRainfall || [];
  const yoyChartData = hist?.annualYoY || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">{t.weatherTitle}</h2>
          <p className="mt-1 text-xs text-[var(--color-text-dim)]">
            {lang === "mr"
              ? "शेताच्या अक्षांश-रेखांशावरून घेतलेली थेट हवामान मोजणी आणि अधिकृत IMD ग्रिड पावसाचा इतिहास."
              : lang === "hi"
              ? "खेत के अक्षांश-देशांतर से प्राप्त लाइव मौसम और आधिकारिक IMD ग्रिड वर्षा का इतिहास।"
              : "Hyperlocal live meteorological readings alongside verified IMD NetCDF rainfall records."}
          </p>
        </div>

        <button
          onClick={fetchAllWeatherData}
          disabled={fetching}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition"
        >
          <RefreshCw size={13} className={fetching ? "animate-spin text-emerald-700" : ""} />
          <span>{lang === "mr" ? "रिफ्रेश करा" : lang === "hi" ? "रीफ्रेश करें" : "Refresh Weather"}</span>
        </button>
      </div>

      {fetching && !wx && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <Loader2 size={32} className="animate-spin text-emerald-700" />
          <p className="text-xs font-bold text-[var(--color-text)]">
            {lang === "mr" ? "थेट हवामान व IMD डेटा विश्लेषित करत आहे..." : lang === "hi" ? "मौसम व IMD डेटा विश्लेषण हो रहा है..." : "Analyzing meteorological and IMD records..."}
          </p>
        </div>
      )}

      {error && !wx && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">{error}</p>
            <button onClick={fetchAllWeatherData} className="mt-2 text-xs font-extrabold underline text-emerald-700">
              {lang === "mr" ? "पुन्हा प्रयत्न करा" : lang === "hi" ? "पुनः प्रयास करें" : "Retry"}
            </button>
          </div>
        </div>
      )}

      {wx && (
        <>
          {/* SECTION 1: Live Observations (4 Cards Across) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-[var(--color-text)] uppercase tracking-wider flex items-center gap-2">
                <Thermometer size={16} className="text-emerald-700" />
                <span>{lang === "mr" ? "सध्याचे हवामान निरीक्षण (थेट मोजणी)" : lang === "hi" ? "वर्तमान मौसम अवलोकन (लाइव)" : "Current Weather Observations (Live)"}</span>
              </span>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                {wx.source} · {new Date(wx.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                title={lang === "mr" ? "तापमान" : lang === "hi" ? "तापमान" : "Temperature"}
                value={`${wx.temperatureC.toFixed(1)}°C`}
                tag={lang === "mr" ? "थेट मोजणी" : lang === "hi" ? "लाइव" : "Live"}
                icon={Thermometer}
              />
              <MetricCard
                title={lang === "mr" ? "सापेक्ष आर्द्रता" : lang === "hi" ? "सापेक्ष आर्द्रता" : "Humidity"}
                value={`${Math.round(wx.humidityPct)}%`}
                tag={lang === "mr" ? "थेट मोजणी" : lang === "hi" ? "लाइव" : "Live"}
                icon={Droplets}
              />
              <MetricCard
                title={lang === "mr" ? "पाऊस (गेले २४ तास)" : lang === "hi" ? "वर्षा (24 घंटे)" : "Past 24h Rain"}
                value={`${wx.rainfallMm.toFixed(1)} mm`}
                tag={lang === "mr" ? "थेट मोजणी" : lang === "hi" ? "लाइव" : "Observed"}
                icon={CloudSun}
              />
              <MetricCard
                title={lang === "mr" ? "वाऱ्याचा वेग" : lang === "hi" ? "हवा की गति" : "Wind Speed"}
                value={`${wx.windSpeedKph.toFixed(1)} km/h`}
                tag={lang === "mr" ? "थेट मोजणी" : lang === "hi" ? "लाइव" : "Observed"}
                icon={Wind}
              />
            </div>
          </div>

          {/* SECTION 2: Official IMD Historical Rainfall Dataset & Trends */}
          {hist && (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--color-text)] flex items-center gap-2">
                    <BarChart3 size={18} className="text-emerald-700" />
                    <span>{lang === "mr" ? "IMD ऐतिहासिक पाऊस विश्लेषण व कल" : lang === "hi" ? "IMD ऐतिहासिक वर्षा विश्लेषण व रुझान" : "IMD Historical Rainfall Patterns"}</span>
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-dim)]">
                    {hist.sourceLabel} · {lang === "mr" ? `उपलब्ध वर्ष: ${hist.yearsAvailable}` : lang === "hi" ? `उपलब्ध वर्ष: ${hist.yearsAvailable}` : `Years: ${hist.yearsAvailable}`}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-700/10 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  {lang === "mr" ? "अधिकृत IMD ग्रिड डेटाबेस" : lang === "hi" ? "आधिकारिक IMD ग्रिड डेटा" : "Verified IMD 0.25° NetCDF Grid"}
                </span>
              </div>

              {/* Historical Indicators */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
                <MiniStatBox
                  label={lang === "mr" ? "वार्षिक पाऊस" : lang === "hi" ? "वार्षिक वर्षा" : "Annual Rain"}
                  val={`${hist.annualRainfallMm} mm`}
                  sub={`Ref: ${hist.referenceYear}`}
                />
                <MiniStatBox
                  label={lang === "mr" ? "खरीप पाऊस" : lang === "hi" ? "खरीफ वर्षा" : "Kharif Rain"}
                  val={`${hist.kharifRainfallMm} mm`}
                  sub="Jun–Oct"
                />
                <MiniStatBox
                  label={lang === "mr" ? "रब्बी पाऊस" : lang === "hi" ? "रबी वर्षा" : "Rabi Rain"}
                  val={`${hist.rabiRainfallMm} mm`}
                  sub="Nov–Mar"
                />
                <MiniStatBox
                  label={lang === "mr" ? "पावसाचे दिवस" : lang === "hi" ? "बारिश के दिन" : "Rainy Days"}
                  val={`${hist.rainyDays} दिवस / days`}
                  sub="≥ 2.5 mm/day"
                />
                <MiniStatBox
                  label={lang === "mr" ? "कोरडा काळ (Max)" : lang === "hi" ? "सूखा दौर (Max)" : "Dry Spell (Max)"}
                  val={`${hist.maxConsecutiveDryDays} दिवस / days`}
                  sub="Max dry run"
                />
                <MiniStatBox
                  label={lang === "mr" ? "कमाल एका दिवसात" : lang === "hi" ? "अधिकतम एक दिन" : "Peak Single Day"}
                  val={`${hist.maxDailyRainfallMm} mm`}
                  sub="Peak intensity"
                />
              </div>

              {/* CHARTS GRID: Monthly Breakdown & Multi-Year YoY */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Monthly Chart */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-700" />
                      <span>{lang === "mr" ? "मासिक पाऊस कल (जाने–डिसें)" : lang === "hi" ? "मासिक वर्षा रुझान (जन–दिस)" : "Monthly Rainfall Trend (Jan–Dec)"}</span>
                    </h4>
                    <span className="text-[10px] text-[var(--color-text-dim)]">Unit: mm</span>
                  </div>
                  <MonthlyRainfallChart data={monthlyChartData} />
                </div>

                {/* YoY Multi-Year Comparison Chart */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-700" />
                      <span>{lang === "mr" ? "वार्षिक पाऊस तुलना (Year-Over-Year)" : lang === "hi" ? "वार्षिक वर्षा तुलना (YoY)" : "Year-Over-Year Rainfall Comparison"}</span>
                    </h4>
                    <span className="text-[10px] text-[var(--color-text-dim)]">Unit: mm / year</span>
                  </div>
                  <AnnualYoYRainfallChart data={yoyChartData} />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: 7-Day Forecast (Clearly Separated from Historical) */}
          {forecast && forecast.days && forecast.days.length > 0 && (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--color-text)] flex items-center gap-2">
                    <Clock size={16} className="text-emerald-700" />
                    <span>{lang === "mr" ? "आगामी ७ दिवसांचा हवामान अंदाज (भविष्य अंदाज)" : lang === "hi" ? "आगामी 7 दिनों का मौसम पूर्वानुमान" : "7-Day Short-Term Forecast"}</span>
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-dim)]">
                    {forecast.source} · {lang === "mr" ? "अपेक्षित ७ दिवसांचा एकूण पाऊस:" : lang === "hi" ? "7 दिनों की कुल वर्षा:" : "Expected 7-day precipitation:"}{" "}
                    <span className="font-bold text-[var(--color-text)]">{forecast.totalRainfallMm7d} mm</span>
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-800 dark:text-blue-300">
                  {lang === "mr" ? "हवामान अंदाज मॉडेल" : lang === "hi" ? "मौसम पूर्वानुमान मॉडल" : "Forecast Model (Separated)"}
                </span>
              </div>

              {/* 7-Day Cards Scrollable Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7 pt-2">
                {forecast.days.map((day) => {
                  const dayDate = new Date(day.date);
                  const dayName = dayDate.toLocaleDateString(lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-US", { weekday: "short" });
                  const dateStr = dayDate.toLocaleDateString([], { month: "short", day: "numeric" });

                  return (
                    <div
                      key={day.date}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 text-center"
                    >
                      <p className="text-xs font-bold text-[var(--color-text)]">{dayName}</p>
                      <p className="text-[10px] text-[var(--color-text-dim)]">{dateStr}</p>
                      <div className="my-2 border-t border-[var(--color-border)]" />
                      <p className="text-xs font-extrabold text-[var(--color-text)]">
                        {Math.round(day.tempMaxC)}° / {Math.round(day.tempMinC)}°
                      </p>
                      <p className="mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        {day.precipitationMm > 0 ? `${day.precipitationMm.toFixed(1)} mm` : "0 mm"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="pt-2">
        <WizardButton disabled={!wx} onClick={onNext} label={t.continueBtn} />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  tag,
  icon: Icon,
}: {
  title: string;
  value: string;
  tag: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <Icon size={18} className="text-emerald-700 dark:text-emerald-400" />
        <span className="rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[9px] font-bold text-[var(--color-text-dim)]">
          {tag}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-lg font-black text-[var(--color-text)] sm:text-xl">{value}</p>
        <p className="text-[11px] font-medium text-[var(--color-text-dim)] truncate">{title}</p>
      </div>
    </div>
  );
}

function MiniStatBox({ label, val, sub }: { label: string; val: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-center">
      <p className="text-[10px] font-medium text-[var(--color-text-dim)] truncate">{label}</p>
      <p className="mt-0.5 text-xs font-black text-[var(--color-text)]">{val}</p>
      <p className="text-[9px] text-[var(--color-text-dim)] opacity-75">{sub}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 5 — Farm & Soil Information (Only Area, Irrigation, Soil Type)
// ═══════════════════════════════════════════════════════════
const IRRIGATION_CHOICES = [
  { key: "Rainfed", mr: "कोरडवाहू (पावसावर अवलंबून)", hi: "वर्षा आधारित (Rainfed)", en: "Rainfed (Monsoon Dependent)" },
  { key: "Drip", mr: "ठिबक सिंचन (Drip)", hi: "ड्रिप सिंचाई (Drip)", en: "Drip Irrigation" },
  { key: "Sprinkler", mr: "तुषार सिंचन (Sprinkler)", hi: "स्प्रिंकलर (Sprinkler)", en: "Sprinkler Irrigation" },
  { key: "Canal", mr: "कालवा / पाटबंधारे (Canal)", hi: "नहर सिंचाई (Canal)", en: "Canal Irrigation" },
  { key: "Borewell", mr: "कूपनलिका / विहीर (Borewell)", hi: "नलकूप / कुआं (Borewell)", en: "Borewell / Well Irrigation" },
];

const SOIL_CHOICES = [
  { key: "Black Soil", mr: "काळी कसदार माती / रेगूर (Black Soil)", hi: "काली मिट्टी (Black Soil)", en: "Black Soil (Regur)" },
  { key: "Red Soil", mr: "तांबडी माती (Red Soil)", hi: "लाल मिट्टी (Red Soil)", en: "Red Soil" },
  { key: "Alluvial Soil", mr: "गाळाची माती (Alluvial Soil)", hi: "जलोढ़ मिट्टी (Alluvial Soil)", en: "Alluvial Soil" },
  { key: "Loamy Soil", mr: "पोयटा / मध्यम माती (Loamy Soil)", hi: "दोमट मिट्टी (Loamy Soil)", en: "Loamy Soil" },
  { key: "Sandy Soil", mr: "रेताड माती (Sandy Soil)", hi: "बलुई मिट्टी (Sandy Soil)", en: "Sandy Soil" },
];

function SoilStep({ language: lang, onNext }: { language: Language; onNext: () => void }) {
  const { assessment, updateAssessment, t } = useFarmer();
  const soil = assessment.soilInputs;

  const update = (k: keyof SoilInputs, v: string | number) =>
    updateAssessment({ soilInputs: { ...soil, [k]: v } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">{t.soilInputsTitle}</h2>
        <p className="mt-1 text-xs text-[var(--color-text-dim)]">
          {lang === "mr"
            ? "आपल्या शेताचे क्षेत्रफळ, सिंचन पद्धत आणि मातीचा प्रकार निवडा. प्रयोगशाळा चाचणी आकडे विचारले जात नाहीत."
            : lang === "hi"
            ? "अपने खेत का क्षेत्रफल, सिंचाई का तरीका और मिट्टी का प्रकार चुनें।"
            : "Provide farm area, irrigation method, and soil type to tailor crop suitability."}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Input 1: Farm Area in Acres */}
        <FormField label={t.areaLabel}>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={soil.areaAcres || ""}
              min={0.1}
              step={0.5}
              onChange={(e) => update("areaAcres", Number(e.target.value))}
              placeholder="e.g. 2.5"
              className="farmer-input flex-1 font-bold text-base"
            />
            <div className="flex gap-1.5 shrink-0">
              {[1, 2, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => update("areaAcres", num)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    soil.areaAcres === num
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-emerald-600"
                  }`}
                >
                  {num} {lang === "mr" ? "एकर" : lang === "hi" ? "एकड़" : "Ac"}
                </button>
              ))}
            </div>
          </div>
        </FormField>

        {/* Input 2: Irrigation Type */}
        <FormField label={t.irrigationLabel}>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {IRRIGATION_CHOICES.map((choice) => {
              const isSelected = soil.irrigationType === choice.key;
              const title = choice[lang];

              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => update("irrigationType", choice.key)}
                  className={`flex items-center justify-between rounded-2xl border-2 p-3.5 text-left transition ${
                    isSelected
                      ? "border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-sm"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-emerald-600/50"
                  }`}
                >
                  <span className="text-xs font-bold">{title}</span>
                  {isSelected && <CheckCircle2 size={16} className="text-emerald-700 dark:text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </FormField>

        {/* Input 3: Soil Type */}
        <FormField label={t.soilTypeLabel}>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {SOIL_CHOICES.map((choice) => {
              const isSelected = soil.soilType === choice.key;
              const title = choice[lang];

              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => update("soilType", choice.key)}
                  className={`flex items-center justify-between rounded-2xl border-2 p-3.5 text-left transition ${
                    isSelected
                      ? "border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-sm"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-emerald-600/50"
                  }`}
                >
                  <span className="text-xs font-bold">{title}</span>
                  {isSelected && <CheckCircle2 size={16} className="text-emerald-700 dark:text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </FormField>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-xs text-[var(--color-text-dim)]">
        <p className="flex items-center gap-1.5 font-medium">
          <Info size={14} className="text-emerald-700 shrink-0" />
          <span>
            {lang === "mr"
              ? "शेतकऱ्यांवर प्रयोगशाळा चाचणीचे बंधन नाही. पीक शिफारस ही प्रत्यक्ष हवामान व मातीच्या प्रकारावर आधारित असेल."
              : lang === "hi"
              ? "प्रयोगशाला परीक्षण अनिवार्य नहीं है। फसल सिफारिश वास्तविक मौसम और मिट्टी प्रकार पर आधारित होगी।"
              : "No soil lab tests required. Crop suitability is evaluated using recorded weather and soil type."}
          </span>
        </p>
      </div>

      <div className="pt-2">
        <WizardButton disabled={!soil.areaAcres || soil.areaAcres <= 0} onClick={onNext} label={t.continueBtn} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 6 — Top 5 Crop Recommendations (AI Model & Agronomic Evidence)
// ═══════════════════════════════════════════════════════════
function CropsStep({ language: lang, onNext }: { language: Language; onNext: () => void }) {
  const { assessment, updateAssessment, t, farmer } = useFarmer();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched && assessment.recommendations.length === 0) {
      fetchRecommendations();
    } else if (assessment.recommendations.length > 0) {
      setFetched(true);
    }
  }, []);

  const fetchRecommendations = async () => {
    setAnalyzing(true);
    setError("");
    const startTime = Date.now();
    const soil = assessment.soilInputs;
    const wx = assessment.weather;
    const hist = wx?.historical;

    const payload = {
      temperature: wx?.temperatureC ?? 26.5,
      humidity: wx?.humidityPct ?? 65,
      rainfall: hist?.kharifRainfallMm ?? (wx?.rainfallMm ? wx.rainfallMm * 30 : 120),
      soilType: soil.soilType,
      irrigationType: soil.irrigationType,
      areaAcres: soil.areaAcres,
      district: farmer?.district,
    };

    try {
      const res = await fetch("/api/crops/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setAnalyzing(false);
        return;
      }

      // Enforce approximately 5.2s duration for smooth AI animation
      const elapsed = Date.now() - startTime;
      const minDuration = 5200;
      if (elapsed < minDuration) {
        await new Promise((r) => setTimeout(r, minDuration - elapsed));
      }

      updateAssessment({ recommendations: data.topRecommendations || [] });
      setFetched(true);
    } catch {
      setError(
        lang === "mr"
          ? "पीक शिफारस मिळवता आली नाही. कृपया पुन्हा प्रयत्न करा."
          : lang === "hi"
          ? "फसल सिफारिश प्राप्त नहीं हो सकी। कृपया पुनः प्रयास करें।"
          : "Could not retrieve crop recommendations. Please retry."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const selected = assessment.selectedCrop;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">{t.cropsTitle}</h2>
          <p className="mt-1 text-xs text-[var(--color-text-dim)]">
            {lang === "mr"
              ? "स्थानिक हवामान आणि मातीच्या प्रकारानुसार मोजलेल्या Top 5 अनुकूल पीक शिफारसी."
              : lang === "hi"
              ? "स्थानीय मौसम और मिट्टी के प्रकार के अनुसार शीर्ष 5 अनुकूल फसल सिफारिशें।"
              : "Top 5 crop recommendations scientifically ranked for your field conditions."}
          </p>
        </div>

        {!analyzing && (
          <button
            onClick={fetchRecommendations}
            disabled={analyzing}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition"
          >
            <RefreshCw size={13} className={analyzing ? "animate-spin text-emerald-700" : ""} />
            <span>{lang === "mr" ? "पुन्हा मोजा" : lang === "hi" ? "पुनः गणना करें" : "Re-evaluate"}</span>
          </button>
        )}
      </div>

      {/* AI Analysis Animation (5-6s duration connected to real API) */}
      {analyzing && <CropAiAnalysis language={lang} />}

      {error && !analyzing && (
        <div className="rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-4 text-xs text-red-700 dark:text-red-300">
          <p className="font-bold">{error}</p>
          <button onClick={fetchRecommendations} className="mt-2 text-xs font-extrabold underline text-emerald-700">
            {lang === "mr" ? "पुन्हा प्रयत्न करा" : lang === "hi" ? "पुनः प्रयास करें" : "Retry"}
          </button>
        </div>
      )}

      {/* Simplified Top 5 Crop Recommendation Cards */}
      {!analyzing && assessment.recommendations.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {assessment.recommendations.slice(0, 5).map((crop) => {
            const isSelected = selected?.cropKey === crop.cropKey;
            const cropName = lang === "mr" ? crop.cropMr : lang === "hi" ? crop.cropHi : crop.cropEn;
            const isSoilCompatible = crop.isSoilCompatible ?? (crop.soilCompatibilityStatus === "Soil Compatible");

            return (
              <div
                key={crop.cropKey}
                className={`flex flex-col justify-between rounded-3xl border-2 p-5 sm:p-6 transition-all ${
                  isSelected
                    ? "border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/25 shadow-lg ring-2 ring-emerald-600/30"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-emerald-600/50 shadow-sm"
                }`}
              >
                <div>
                  {/* Top Bar: Rank & Soil Compatibility Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
                    <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-black text-white tracking-wide">
                      {lang === "mr" ? `रँक ${crop.rank}` : lang === "hi" ? `रैंक ${crop.rank}` : `Rank ${crop.rank}`}
                    </span>

                    {/* Soil Compatibility Status Badge */}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 ${
                        isSoilCompatible
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800"
                      }`}
                    >
                      <CheckCircle2
                        size={13}
                        className={isSoilCompatible ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}
                      />
                      <span>
                        {isSoilCompatible
                          ? (lang === "mr" ? "माती सुसंगत" : lang === "hi" ? "मिट्टी अनुकूल" : "Soil Compatible")
                          : (lang === "mr" ? "सुसंगतता निश्चित नाही" : lang === "hi" ? "अनुकूलता सुनिश्चित नहीं" : "Compatibility Not Confirmed")}
                      </span>
                    </span>
                  </div>

                  {/* Crop Icon + Localized Crop Name */}
                  <div className="flex items-center gap-4 py-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shadow-inner">
                      <Sprout size={28} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[var(--color-text)]">
                        {cropName}
                      </h3>
                      <p className="text-xs font-semibold text-[var(--color-text-dim)]">
                        {crop.cropEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Crop Selection Button */}
                <div className="pt-3 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => updateAssessment({ selectedCrop: crop })}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-xs font-extrabold transition active:scale-[0.99] ${
                      isSelected
                        ? "bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500/20"
                        : "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:border-emerald-600 hover:text-emerald-700"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>{lang === "mr" ? "हे पीक निवडले आहे" : lang === "hi" ? "यह फसल चुनी गई है" : "Crop Selected"}</span>
                      </>
                    ) : (
                      <span>{lang === "mr" ? "हे पीक निवडा" : lang === "hi" ? "यह फसल चुनें" : "Select This Crop"}</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!analyzing && (
        <div className="pt-2">
          <WizardButton disabled={!selected} onClick={onNext} label={t.continueBtn} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 7 — Crop Guidance & Text-to-Speech (TTS)
// ═══════════════════════════════════════════════════════════
function GuidanceStep({ language: lang, onNext }: { language: Language; onNext: () => void }) {
  const { assessment, t } = useFarmer();
  const crop = assessment.selectedCrop;
  const guidance = crop ? CROP_GUIDANCE[crop.cropKey] : null;
  const [speaking, setSpeaking] = useState(false);

  const cropName = crop ? (lang === "mr" ? crop.cropMr : lang === "hi" ? crop.cropHi : crop.cropEn) : "";

  // Full spoken speech string
  const fullText = guidance
    ? [
        `${cropName}.`,
        guidance.whySuitable[lang],
        guidance.waterManagement[lang],
        guidance.fertilizerTiming[lang],
        guidance.growthStageCare[lang],
        guidance.weatherPrecautions[lang],
        guidance.nextSteps[lang],
      ].join(" ")
    : crop
    ? getFallbackGuidance(crop.cropEn, lang)
    : "";

  const langCodes: Record<Language, string> = { mr: "mr-IN", hi: "hi-IN", en: "en-IN" };

  const speak = () => {
    if (!window.speechSynthesis || !fullText) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(fullText);
    u.lang = langCodes[lang];
    u.rate = 0.85;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const stopSpeech = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const sections = guidance
    ? [
        {
          title: lang === "mr" ? "हे पीक का निवडावे?" : lang === "hi" ? "यह फसल क्यों चुनें?" : "Why This Crop?",
          text: guidance.whySuitable[lang],
          icon: Sprout,
        },
        {
          title: lang === "mr" ? "पाणी व्यवस्थापन व सिंचन" : lang === "hi" ? "जल प्रबंधन व सिंचाई" : "Water Management",
          text: guidance.waterManagement[lang],
          icon: Droplets,
        },
        {
          title: lang === "mr" ? "खत वेळापत्रक व पोषण" : lang === "hi" ? "उर्वरक समय सारणी" : "Fertilizer Schedule",
          text: guidance.fertilizerTiming[lang],
          icon: Layers,
        },
        {
          title: lang === "mr" ? "वाढीचे महत्त्वाचे टप्पे" : lang === "hi" ? "महत्वपूर्ण विकास चरण" : "Growth Stages",
          text: guidance.growthStageCare[lang],
          icon: Calendar,
        },
        {
          title: lang === "mr" ? "हवामान विषयक दक्षता" : lang === "hi" ? "मौसम संबंधी सावधानी" : "Weather Precautions",
          text: guidance.weatherPrecautions[lang],
          icon: CloudSun,
        },
        {
          title: lang === "mr" ? "पुढील पाऊल व कृषी कृती" : lang === "hi" ? "अगला कदम" : "Next Agronomic Steps",
          text: guidance.nextSteps[lang],
          icon: CheckCircle2,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[var(--color-border)] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md">
            <Sprout size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--color-text)] sm:text-2xl">{cropName}</h2>
            <p className="text-xs text-[var(--color-text-dim)]">{t.guidanceTitle} ({crop?.cropEn})</p>
          </div>
        </div>

        {/* Text to Speech Button */}
        <button
          type="button"
          onClick={speaking ? stopSpeech : speak}
          className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs font-extrabold shadow-md transition active:scale-[0.98] ${
            speaking
              ? "bg-red-600 text-white hover:bg-red-500 animate-pulse"
              : "bg-emerald-700 text-white hover:bg-emerald-600"
          }`}
        >
          {speaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span>
            {speaking
              ? (lang === "mr" ? "मार्गदर्शन थांबवा" : lang === "hi" ? "सलाह रोकें" : "Stop Audio")
              : t.listenBtn}
          </span>
        </button>
      </div>

      {/* Structured Guidance Cards (2-column Desktop Grid) */}
      {guidance ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Icon size={16} />
                  </div>
                  <h3 className="text-xs font-extrabold text-[var(--color-text)] uppercase tracking-wider">{s.title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-[var(--color-text-muted)] font-medium">
                  {s.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {fullText}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-xs text-[var(--color-text-dim)] flex items-start gap-2">
        <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
        <p>
          {lang === "mr"
            ? "हे मार्गदर्शन कृषी विद्यापीठाच्या पॅकेज ऑफ प्रॅक्टिसेसवर आधारित आहे. शेतातील विशेष परिस्थितीसाठी स्थानिक कृषी सहाय्यकांचा सल्ला घ्यावा."
            : lang === "hi"
            ? "यह मार्गदर्शन कृषि विश्वविद्यालय के पैकेज ऑफ प्रैक्टिसेज पर आधारित है। विशेष स्थिति में स्थानीय कृषि अधिकारी से सलाह लें।"
            : "This advisory synthesizes agricultural university packages of practices with your local weather conditions."}
        </p>
      </div>

      <div className="pt-2">
        <WizardButton
          disabled={false}
          onClick={() => {
            if (speaking) stopSpeech();
            onNext();
          }}
          label={t.continueBtn}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 8 — Estimated Insurance Premium (Deterministic Pricing Engine)
// ═══════════════════════════════════════════════════════════
type PremiumProps = {
  language: Language;
  saving: boolean;
  saveResult: { success: boolean; id?: string; error?: string } | null;
  onSave: () => void;
  onExit: () => void;
};

function PremiumStep({ language: lang, saving, saveResult, onSave, onExit }: PremiumProps) {
  const { assessment, updateAssessment, t } = useFarmer();
  const crop = assessment.selectedCrop;
  const soil = assessment.soilInputs;

  // Compute deterministic premium from existing pricingConfig.ts
  useEffect(() => {
    if (!crop || assessment.premiumINR !== null) return;
    const wx = assessment.weather;
    const hist = wx?.historical;

    // Environmental risk calculation from genuine weather observations
    const tempFactor = wx ? Math.max(0, (wx.temperatureC - 20) / 25) : 0.4;
    const dryRunDays = hist?.maxConsecutiveDryDays ?? 40;
    const dryFactor = Math.min(1, dryRunDays / 120);
    const riskScore = Math.round(Math.min(85, Math.max(15, (tempFactor * 0.4 + dryFactor * 0.6) * 70)));

    const details = calculateAgriSurgePremium({
      areaAcres: soil.areaAcres,
      crop: crop.cropKey.toUpperCase(),
      riskScore,
      irrigationType: soil.irrigationType,
      soilType: soil.soilType,
    });

    updateAssessment({
      premiumINR: details.recommendedPremium,
      premiumDetails: details as unknown as Record<string, unknown>,
    });
  }, []);

  const premium = assessment.premiumINR;
  const details = assessment.premiumDetails as {
    areaHectares?: number;
    baseRatePerHa?: number;
    baseExposure?: number;
    riskLevel?: string;
    riskMultiplier?: number;
    irrigationFactor?: number;
    soilFactor?: number;
    recommendedPremium?: number;
  } | null;

  const cropName = crop ? (lang === "mr" ? crop.cropMr : lang === "hi" ? crop.cropHi : crop.cropEn) : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">{t.premiumTitle}</h2>
        <p className="mt-1 text-xs text-[var(--color-text-dim)]">
          {lang === "mr"
            ? "क्षेत्रफळ, पीक दर आणि पर्यावरण जोखीम घटकांनुसार संगणित केलेला पारदर्शक वार्षिक प्रीमियम अंदाज."
            : lang === "hi"
            ? "क्षेत्रफल, फसल दर और पर्यावरण जोखिम के अनुसार गणना किया गया पारदर्शी वार्षिक प्रीमियम अनुमान।"
            : "Deterministic annual premium calculation derived from acreage, base rate, and environmental factors."}
        </p>
      </div>

      {premium !== null && details ? (
        <div className="flex flex-col gap-6">
          {/* Main Premium Card (Gradient Forest Green) */}
          <div className="rounded-3xl border border-emerald-600/30 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-8 text-white shadow-xl text-center">
            <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-100">
              {lang === "mr" ? "अंदाजित वार्षिक विमा प्रीमियम" : lang === "hi" ? "अनुमानित वार्षिक बीमा प्रीमियम" : "Estimated Annual Premium"}
            </span>
            <p className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
              ₹{premium.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-100/90">
              {cropName} · {soil.areaAcres} {lang === "mr" ? "एकर क्षेत्रफळ" : lang === "hi" ? "एकड़ क्षेत्रफल" : "Acres Area"}
            </p>
          </div>

          {/* Breakdown Grid (Desktop: 2 Columns) */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Box 1: Farm & Crop Parameters */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-dim)] mb-3 flex items-center gap-1.5">
                <FileCheck size={14} className="text-emerald-700" />
                <span>{lang === "mr" ? "शेत व पीक घटक" : lang === "hi" ? "खेत व फसल विवरण" : "Farm & Crop Basis"}</span>
              </h3>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-dim)]">{lang === "mr" ? "निवडलेले पीक" : lang === "hi" ? "चुनी फसल" : "Crop"}</span>
                  <span className="font-bold text-[var(--color-text)]">{cropName} ({crop?.cropEn})</span>
                </div>
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-dim)]">{lang === "mr" ? "शेत क्षेत्र (एकर / हेक्टर)" : lang === "hi" ? "क्षेत्रफल" : "Farm Area"}</span>
                  <span className="font-bold text-[var(--color-text)]">{soil.areaAcres} acres ({details?.areaHectares?.toFixed(2)} ha)</span>
                </div>
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-dim)]">{lang === "mr" ? "आधार दर प्रति हेक्टर" : lang === "hi" ? "आधार दर प्रति हेक्टर" : "Base Rate"}</span>
                  <span className="font-bold text-[var(--color-text)]">₹{details?.baseRatePerHa?.toLocaleString("en-IN")} / ha</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-[var(--color-text-dim)]">{lang === "mr" ? "मूळ एक्सपोजर" : lang === "hi" ? "मूल एक्सपोजर" : "Base Exposure"}</span>
                  <span className="font-bold text-[var(--color-text)]">₹{details?.baseExposure?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Adjustments & Risk Factors */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-dim)] mb-3 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>{lang === "mr" ? "जोखीम व तांत्रिक गुणक" : lang === "hi" ? "जोखिम व गुणक विवरण" : "Actuarial Multipliers"}</span>
              </h3>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-dim)]">{lang === "mr" ? "जोखीम स्तर (Risk Tier)" : lang === "hi" ? "जोखिम स्तर" : "Risk Level"}</span>
                  <span className="font-bold text-[var(--color-text)]">{details?.riskLevel || "MODERATE"}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-dim)]">{lang === "mr" ? "जोखीम गुणक" : lang === "hi" ? "जोखिम गुणक" : "Risk Multiplier"}</span>
                  <span className="font-bold text-[var(--color-text)]">× {details?.riskMultiplier}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-dim)]">{lang === "mr" ? "सिंचन प्रकार समायोजन" : lang === "hi" ? "सिंचाई समायोजन" : "Irrigation Factor"}</span>
                  <span className="font-bold text-[var(--color-text)]">{soil.irrigationType} (× {details?.irrigationFactor ?? 1.0})</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-[var(--color-text-dim)]">{lang === "mr" ? "माती प्रकार समायोजन" : lang === "hi" ? "मिट्टी समायोजन" : "Soil Factor"}</span>
                  <span className="font-bold text-[var(--color-text)]">{soil.soilType} (× {details?.soilFactor ?? 1.0})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Disclaimer Note */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-xs text-[var(--color-text-dim)] flex items-start gap-2">
            <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <p>
              {t.premiumDisclaimer}{" "}
              {lang === "mr"
                ? "अधिकृत विमा पॉलिसी व सबसिडीसाठी नजीकच्या विमा कंपनी, CSC केंद्र किंवा PMFBY पोर्टलशी संपर्क साधावा."
                : lang === "hi"
                ? "आधिकारिक बीमा पॉलिसी व सब्सिडी हेतु नजदीकी बीमा कंपनी या PMFBY पोर्टल से संपर्क करें।"
                : "For binding quotes and PMFBY subsidies, consult your authorized crop insurance partner."}
            </p>
          </div>

          {/* Save & Exit Actions */}
          <div className="flex flex-col gap-3 pt-2">
            {saveResult ? (
              <div className="flex flex-col gap-3">
                <div
                  className={`rounded-2xl border p-4 text-xs font-bold ${
                    saveResult.success
                      ? "border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                  }`}
                >
                  {saveResult.success ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>
                        {lang === "mr"
                          ? `मूल्यांकन डेटाबेसमध्ये यशस्वीरित्या जतन झाले! ओळख क्र: ${saveResult.id}`
                          : lang === "hi"
                          ? `आकलन डेटाबेस में सफलतापूर्वक सहेजा गया! संदर्भ ID: ${saveResult.id}`
                          : `Assessment successfully saved to database! ID: ${saveResult.id}`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{lang === "mr" ? "जतन करताना त्रुटी आली." : lang === "hi" ? "सहेजते समय त्रुटि ఐ." : "Error saving assessment."}</span>
                      </div>
                      {saveResult.error && (
                        <p className="text-[11px] font-medium opacity-90">{saveResult.error}</p>
                      )}
                    </div>
                  )}
                </div>

                {!saveResult.success && (
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={14} />}
                    <span>{lang === "mr" ? "पुन्हा जतन करा" : lang === "hi" ? "पुनः सहेजें" : "Retry Saving Assessment"}</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !premium}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-8 py-4 text-sm font-extrabold text-white shadow-xl hover:bg-emerald-600 disabled:opacity-60 transition active:scale-[0.99]"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                <span>{t.saveAssessmentBtn}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExit}
              className="text-center text-xs font-bold text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition py-2"
            >
              {lang === "mr" ? "← डॅशबोर्डवर परत जा" : lang === "hi" ? "← डैशबोर्ड पर वापस जाएं" : "← Back to Farmer Dashboard"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-emerald-700" />
        </div>
      )}
    </div>
  );
}

// ── Shared Helpers ───────────────────────────────────────────────────────────
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-[var(--color-text)]">{label}</label>
      {children}
    </div>
  );
}

function WizardButton({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-8 py-4 text-sm font-extrabold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-40 active:scale-[0.99]"
    >
      <span>{label}</span>
      <ArrowRight size={18} />
    </button>
  );
}
