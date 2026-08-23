"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  Droplets,
  CloudRain,
  FlaskConical,
  Sprout,
  Layers,
  ChevronRight,
} from "lucide-react";
import { CropSuitabilityResult, ParameterAnalysis, analyseCropSuitability } from "@/lib/crop/cropSuitabilityAnalysis";
import { SensorData } from "./SensorSoilDataStep";
import { FarmDetails } from "./FarmDetailsStep";

// ─── Colour system ───────────────────────────────────────────────────
const STATUS_COLORS = {
  optimal:  { bg: "bg-emerald-500/15", text: "text-emerald-400",  bar: "bg-emerald-500",  dot: "bg-emerald-400"  },
  moderate: { bg: "bg-sky-500/10",     text: "text-sky-400",      bar: "bg-sky-400",      dot: "bg-sky-400"      },
  caution:  { bg: "bg-amber-500/10",   text: "text-amber-400",    bar: "bg-amber-400",    dot: "bg-amber-400"    },
  risk:     { bg: "bg-red-500/10",     text: "text-red-400",      bar: "bg-red-500",      dot: "bg-red-400"      },
};

const TIER_STYLES = {
  Excellent:  { gradient: "from-emerald-600/20 to-emerald-500/5",  border: "border-emerald-500/30", text: "text-emerald-400",  ring: "ring-emerald-500/40"  },
  Good:       { gradient: "from-green-600/20 to-green-500/5",      border: "border-green-500/30",   text: "text-green-400",    ring: "ring-green-500/40"    },
  Moderate:   { gradient: "from-amber-600/20 to-amber-500/5",      border: "border-amber-500/30",   text: "text-amber-400",    ring: "ring-amber-500/40"    },
  "High Risk":{ gradient: "from-red-700/20 to-red-500/5",          border: "border-red-500/30",     text: "text-red-400",      ring: "ring-red-500/40"      },
};

const PARAM_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  temperature: Thermometer,
  humidity:    Droplets,
  rainfall:    CloudRain,
  ph:          FlaskConical,
  nitrogen:    Sprout,
  phosphorus:  Layers,
  potassium:   Layers,
};

// ─── Score Ring ───────────────────────────────────────────────────────
function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const style = TIER_STYLES[tier as keyof typeof TIER_STYLES] || TIER_STYLES.Moderate;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  useEffect(() => {
    const duration = 900;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className={style.text}
          style={{ transition: "stroke-dasharray 0.05s linear" }}
        />
      </svg>
      <div className="text-center">
        <span className={`text-[22px] font-bold tabular-nums ${style.text}`}>{animatedScore}</span>
        <span className="block text-[9px] text-white/40 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

// ─── Parameter Range Bar ──────────────────────────────────────────────
function ParameterBar({ param }: { param: ParameterAnalysis }) {
  const [animated, setAnimated] = useState(false);
  const colors = STATUS_COLORS[param.status];
  const Icon = PARAM_ICONS[param.parameter] || Thermometer;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`rounded-[8px] border border-white/5 bg-[var(--color-surface)] p-3 transition-all duration-200 hover:border-white/10 ${colors.bg}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className={`shrink-0 ${colors.text}`} />
          <span className="text-[11.5px] font-medium text-white/70">{param.label}</span>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 ${colors.bg} ${colors.text}`}>
          {param.statusLabel}
        </span>
      </div>

      {/* Range track */}
      <div className="relative h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        {/* Optimal zone highlight */}
        <div
          className="absolute top-0 h-full rounded-full bg-white/10"
          style={{
            left: `${param.optLowPct}%`,
            width: `${param.optHighPct - param.optLowPct}%`,
          }}
        />
        {/* Indicator needle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ring-2 ring-[var(--color-surface)] ${colors.dot} transition-all duration-700`}
          style={{
            left: `calc(${animated ? param.normalizedPosition : 0}% - 6px)`,
          }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span className={`text-[11px] font-semibold tabular-nums ${colors.text}`}>
          {param.parameter === "ph" ? param.actualValue.toFixed(1) : param.actualValue.toFixed(param.parameter === "rainfall" ? 0 : 1)}{param.unit}
        </span>
        <span className="text-[10px] text-white/35">Preferred: {param.preferredRange}</span>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────
export function CropSuitabilityPanel({
  sensorData,
  selectedCrop,
  farmDetails,
}: {
  sensorData: SensorData;
  selectedCrop: string;
  farmDetails?: FarmDetails;
}) {
  const [result, setResult] = useState<CropSuitabilityResult | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      const analysis = analyseCropSuitability(sensorData, selectedCrop, farmDetails);
      setResult(analysis);
      setVisible(true);
    }, 120);
    return () => clearTimeout(t);
  }, [sensorData, selectedCrop, farmDetails?.soilType, farmDetails?.irrigationType]);

  if (!selectedCrop || !result) return null;

  const tierStyle = TIER_STYLES[result.tier];

  return (
    <div
      className="flex flex-col gap-4 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      {/* ── Overall Suitability Header ───────────────────────────── */}
      <div className={`rounded-[10px] border ${tierStyle.border} bg-gradient-to-br ${tierStyle.gradient} p-4`}>
        <div className="flex items-center gap-4">
          <ScoreRing score={result.overallScore} tier={result.tier} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[20px]">{result.cropEmoji}</span>
              <h3 className="text-[16px] font-bold text-white leading-tight">{result.cropName}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-white/8 ${tierStyle.text}`}>
                {result.tier}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-white/55 leading-relaxed max-w-lg">{result.summary}</p>

            {/* Soil & Irrigation chips */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {farmDetails?.soilType && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                  result.soilCompatibility === "Compatible"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : result.soilCompatibility === "Moderate"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-red-500/10 text-red-400"
                }`}>
                  <Layers size={10} />
                  Soil: {result.soilCompatibility}
                </span>
              )}
              {farmDetails?.irrigationType && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                  result.irrigationCompatibility === "Compatible"
                    ? "bg-sky-500/10 text-sky-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  <Droplets size={10} />
                  Irrigation: {result.irrigationCompatibility}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Environmental Compatibility Grid ─────────────────────── */}
      <div>
        <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-white/35">
          Environmental Compatibility
        </h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {result.parameters.map((p) => (
            <ParameterBar key={p.parameter} param={p} />
          ))}
        </div>
      </div>

      {/* ── Conditions Overview ──────────────────────────────────── */}
      {(result.positiveConditions.length > 0 || result.riskFactors.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Positive Conditions */}
          {result.positiveConditions.length > 0 && (
            <div className="rounded-[8px] border border-emerald-500/15 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">Favourable Conditions</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {result.positiveConditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11.5px] text-white/60">
                    <ChevronRight size={11} className="mt-0.5 shrink-0 text-emerald-500/60" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Factors */}
          {result.riskFactors.length > 0 && (
            <div className="rounded-[8px] border border-amber-500/15 bg-amber-500/5 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={13} className="text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">Factors to Watch</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {result.riskFactors.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11.5px] text-white/60">
                    <ChevronRight size={11} className="mt-0.5 shrink-0 text-amber-500/60" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
