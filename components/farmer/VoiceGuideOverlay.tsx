"use client";

import { useState, useEffect } from "react";
import { useVoiceGuide } from "./VoiceGuideProvider";
import { useFarmer } from "./FarmerContext";
import {
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  ChevronUp,
  ChevronDown,
  Headphones,
} from "lucide-react";

const STEP_FRIENDLY_NAMES: Record<string, { mr: string; hi: string; en: string }> = {
  auth_choose: { mr: "लॉगिन व नोंदणी", hi: "लॉगिन व पंजीकरण", en: "Login & Register" },
  auth_login: { mr: "शेतकरी लॉगिन", hi: "किसान लॉगिन", en: "Farmer Login" },
  auth_register: { mr: "नवीन नोंदणी", hi: "नया पंजीकरण", en: "New Registration" },
  dashboard: { mr: "मुख्य डॅशबोर्ड", hi: "मुख्य डैशबोर्ड", en: "Dashboard" },
  history: { mr: "मूल्यांकन इतिहास", hi: "मूल्यांकन इतिहास", en: "Assessment History" },
  detail: { mr: "शेत अहवाल तपशील", hi: "खेत रिपोर्ट विवरण", en: "Report Details" },
  details: { mr: "टप्पा १: माहिती", hi: "चरण १: जानकारी", en: "Step 1: Details" },
  location: { mr: "टप्पा २: GPS स्थान", hi: "चरण २: GPS स्थान", en: "Step 2: Location" },
  photos: { mr: "टप्पा ३: शेताचे फोटो", hi: "चरण ३: खेत फोटो", en: "Step 3: Photos" },
  weather: { mr: "टप्पा ४: हवामान", hi: "चरण ४: मौसम", en: "Step 4: Weather" },
  soil: { mr: "टप्पा ५: शेत व माती", hi: "चरण ५: खेत व मिट्टी", en: "Step 5: Soil" },
  crops: { mr: "टप्पा ६: पीक शिफारस", hi: "चरण ६: फसल सलाह", en: "Step 6: Crops" },
  guidance: { mr: "टप्पा ७: कृषी सल्ला", hi: "चरण ७: कृषि सलाह", en: "Step 7: Advisory" },
  premium: { mr: "टप्पा ८: विमा अंदाज", hi: "चरण ८: बीमा अनुमान", en: "Step 8: Insurance" },
};

/**
 * Floating Voice Guide Overlay — persistent bottom-left control panel.
 * Provides one-tap voice mode toggle, narrate-current-page, and a
 * "Help me" button that explains the active screen in the farmer's language.
 */
export function VoiceGuideOverlay({ currentStep }: { currentStep?: string }) {
  const { language } = useFarmer();
  const {
    voiceEnabled,
    setVoiceEnabled,
    activeStep,
    stopSpeaking,
    isSpeaking,
    narrateStep,
  } = useVoiceGuide();

  const [expanded, setExpanded] = useState(false);
  const [pulsing, setPulsing] = useState(true);

  // Determine current active step (either override prop or context activeStep)
  const effectiveStep = currentStep || activeStep || "dashboard";
  const stepFriendly = STEP_FRIENDLY_NAMES[effectiveStep]?.[language] || effectiveStep;

  // Stop pulsing after voice is enabled
  useEffect(() => {
    if (voiceEnabled) setPulsing(false);
  }, [voiceEnabled]);

  const labels = {
    mr: {
      voiceOn: "आवाज मार्गदर्शन चालू",
      voiceOff: "आवाज मार्गदर्शन बंद",
      helpMe: "या पानाबद्दल समजावून सांगा",
      listening: "ऐकत आहे...",
      speaking: "मार्गदर्शन सांगत आहे...",
      tapToEnable: "आवाज मार्गदर्शन सुरू करा",
      title: "आवाज सहाय्यक",
      desc: "हे बटण चालू केल्यास प्रत्येक पानावर काय करायचे ते तुम्हाला मराठीत समजावून सांगितले जाईल.",
      currentScreen: "सध्याचे पान",
    },
    hi: {
      voiceOn: "आवाज़ मार्गदर्शन चालू",
      voiceOff: "आवाज़ मार्गदर्शन बंद",
      helpMe: "इस पन्ने के बारे में बताएं",
      listening: "सुन रहा है...",
      speaking: "मार्गदर्शन बता रहा है...",
      tapToEnable: "आवाज़ मार्गदर्शन शुरू करें",
      title: "आवाज़ सहायक",
      desc: "यह चालू करने पर हर पन्ने पर क्या करना है वो हिंदी में बोलकर समझाया जाएगा।",
      currentScreen: "वर्तमान पन्ना",
    },
    en: {
      voiceOn: "Voice Guide ON",
      voiceOff: "Voice Guide OFF",
      helpMe: "Explain This Page",
      listening: "Listening...",
      speaking: "Explaining page...",
      tapToEnable: "Enable Voice Guide",
      title: "Voice Assistant",
      desc: "When enabled, every page and step will be automatically narrated aloud.",
      currentScreen: "Active Screen",
    },
  };

  const t = labels[language];

  const handleToggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
    }
  };

  const handleHelpMe = () => {
    narrateStep(effectiveStep, language);
  };

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2 sm:bottom-6 sm:left-6">
      {/* Expanded Control Box */}
      {expanded && (
        <div className="w-76 rounded-3xl border border-emerald-500/30 bg-[var(--color-surface)] p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Headphones size={16} className="text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs font-black text-[var(--color-text)] uppercase tracking-wider">
                {t.title}
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition"
            >
              <X size={14} />
            </button>
          </div>

          {/* Active Screen Tag */}
          <div className="mb-3 flex items-center justify-between rounded-xl bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-[11px]">
            <span className="text-[var(--color-text-dim)]">{t.currentScreen}:</span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
              {stepFriendly}
            </span>
          </div>

          <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed mb-3">
            {t.desc}
          </p>

          {/* Master Voice Toggle */}
          <button
            onClick={handleToggleVoice}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold transition active:scale-[0.97] ${
              voiceEnabled
                ? "bg-emerald-700 text-white shadow-md"
                : "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:border-emerald-600"
            }`}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{voiceEnabled ? t.voiceOn : t.voiceOff}</span>
          </button>

          {/* Help Me / Re-narrate button */}
          <button
            onClick={handleHelpMe}
            disabled={isSpeaking}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition disabled:opacity-50"
          >
            <HelpCircle size={15} />
            <span>{isSpeaking ? t.speaking : t.helpMe}</span>
          </button>

          {/* Animated voice activity bars */}
          {isSpeaking && (
            <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
              <div className="flex gap-1 items-center h-3">
                <span className="inline-block w-1 h-3 bg-emerald-600 rounded-full animate-bounce" />
                <span className="inline-block w-1 h-4 bg-emerald-500 rounded-full animate-bounce delay-100" />
                <span className="inline-block w-1 h-2 bg-emerald-600 rounded-full animate-bounce delay-200" />
                <span className="inline-block w-1 h-4 bg-emerald-500 rounded-full animate-bounce delay-100" />
              </div>
              <span>{t.speaking}</span>
            </div>
          )}
        </div>
      )}

      {/* Pill Trigger Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`group relative flex items-center gap-2 rounded-full px-4 py-3 text-xs font-extrabold shadow-2xl transition-all active:scale-95 ${
          voiceEnabled
            ? "bg-emerald-700 text-white ring-4 ring-emerald-500/30"
            : pulsing
            ? "bg-amber-500 text-white ring-4 ring-amber-400/40 animate-bounce"
            : "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-emerald-600"
        }`}
        aria-label="Voice Guide"
      >
        {voiceEnabled ? (
          <Volume2 size={18} className={isSpeaking ? "animate-pulse" : ""} />
        ) : (
          <Headphones size={18} />
        )}
        <span className="hidden sm:inline">
          {voiceEnabled ? t.voiceOn : t.tapToEnable}
        </span>
        {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  );
}
