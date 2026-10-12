"use client";

import React, { useState, useEffect } from "react";
import { Language } from "@/lib/farmer/types";
import { Sprout, Cpu, Layers, CloudRain, CheckCircle2, ShieldCheck } from "lucide-react";

interface CropAiAnalysisProps {
  language: Language;
  onComplete?: () => void;
}

const STATUS_MESSAGES: Record<Language, string[]> = {
  mr: [
    "शेताच्या भौगोलिक स्थितीचे विश्लेषण करत आहे...",
    "मातीच्या प्रकाराची व सिंचनाची सुसंगतता तपासत आहे...",
    "स्थानिक हवामान आणि ऐतिहासिक पावसाच्या नोंदींचे पुनरावलोकन करत आहे...",
    "सर्वात योग्य Top 5 पिकांची शास्त्रीय क्रमवारी निश्चित करत आहे...",
  ],
  hi: [
    "खेत की भौगोलिक स्थिति का विश्लेषण किया जा रहा है...",
    "मिट्टी के प्रकार और सिंचाई की अनुकूलता जांची जा रही है...",
    "स्थानीय मौसम और ऐतिहासिक वर्षा के आंकड़ों की समीक्षा हो रही है...",
    "सर्वाधिक उपयुक्त शीर्ष 5 फसलों की वैज्ञानिक रैंकिंग तय की जा रही है...",
  ],
  en: [
    "Analysing farm conditions and field parameters...",
    "Evaluating soil compatibility and irrigation readiness...",
    "Reviewing rainfall patterns and climate data...",
    "Ranking suitable crops based on agronomic evidence...",
  ],
};

export function CropAiAnalysis({ language }: CropAiAnalysisProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(8);

  const messages = STATUS_MESSAGES[language] || STATUS_MESSAGES.en;

  useEffect(() => {
    // Progress increment timer (takes ~5.2s to reach ~96%)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const inc = Math.random() * 4 + 3;
        return Math.min(95, prev + inc);
      });
    }, 250);

    // Message rotation timer (~1.3s per stage)
    const messageInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % messages.length);
    }, 1300);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [messages.length]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950 via-slate-950 to-emerald-950 p-8 sm:p-12 text-white shadow-2xl">
      {/* Background Neural Grid Accent */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Center Animated Scanner Arena */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        
        {/* Visual Scanner Arena with dual rotating rings and scanning laser */}
        <div className="relative mb-8 flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center">
          
          {/* Subtle Outer Glow */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />

          {/* Outer Rotating Dashed Ring (Clockwise) */}
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-emerald-400/40 animate-[spin_10s_linear_infinite]" />

          {/* Inner Counter-Rotating Gradient Ring */}
          <div className="absolute inset-6 rounded-full border-2 border-t-emerald-300 border-r-emerald-500/20 border-b-emerald-600/60 border-l-transparent animate-[spin_6s_linear_infinite_reverse]" />

          {/* Center Glass Orb */}
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-emerald-900/60 border border-emerald-400/50 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.35)]">
            <Sprout size={40} className="text-emerald-300 animate-pulse" strokeWidth={2.2} />
          </div>

          {/* Orbiting Satellite Data Nodes */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border border-emerald-400/60 text-emerald-300 shadow-md">
            <Cpu size={14} />
          </div>
          <div className="absolute bottom-3 left-8 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border border-emerald-400/60 text-emerald-300 shadow-md">
            <Layers size={14} />
          </div>
          <div className="absolute bottom-3 right-8 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border border-emerald-400/60 text-emerald-300 shadow-md">
            <CloudRain size={14} />
          </div>

          {/* Laser Scanning Line moving vertically */}
          <div className="absolute inset-x-4 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-[bounce_2.4s_ease-in-out_infinite]" />
        </div>

        {/* AI Engine Title */}
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-emerald-300 backdrop-blur-xs mb-3">
          <ShieldCheck size={14} />
          <span>AgriSurge AI Crop Intelligence Engine</span>
        </div>

        {/* Rotating Active Status Text */}
        <div className="min-h-[48px] max-w-lg flex items-center justify-center px-4">
          <p className="text-base sm:text-lg font-bold text-emerald-50 transition-all duration-300 text-center drop-shadow-sm">
            {messages[stepIndex]}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-6 w-full max-w-md">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-1.5 px-1">
            <span>
              {language === "mr" ? "प्रगती" : language === "hi" ? "प्रगति" : "Analysis Progress"}
            </span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/40 border border-emerald-500/20 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 transition-all duration-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Technical Subtext */}
        <p className="mt-5 text-[11px] text-emerald-200/60 font-medium">
          {language === "mr"
            ? "मोजलेली हवामान निरीक्षणे, IMD ग्रिड व माती निकषांवर आधारित थेट मूल्यांकन चालू आहे."
            : language === "hi"
            ? "प्रेक्षित मौसम, IMD ग्रिड एवं मिट्टी मापदंडों पर आधारित निष्पक्ष मूल्यांकन सक्रिय है।"
            : "Running real-time agronomic evaluation against observed microclimate and soil classification."}
        </p>

      </div>
    </div>
  );
}
