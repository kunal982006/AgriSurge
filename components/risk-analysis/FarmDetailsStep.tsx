"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Check,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { SensorData } from "./SensorSoilDataStep";
import { inferCropCategory } from "@/lib/crop/cropProfiles";
import { CropSuitabilityPanel } from "./CropSuitabilityPanel";

// ─── Types ───────────────────────────────────────────────────────────
export type FarmDetails = {
  farmName: string;
  farmerName: string;
  crop: string;
  cropVariety: string;
  sowingDate: string;
  growthStage: string;
  irrigationType: string;
  soilType: string;
  cropCategory?: string;
  customCropVariety?: string;
};

export interface RecommendationItem {
  rank: number;
  crop: string;
  crop_raw: string;
  confidence: number;
  confidence_pct: string;
  agrisurgeStatus: "SUPPORTED_BY_AGRISURGE" | "RECOMMENDATION_ONLY";
}

interface CropItem {
  name: string;
  category: string;
}

// ─── Primitives ───────────────────────────────────────────────────────
const FIELD_CLASS =
  "w-full rounded-[7px] border border-white/8 bg-white/4 px-3 py-2 text-[12.5px] text-white/85 placeholder:text-white/25 focus:border-emerald-500/50 focus:bg-white/6 focus:outline-none transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</span>
      {children}
    </label>
  );
}

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-[7px] border px-3 py-2 text-[12.5px] text-left transition-all disabled:opacity-40 ${
          value
            ? "border-white/10 bg-white/5 text-white/85"
            : "border-white/8 bg-white/4 text-white/30"
        } focus:border-emerald-500/50 focus:outline-none`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-[8px] border border-white/10 bg-[#151b14] shadow-2xl">
          <div className="p-1.5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-[5px] border border-white/8 bg-white/5 px-2.5 py-1.5 text-[12px] text-white/80 placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40"
              autoFocus
            />
          </div>
          <div className="max-h-44 overflow-y-auto p-1">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setSearch("");
                    setOpen(false);
                  }}
                  className={`w-full text-left rounded-[5px] px-2.5 py-1.5 text-[12.5px] transition-colors ${
                    opt === value
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-white/70 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))
            ) : (
              <span className="block p-2 text-[11px] text-white/30">No options found</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recommendation Card ─────────────────────────────────────────────
function RecommendationCard({
  rec,
  isSelected,
  onClick,
  delay,
}: {
  rec: RecommendationItem;
  isSelected: boolean;
  onClick: () => void;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const rankMeta = [
    { label: "Best Match",   barWidth: "w-full",    color: "bg-emerald-500" },
    { label: "Good Match",   barWidth: "w-4/5",     color: "bg-sky-400" },
    { label: "Alternative",  barWidth: "w-3/5",     color: "bg-white/30" },
  ][rec.rank - 1] || { label: "Match", barWidth: "w-1/2", color: "bg-white/20" };

  const pct = Math.round((rec.confidence || 0) * 100);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 0.35s ease ${delay}ms, transform 0.35s ease ${delay}ms, box-shadow 0.2s, border-color 0.2s`,
      }}
      className={`relative flex flex-col rounded-[10px] border p-3.5 text-left transition-colors group ${
        isSelected
          ? "border-emerald-500/60 bg-emerald-500/8 shadow-[0_0_0_1px_rgba(52,211,153,0.15)]"
          : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
      }`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <span className="absolute right-2.5 top-2.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500">
          <Check size={10} className="text-[#0c1210]" />
        </span>
      )}

      <span className={`mb-1.5 text-[10px] font-medium uppercase tracking-wider ${isSelected ? "text-emerald-400" : "text-white/35"}`}>
        {rankMeta.label}
      </span>
      <h4 className={`text-[15px] font-bold leading-tight ${isSelected ? "text-white" : "text-white/80 group-hover:text-white"}`}>
        {rec.crop}
      </h4>

      {/* Confidence bar */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-white/35">
          <span>Suitability</span>
          <span className={`font-semibold tabular-nums ${isSelected ? "text-emerald-400" : "text-white/55"}`}>
            {pct > 0 ? `${pct}%` : "—"}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isSelected ? "bg-emerald-500" : rankMeta.color
            }`}
            style={{ width: pct > 0 ? `${pct}%` : rankMeta.barWidth }}
          />
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export function FarmDetailsStep({
  details,
  onChange,
  sensorData,
}: {
  details: FarmDetails;
  onChange: (d: FarmDetails) => void;
  sensorData?: SensorData;
}) {
  const [categories, setCategories] = useState<string[]>([]);
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [varieties, setVarieties] = useState<string[]>([]);
  const [loadingVarieties, setLoadingVarieties] = useState(false);

  // ML recommendations state
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loadingMl, setLoadingMl] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [mlWarnings, setMlWarnings] = useState<string[]>([]);

  // ── Fetch ML recommendations ──────────────────────────────────────
  useEffect(() => {
    if (!sensorData) return;
    setLoadingMl(true);
    setMlError(null);

    const payload = {
      N:           Number(sensorData.nitrogen)    || 0,
      P:           Number(sensorData.phosphorus)  || 0,
      K:           Number(sensorData.potassium)   || 0,
      temperature: Number(sensorData.temperature) || 0,
      humidity:    Number(sensorData.humidity)    || 0,
      ph:          Number(sensorData.soilPH)      || 0,
      rainfall:    Number(sensorData.rainfall)    || 0,
    };

    fetch("/api/crops/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Service temporarily unavailable");
        return r.json();
      })
      .then((data) => {
        setRecommendations(data.topRecommendations || []);
        setMlWarnings(data.warnings || []);
      })
      .catch((err) => {
        setMlError(err.message || "Could not load recommendations");
      })
      .finally(() => setLoadingMl(false));
  }, [sensorData]);

  // ── Fetch categories ──────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/crops?type=categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // ── Fetch crops by category ───────────────────────────────────────
  useEffect(() => {
    if (!details.cropCategory) { setCrops([]); return; }
    fetch(`/api/crops?type=list&category=${encodeURIComponent(details.cropCategory)}`)
      .then((r) => r.json())
      .then((d) => setCrops(d.crops || []))
      .catch(() => {});
  }, [details.cropCategory]);

  // ── Fetch varieties by crop ───────────────────────────────────────
  useEffect(() => {
    if (!details.crop) { setVarieties([]); return; }
    setLoadingVarieties(true);
    fetch(`/api/crops?type=varieties&crop=${encodeURIComponent(details.crop)}`)
      .then((r) => r.json())
      .then((d) => setVarieties([...(d.varieties || []), "Other"]))
      .catch(() => {})
      .finally(() => setLoadingVarieties(false));
  }, [details.crop]);

  // ── Handlers ──────────────────────────────────────────────────────
  const field = (key: keyof FarmDetails, val: string) =>
    onChange({ ...details, [key]: val });

  const handleCategoryChange = (cat: string) =>
    onChange({ ...details, cropCategory: cat, crop: "", cropVariety: "", customCropVariety: "" });

  const handleCropChange = (crop: string) =>
    onChange({ ...details, crop, cropVariety: "", customCropVariety: "" });

  const selectRecommended = (cropName: string) => {
    const category = inferCropCategory(cropName);
    onChange({ ...details, cropCategory: category, crop: cropName, cropVariety: "", customCropVariety: "" });
  };

  const hasSensor = !!sensorData;

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* ── ML CROP RECOMMENDATIONS ─────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={15} className="text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-[13px] font-semibold text-white/90 leading-none">
              Crop Recommendations
            </h3>
            <p className="mt-0.5 text-[11px] text-white/40">
              Based on your soil and environmental readings. Select to begin analysis.
            </p>
          </div>
        </div>

        {/* Out-of-range advisory (user-friendly) */}
        {mlWarnings.length > 0 && !loadingMl && (
          <div className="mb-3 flex items-start gap-2 rounded-[7px] border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
            <p className="text-[11.5px] text-amber-300/80 leading-relaxed">
              Some of your readings are outside typical agricultural ranges. Recommendations may be less accurate — please verify your inputs.
            </p>
          </div>
        )}

        {loadingMl && (
          <div className="flex items-center gap-2 py-6 text-[12px] text-white/40">
            <RefreshCw size={14} className="animate-spin text-emerald-500" />
            <span>Analysing your conditions…</span>
          </div>
        )}

        {mlError && !loadingMl && (
          <div className="flex items-center gap-2 rounded-[7px] border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-[12px] text-red-400">
            <AlertTriangle size={13} className="shrink-0" />
            {mlError}
          </div>
        )}

        {!loadingMl && !mlError && recommendations.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {recommendations.map((rec, i) => (
              <RecommendationCard
                key={rec.crop}
                rec={rec}
                isSelected={details.crop.toLowerCase() === rec.crop.toLowerCase()}
                onClick={() => selectRecommended(rec.crop)}
                delay={i * 80}
              />
            ))}
          </div>
        )}

        {!loadingMl && !mlError && recommendations.length === 0 && hasSensor && (
          <p className="text-[12px] text-white/35 py-4">
            No recommendations available for the provided readings.
          </p>
        )}

        {!hasSensor && (
          <p className="text-[12px] text-white/35 py-4">
            Complete Step 1 (Sensor & Soil Data) to receive crop recommendations.
          </p>
        )}
      </div>

      {/* ── CROP SUITABILITY PANEL ──────────────────────────────── */}
      {details.crop && sensorData && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
              Crop Suitability Analysis
            </h3>
            <span className="text-[10.5px] text-white/30">
              Currently analysing: <span className="text-white/55 font-medium">{details.crop}</span>
            </span>
          </div>
          <CropSuitabilityPanel
            sensorData={sensorData}
            selectedCrop={details.crop}
            farmDetails={details}
          />
        </div>
      )}

      {/* ── FARM & CROP DETAILS FORM ─────────────────────────────── */}
      <div>
        <div className="mb-3 border-t border-white/6 pt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
            Farm & Crop Details
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Farm name">
            <input
              className={FIELD_CLASS}
              value={details.farmName}
              onChange={(e) => field("farmName", e.target.value)}
              placeholder="e.g. Kadam Fields, Block A"
            />
          </Field>

          <Field label="Farmer name">
            <input
              className={FIELD_CLASS}
              value={details.farmerName}
              onChange={(e) => field("farmerName", e.target.value)}
              placeholder="e.g. Vikram Kadam"
            />
          </Field>

          <SearchableSelect
            label="Crop category"
            value={details.cropCategory || ""}
            options={categories}
            placeholder="Select category"
            onChange={handleCategoryChange}
          />

          <SearchableSelect
            label="Crop"
            value={details.crop}
            options={crops.map((c) => c.name)}
            placeholder={details.cropCategory ? "Select crop" : "Select a category first"}
            onChange={handleCropChange}
            disabled={!details.cropCategory}
          />

          <SearchableSelect
            label="Crop variety"
            value={details.cropVariety}
            options={varieties}
            placeholder={
              details.crop
                ? loadingVarieties
                  ? "Loading varieties…"
                  : "Select variety"
                : "Select a crop first"
            }
            onChange={(val) => field("cropVariety", val)}
            disabled={!details.crop || loadingVarieties}
          />

          {details.cropVariety === "Other" && (
            <div className="sm:col-span-1">
              <Field label="Specify variety">
                <input
                  className={FIELD_CLASS}
                  value={details.customCropVariety || ""}
                  onChange={(e) => field("customCropVariety", e.target.value)}
                  placeholder="Enter variety name"
                />
              </Field>
            </div>
          )}

          <Field label="Sowing date">
            <input
              type="date"
              className={FIELD_CLASS}
              value={details.sowingDate}
              onChange={(e) => field("sowingDate", e.target.value)}
            />
          </Field>

          <Field label="Growth stage">
            <select
              className={FIELD_CLASS}
              value={details.growthStage}
              onChange={(e) => field("growthStage", e.target.value)}
            >
              <option value="">Select stage</option>
              <option value="Germination">Germination</option>
              <option value="Vegetative">Vegetative</option>
              <option value="Flowering">Flowering</option>
              <option value="Fruiting">Fruiting</option>
              <option value="Maturity">Maturity</option>
            </select>
          </Field>

          <Field label="Irrigation type">
            <select
              className={FIELD_CLASS}
              value={details.irrigationType}
              onChange={(e) => field("irrigationType", e.target.value)}
            >
              <option value="">Select irrigation</option>
              <option value="Rainfed">Rainfed</option>
              <option value="Drip">Drip</option>
              <option value="Sprinkler">Sprinkler</option>
              <option value="Canal">Canal</option>
              <option value="Borewell">Borewell</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          <Field label="Soil type">
            <select
              className={FIELD_CLASS}
              value={details.soilType}
              onChange={(e) => field("soilType", e.target.value)}
            >
              <option value="">Select soil type</option>
              <option value="Black Soil">Black Soil</option>
              <option value="Loamy">Loamy</option>
              <option value="Clay">Clay</option>
              <option value="Sandy">Sandy</option>
              <option value="Sandy Loam">Sandy Loam</option>
              <option value="Alluvial">Alluvial</option>
              <option value="Red Soil">Red Soil</option>
              <option value="Laterite">Laterite</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>
      </div>
    </div>
  );
}

export const EMPTY_FARM_DETAILS: FarmDetails = {
  farmName: "",
  farmerName: "",
  crop: "",
  cropVariety: "",
  sowingDate: "",
  growthStage: "",
  irrigationType: "",
  soilType: "",
  cropCategory: "",
  customCropVariety: "",
};
