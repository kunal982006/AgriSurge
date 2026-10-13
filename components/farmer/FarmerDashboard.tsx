"use client";

import { useFarmer } from "./FarmerContext";
import {
  Leaf,
  Sprout,
  MapPin,
  ClipboardList,
  ArrowRight,
  LogOut,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CloudSun,
  Droplets,
  Layers,
  Sparkles,
  History,
  RotateCcw,
  AlertCircle,
  Bot,
  MessageSquare
} from "lucide-react";
import { Language } from "@/lib/farmer/types";

const LANG_OPTIONS: { code: Language; native: string }[] = [
  { code: "mr", native: "मराठी" },
  { code: "hi", native: "हिंदी" },
  { code: "en", native: "English" },
];

import { useState, useEffect } from "react";

type Props = {
  onStartAssessment: () => void;
  onViewHistory: () => void;
  onViewDetail: (id: number | string) => void;
  onOpenChat?: () => void;
};

export function FarmerDashboard({ onStartAssessment, onViewHistory, onViewDetail, onOpenChat }: Props) {
  const { farmer, logout, language, setLanguage, assessment, resetAssessment } = useFarmer();
  const [savedAssessments, setSavedAssessments] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [savedError, setSavedError] = useState<string | null>(null);

  const fetchSaved = async () => {
    if (!farmer?.id) return;
    setLoadingSaved(true);
    setSavedError(null);
    try {
      const res = await fetch(`/api/farmer/assessment?farmerId=${farmer.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load saved records.");
      }
      setSavedAssessments(data.assessments || []);
    } catch (err) {
      setSavedError(err instanceof Error ? err.message : "Error fetching dashboard data.");
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [farmer?.id]);

  if (!farmer) return null;

  const latestSaved = savedAssessments.length > 0 ? savedAssessments[0] : null;

  const hasLocation = !!(latestSaved ? latestSaved.latitude : assessment.location);
  const hasPhotos = !!(latestSaved ? (latestSaved.farmImageUrl || true) : (assessment.photos.farmImageFile || assessment.photos.soilImageFile || assessment.photos.farmImageUrl));
  const hasWeather = !!(latestSaved ? latestSaved.weatherData : assessment.weather);
  const hasCrop = !!(latestSaved ? latestSaved.selectedCrop : assessment.selectedCrop);
  const hasPremium = !!(latestSaved ? latestSaved.premiumEstimate : assessment.premiumINR);

  const greeting = {
    mr: `नमस्ते, ${farmer.name}!`,
    hi: `नमस्ते, ${farmer.name}!`,
    en: `Welcome, ${farmer.name}!`,
  }[language];

  const subGreeting = {
    mr: "आपल्या शेतासाठी अचूक हवामान, AI पीक शिफारसी आणि विमा प्रीमियम अंदाज.",
    hi: "आपके खेत के लिए सटीक मौसम, AI फसल सिफारिशें और बीमा प्रीमियम अनुमान।",
    en: "Precision environmental intelligence, AI crop recommendations, and insurance estimates.",
  }[language];

  const locationLabel = farmer.village
    ? `${farmer.village}${farmer.taluka ? ", " + farmer.taluka : ""}${farmer.district ? ", " + farmer.district : ""}`
    : farmer.district || "महाराष्ट्र / Maharashtra";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md">
              <Leaf size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-[var(--color-text)]">
                AgriSurge
              </span>
              <span className="ml-2 hidden text-xs font-semibold text-emerald-700 dark:text-emerald-400 sm:inline-block">
                शेतकरी पोर्टल / Farmer Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1">
              <Globe size={14} className="ml-1 text-[var(--color-text-dim)]" />
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    language === l.code
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {l.native}
                </button>
              ))}
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-dim)] transition hover:border-red-300 hover:text-red-600"
            >
              <LogOut size={14} />
              <span className="hidden md:inline">
                {language === "mr" ? "बाहेर पडा" : language === "hi" ? "बाहर निकलें" : "Logout"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container — Desktop Wide 7xl Multi-Column Layout */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          
          {/* LEFT COLUMN: Farmer Profile, Quick Stats, Navigation (Desktop: 4 cols) */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            {/* Greeting & Farmer Profile Card */}
            <div className="rounded-3xl border border-emerald-600/30 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 text-white shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-100">
                    {language === "mr" ? "शेतकरी प्रोफाईल" : language === "hi" ? "किसान प्रोफाइल" : "Farmer Profile"}
                  </span>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {greeting}
                  </h1>
                  <p className="mt-1 text-xs font-medium text-emerald-100/90 leading-relaxed">
                    {subGreeting}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner">
                  <Sprout size={26} strokeWidth={2.2} />
                </div>
              </div>

              {locationLabel && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/20 px-3.5 py-2 text-xs font-semibold text-emerald-100 backdrop-blur-xs">
                  <MapPin size={14} className="shrink-0 text-emerald-300" />
                  <span className="truncate">{locationLabel}</span>
                </div>
              )}

              {farmer.phone && (
                <p className="mt-3 text-[11px] font-medium text-emerald-200/80">
                  {language === "mr" ? "मोबाईल:" : language === "hi" ? "मोबाइल:" : "Phone:"} +91 {farmer.phone}
                </p>
              )}
            </div>

            {/* Farm Assessment Progress Tracker Card */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <h2 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-emerald-700" />
                <span>
                  {language === "mr" ? "मूल्यांकन स्थिती" : language === "hi" ? "मूल्यांकन स्थिति" : "Assessment Status"}
                </span>
              </h2>

              <div className="mt-4 flex flex-col gap-3">
                <StepStatusRow
                  label={language === "mr" ? "शेत स्थान (GPS)" : language === "hi" ? "खेत स्थान (GPS)" : "Farm GPS Location"}
                  done={hasLocation}
                  detail={hasLocation ? `${assessment.location?.latitude.toFixed(4)}°, ${assessment.location?.longitude.toFixed(4)}°` : null}
                  lang={language}
                />
                <StepStatusRow
                  label={language === "mr" ? "शेताचे व मातीचे फोटो" : language === "hi" ? "खेत और मिट्टी की फोटो" : "Farm & Soil Photos"}
                  done={hasPhotos}
                  detail={hasPhotos ? (language === "mr" ? "२ फोटो जोडले" : language === "hi" ? "2 फोटो संलग्न" : "2 Photos attached") : null}
                  lang={language}
                />
                <StepStatusRow
                  label={language === "mr" ? "हवामान व पाऊस विश्लेषण" : language === "hi" ? "मौसम और वर्षा विश्लेषण" : "Weather & Rain Analysis"}
                  done={hasWeather}
                  detail={hasWeather ? `${assessment.weather?.temperatureC.toFixed(1)}°C · ${assessment.weather?.humidityPct}%` : null}
                  lang={language}
                />
                <StepStatusRow
                  label={language === "mr" ? "AI पीक शिफारस" : language === "hi" ? "AI फसल सिफारिश" : "Crop Recommendation"}
                  done={hasCrop}
                  detail={hasCrop ? ((assessment.selectedCrop?.cropMr || assessment.selectedCrop?.cropEn) ?? null) : null}
                  lang={language}
                />
                <StepStatusRow
                  label={language === "mr" ? "विमा प्रीमियम अंदाज" : language === "hi" ? "बीमा प्रीमियम अनुमान" : "Insurance Estimate"}
                  done={hasPremium}
                  detail={hasPremium ? `₹${assessment.premiumINR?.toLocaleString("en-IN")}` : null}
                  lang={language}
                />
              </div>
            </div>

            {/* Assessment History Quick Button */}
            <button
              onClick={onViewHistory}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:border-emerald-600 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <History size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)]">
                    {language === "mr" ? "मागील मूल्यांकन इतिहास" : language === "hi" ? "पिछला मूल्यांकन इतिहास" : "Farm Assessment History"}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-dim)]">
                    {language === "mr" ? "जतन केलेले अहवाल पहा" : language === "hi" ? "सहेजे गए रिकॉर्ड देखें" : "View previously saved reports"}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[var(--color-text-dim)]" />
            </button>

            {/* Krishi Mitra AI Assistant Card (Google Gemini 3.8 Flash) */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[var(--color-surface)] to-[var(--color-surface)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-text)]">
                      AgriSurge AI Advisor
                    </h3>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles size={10} />
                      <span>Smart Agronomic Advisor</span>
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed mb-3">
                {language === "mr"
                  ? "पिकावरील कीड, खत व्यवस्थापन, सिंचन किंवा हवामानाविषयी आपल्या भाषेत थेट बोला."
                  : language === "hi"
                  ? "फसल कीट, खाद प्रबंधन, सिंचाई या मौसम के बारे में अपनी भाषा में सीधे पूछें।"
                  : "Instant 24/7 localized guidance on crop protection, nutrition, and weather resilience."}
              </p>
              <button
                onClick={onOpenChat}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-[0.98]"
              >
                <MessageSquare size={14} />
                <span>
                  {language === "mr" ? "AI मित्राशी बोला" : language === "hi" ? "AI मित्र से पूछें" : "Chat with AI Advisor"}
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Assessment Banner, Insights, Advisory (Desktop: 8 cols) */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            
            {/* Error Banner if loading failed */}
            {savedError && (
              <div className="rounded-3xl border border-red-500/30 bg-[var(--color-surface)] p-6 shadow-md flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text)]">
                      {language === "mr" ? "जतन केलेले मूल्यांकन लोड करताना त्रुटी आली" : language === "hi" ? "सहेजे गए रिकॉर्ड लोड करने में त्रुटि" : "Error Loading Saved Records"}
                    </h3>
                    <p className="text-xs text-[var(--color-text-dim)]">{savedError}</p>
                  </div>
                </div>
                <button
                  onClick={fetchSaved}
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition"
                >
                  {language === "mr" ? "पुन्हा प्रयत्न करा" : language === "hi" ? "पुनः प्रयास करें" : "Retry"}
                </button>
              </div>
            )}

            {/* Primary Action Hero Banner */}
            {latestSaved ? (
              // Persisted Assessment Card From Database
              <div className="rounded-3xl border border-emerald-500/30 bg-[var(--color-surface)] p-6 shadow-md sm:p-8">
                <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[var(--color-border)] pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md">
                      <Sprout size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {language === "mr" ? "डेटाबेसमध्ये जतन केलेले मूल्यांकन" : language === "hi" ? "डेटाबेस में सहेजा गया मूल्यांकन" : "Persisted Saved Record"}
                        </span>
                        <span className="font-mono text-xs text-[var(--color-text-dim)] font-bold">
                          {latestSaved.assessmentCode}
                        </span>
                      </div>
                      <h2 className="mt-1 text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">
                        {latestSaved.selectedCrop}
                      </h2>
                      <p className="text-xs text-[var(--color-text-dim)]">
                        {new Date(latestSaved.createdAt).toLocaleDateString(language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN", { dateStyle: "long" })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold text-[var(--color-text-dim)]">
                      {language === "mr" ? "जतन केलेला वार्षिक प्रीमियम" : language === "hi" ? "सहेजा गया वार्षिक प्रीमियम" : "Persisted Annual Premium"}
                    </p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 sm:text-3xl">
                      ₹{Number(latestSaved.premiumEstimate).toLocaleString("en-IN")}
                      <span className="text-xs font-normal text-[var(--color-text-dim)]"> / {language === "mr" ? "वर्ष" : language === "hi" ? "वर्ष" : "yr"}</span>
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
                    <p className="text-[11px] font-medium text-[var(--color-text-dim)]">
                      {language === "mr" ? "शेत क्षेत्र" : language === "hi" ? "खेत क्षेत्र" : "Farm Area"}
                    </p>
                    <p className="mt-1 text-base font-bold text-[var(--color-text)]">
                      {latestSaved.areaAcres} {language === "mr" ? "एकर" : language === "hi" ? "एकड़" : "Acres"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
                    <p className="text-[11px] font-medium text-[var(--color-text-dim)]">
                      {language === "mr" ? "सिंचन प्रकार" : language === "hi" ? "सिंचाई प्रकार" : "Irrigation"}
                    </p>
                    <p className="mt-1 text-base font-bold text-[var(--color-text)] truncate">
                      {latestSaved.irrigationType || "Rainfed"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
                    <p className="text-[11px] font-medium text-[var(--color-text-dim)]">
                      {language === "mr" ? "माती प्रकार" : language === "hi" ? "मिट्टी प्रकार" : "Soil Type"}
                    </p>
                    <p className="mt-1 text-base font-bold text-[var(--color-text)] truncate">
                      {latestSaved.soilType || "Black Soil"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
                    <p className="text-[11px] font-medium text-[var(--color-text-dim)]">
                      {language === "mr" ? "स्थान" : language === "hi" ? "स्थान" : "Location"}
                    </p>
                    <p className="mt-1 text-base font-bold text-emerald-700 dark:text-emerald-400 truncate">
                      {latestSaved.locationName || "Maharashtra"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-4">
                  <button
                    onClick={() => onViewDetail(latestSaved.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600 active:scale-[0.99]"
                  >
                    <span>{language === "mr" ? "या मूल्यांकनाचा संपूर्ण अहवाल पहा" : language === "hi" ? "इस मूल्यांकन की पूरी रिपोर्ट देखें" : "View Exact Assessment Report"}</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={onStartAssessment}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-xs font-bold text-[var(--color-text-muted)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
                  >
                    <RotateCcw size={14} />
                    <span>{language === "mr" ? "नवीन मूल्यांकन सुरू करा" : language === "hi" ? "नया मूल्यांकन शुरू करें" : "Start New Assessment"}</span>
                  </button>
                </div>
              </div>
            ) : hasCrop && hasPremium ? (
              // Completed In-Memory Assessment Card (before persistence)
              <div className="rounded-3xl border border-emerald-500/30 bg-[var(--color-surface)] p-6 shadow-md sm:p-8">
                <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[var(--color-border)] pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md">
                      <Sprout size={24} />
                    </div>
                    <div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {language === "mr" ? "सध्याचे मूल्यांकन" : language === "hi" ? "सक्रिय मूल्यांकन" : "Active Assessment"}
                      </span>
                      <h2 className="mt-1 text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">
                        {assessment.selectedCrop?.cropMr || assessment.selectedCrop?.cropEn} ({assessment.selectedCrop?.cropEn})
                      </h2>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold text-[var(--color-text-dim)]">
                      {language === "mr" ? "अंदाजित वार्षिक प्रीमियम" : language === "hi" ? "अनुमानित वार्षिक प्रीमियम" : "Estimated Annual Premium"}
                    </p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 sm:text-3xl">
                      ₹{assessment.premiumINR?.toLocaleString("en-IN")}
                      <span className="text-xs font-normal text-[var(--color-text-dim)]"> / {language === "mr" ? "वर्ष" : language === "hi" ? "वर्ष" : "yr"}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  <button
                    onClick={onStartAssessment}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600 active:scale-[0.99]"
                  >
                    <span>{language === "mr" ? "मूल्यांकन पूर्ण करा किंवा जतन करा" : language === "hi" ? "मूल्यांकन पूरा करें या सहेजें" : "Complete or Save Assessment"}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              // Start New Assessment Hero Banner
              <div className="rounded-3xl border border-emerald-600/30 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-8 text-white shadow-xl sm:p-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-emerald-100 backdrop-blur-xs">
                      <Sparkles size={14} />
                      <span>{language === "mr" ? "नवीन शेत विश्लेषण" : language === "hi" ? "नया फार्म विश्लेषण" : "New Farm Intelligence"}</span>
                    </span>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-4xl">
                      {language === "mr" ? "शेत मूल्यांकन सुरू करा" : language === "hi" ? "फार्म असेसमेंट शुरू करें" : "Start Farm Assessment"}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100 leading-relaxed sm:text-base">
                      {language === "mr"
                        ? "आपल्या शेताचे GPS स्थान, २ फोटो आणि शेत माहिती देऊन अचूक हवामान, AI पीक शिफारस आणि विमा प्रीमियम जाणून घ्या."
                        : language === "hi"
                        ? "अपने खेत का GPS स्थान, 2 फोटो और खेत की जानकारी देकर सटीक मौसम, AI फसल सिफारिश और बीमा प्रीमियम जानें।"
                        : "Provide your GPS coordinates, 2 farm photos, and basic soil/irrigation details to receive AI crop advice and insurance estimates."}
                    </p>
                  </div>
                  <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-xs">
                    <Sprout size={36} />
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={onStartAssessment}
                    className="flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-emerald-900 shadow-xl transition hover:bg-emerald-50 active:scale-[0.99]"
                  >
                    <span>{language === "mr" ? "आता मूल्यांकन सुरू करा" : language === "hi" ? "अभी असेसमेंट शुरू करें" : "Start Assessment Now"}</span>
                    <ArrowRight size={20} className="text-emerald-900" />
                  </button>
                </div>
              </div>
            )}

            {/* List of Previous Persisted Records if farmer has more than 1 */}
            {savedAssessments.length > 1 && (
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-dim)] flex items-center justify-between mb-4">
                  <span className="flex items-center gap-1.5">
                    <History size={15} className="text-emerald-700" />
                    <span>{language === "mr" ? "इतर जतन केलेले अहवाल" : language === "hi" ? "अन्य सहेजे गए रिकॉर्ड" : "Other Persisted Assessments"}</span>
                  </span>
                  <button
                    onClick={onViewHistory}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {language === "mr" ? "सर्व पहा →" : language === "hi" ? "सभी देखें →" : "View All →"}
                  </button>
                </h3>

                <div className="flex flex-col gap-3">
                  {savedAssessments.slice(1, 4).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onViewDetail(item.id)}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 transition hover:border-emerald-600 hover:shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Sprout size={18} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-[var(--color-text)] truncate">{item.selectedCrop}</p>
                          <p className="text-[11px] text-[var(--color-text-dim)]">
                            {new Date(item.createdAt).toLocaleDateString()} · {item.areaAcres} acres
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                          ₹{Number(item.premiumEstimate).toLocaleString("en-IN")}
                        </p>
                        <span className="text-[10px] text-[var(--color-text-dim)] font-medium">
                          {language === "mr" ? "तपशील पहा →" : language === "hi" ? "विवरण देखें →" : "View Details →"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agricultural Advisory & Intelligence Highlights (3-card Responsive Grid) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CloudSun size={20} />
                </div>
                <h3 className="mt-3 text-sm font-bold text-[var(--color-text)]">
                  {language === "mr" ? "थेट हवामान व IMD डेटा" : language === "hi" ? "लाइव मौसम और IMD डेटा" : "Live Weather & IMD Grid"}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-dim)] leading-relaxed">
                  {language === "mr"
                    ? "स्थानिक Open-Meteo आणि अधिकृत IMD ऐतिहासिक पावसाचे अचूक विश्लेषण."
                    : language === "hi"
                    ? "स्थानीय Open-Meteo और आधिकारिक IMD ऐतिहासिक वर्षा का सटीक विश्लेषण।"
                    : "Hyperlocal live observations and official IMD NetCDF historical grid records."}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Sprout size={20} />
                </div>
                <h3 className="mt-3 text-sm font-bold text-[var(--color-text)]">
                  {language === "mr" ? "Top 5 पीक शिफारसी" : language === "hi" ? "Top 5 फसल सिफारिशें" : "Top 5 Crop Advice"}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-dim)] leading-relaxed">
                  {language === "mr"
                    ? "तापमान, आर्द्रता, पाऊस आणि माती प्रकारावर आधारित प्रामाणिक वैज्ञानिक सल्ला."
                    : language === "hi"
                    ? "तापमान, आर्द्रता, वर्षा और मिट्टी प्रकार पर आधारित प्रमाणिक वैज्ञानिक सलाह।"
                    : "Scientifically validated suitability based on observed weather and soil types."}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="mt-3 text-sm font-bold text-[var(--color-text)]">
                  {language === "mr" ? "पारदर्शक विमा अंदाज" : language === "hi" ? "पारदर्शी बीमा अनुमान" : "Transparent Insurance"}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-dim)] leading-relaxed">
                  {language === "mr"
                    ? "क्षेत्रफळ व जोखीम गुणकानुसार पारदर्शक गणना; कोणताही काल्पनिक दर नाही."
                    : language === "hi"
                    ? "क्षेत्रफल और जोखिम गुणक के अनुसार पारदर्शी गणना; कोई काल्पनिक दर नहीं।"
                    : "Deterministic premium calculation based on acreage, crop type, and risk factors."}
                </p>
              </div>
            </div>

            {/* Important Farmer Tips / Advisory Note */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                  <Droplets size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                    {language === "mr" ? "शेतकरी सूचना व जलव्यवस्थापन" : language === "hi" ? "किसान सूचना और जल प्रबंधन" : "Farmer Advisory & Water Guidance"}
                  </h4>
                  <p className="mt-1 text-xs text-[var(--color-text-dim)] leading-relaxed">
                    {language === "mr"
                      ? "हवामानाचा अंदाज पाहूनच पेरणी व सिंचनाचे नियोजन करा. ठिबक व तुषार सिंचनाचा वापर केल्यास पाण्याची ४०% पर्यंत बचत होते आणि पिकाची रोगप्रतिकारशक्ती वाढते."
                      : language === "hi"
                      ? "मौसम पूर्वानुमान देखकर ही बुवाई और सिंचाई की योजना बनाएं। ड्रिप व स्प्रिंकलर सिंचाई से 40% तक पानी की बचत होती है।"
                      : "Plan sowing and irrigation by reviewing local weather forecasts. Drip and sprinkler systems save up to 40% water while improving crop resilience."}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

function StepStatusRow({
  label,
  done,
  detail,
  lang,
}: {
  label: string;
  done: boolean;
  detail: string | null;
  lang: Language;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${
        done
          ? "border-emerald-600/30 bg-emerald-50/60 dark:bg-emerald-950/20"
          : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <CheckCircle2
          size={16}
          className={done ? "text-emerald-700 dark:text-emerald-400 shrink-0" : "text-[var(--color-text-dim)] opacity-40 shrink-0"}
        />
        <div className="truncate">
          <p className={`text-xs font-bold truncate ${done ? "text-[var(--color-text)]" : "text-[var(--color-text-dim)]"}`}>
            {label}
          </p>
          {detail && (
            <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
              {detail}
            </p>
          )}
        </div>
      </div>

      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold shrink-0 ${
          done
            ? "bg-emerald-700 text-white"
            : "bg-[var(--color-border)] text-[var(--color-text-dim)]"
        }`}
      >
        {done
          ? (lang === "mr" ? "पूर्ण" : lang === "hi" ? "पूर्ण" : "Done")
          : (lang === "mr" ? "प्रलंबित" : lang === "hi" ? "लंबित" : "Pending")}
      </span>
    </div>
  );
}
