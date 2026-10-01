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

const GROWTH_STAGES = [
  "Germination",
  "Vegetative",
  "Flowering",
  "Fruiting",
  "Maturity",
];

const IRRIGATION_TYPES = [
  "Rainfed",
  "Drip",
  "Sprinkler",
  "Canal",
  "Borewell",
  "Other",
];

const SOIL_TYPES = [
  "Black Soil",
  "Loamy",
  "Clay",
  "Sandy",
  "Sandy Loam",
  "Alluvial",
  "Red Soil",
  "Laterite",
  "Other",
];

// ─── Primitives ───────────────────────────────────────────────────────
const FIELD_CLASS =
  "w-full rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[12.5px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-emerald-500/50 focus:bg-[var(--color-surface)] focus:outline-none transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-dim)]">{label}</span>
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
  searchable = true,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  searchable?: boolean;
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

  const filtered = searchable
    ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-dim)]">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-[7px] border px-3 py-2 text-[12.5px] text-left transition-all disabled:opacity-40 cursor-pointer ${
          value
            ? "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)]"
        } focus:border-emerald-500/50 focus:outline-none`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-[var(--color-text-dim)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-[8px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-xl overflow-hidden">
          {searchable && (
            <div className="p-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-[5px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-emerald-500/40"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto p-1">
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
                  className={`w-full text-left rounded-[5px] px-2.5 py-1.5 text-[12.5px] transition-colors cursor-pointer ${
                    opt === value
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
                  }`}
                >
                  {opt}
                </button>
              ))
            ) : (
              <span className="block p-2 text-[11px] text-[var(--color-text-dim)]">No options found</span>
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
    { label: "Tier 1 Match" },
    { label: "Tier 2 Match" },
    { label: "Alternative" },
  ][rec.rank - 1] || { label: "Match" };

  const pct = Math.round((rec.confidence || 0) * 100);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(5px)",
        transition: `opacity 0.35s ease ${delay}ms, transform 0.35s ease ${delay}ms, box-shadow 0.2s, border-color 0.2s`,
      }}
      className={`relative flex flex-col rounded-[6px] border p-4 text-left transition-colors group cursor-pointer ${
        isSelected
          ? "border-slate-800 bg-slate-50 dark:border-slate-300 dark:bg-slate-900/30"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)]"
      }`}
    >
      <div className="flex justify-between items-start w-full mb-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? "text-slate-800 dark:text-slate-200" : "text-[var(--color-text-dim)]"}`}>
          {rankMeta.label}
        </span>
        {isSelected && (
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900">
            <Check size={9} className="stroke-[3]" />
          </span>
        )}
      </div>

      <h4 className={`text-[15px] font-semibold leading-tight ${isSelected ? "text-slate-900 dark:text-slate-100" : "text-[var(--color-text)] group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors"}`}>
        {rec.crop}
      </h4>

      <div className="mt-4 space-y-1.5 w-full">
        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-dim)]">
          <span>Suitability Index</span>
          <span className={`font-medium tabular-nums ${isSelected ? "text-slate-900 dark:text-slate-100" : "text-[var(--color-text-muted)]"}`}>
            {pct > 0 ? `${pct}%` : "—"}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <div
            className={`h-full rounded-sm transition-all duration-700 ${
              isSelected ? "bg-slate-800 dark:bg-slate-200" : "bg-[var(--color-border-strong)] group-hover:bg-slate-400 dark:group-hover:bg-slate-500"
            }`}
            style={{ width: visible ? `${pct}%` : "0%" }}
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
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.error || "Service temporarily unavailable");
        }
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
          <Sparkles size={15} className="text-emerald-500 shrink-0" />
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--color-text)] leading-none">
              Crop Recommendations
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--color-text-dim)]">
              Based on your soil and environmental readings. Select to begin analysis.
            </p>
          </div>
        </div>

        {/* Out-of-range advisory (user-friendly) - removed per user request */}

        {loadingMl && (
          <div className="flex items-center gap-2 py-6 text-[12px] text-[var(--color-text-dim)]">
            <RefreshCw size={14} className="animate-spin text-emerald-500" />
            <span>Analysing your conditions…</span>
          </div>
        )}

        {mlError && !loadingMl && (
          <div className="flex items-center gap-2 rounded-[7px] border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-[12px] text-red-500">
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
          <p className="text-[12px] text-[var(--color-text-dim)] py-4">
            No recommendations available for the provided readings.
          </p>
        )}

        {!hasSensor && (
          <p className="text-[12px] text-[var(--color-text-dim)] py-4">
            Complete Step 1 (Sensor & Soil Data) to receive crop recommendations.
          </p>
        )}
      </div>

      {/* ── CROP SUITABILITY PANEL ──────────────────────────────── */}
      {details.crop && sensorData && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-dim)]">
              Crop Suitability Analysis
            </h3>
            <span className="text-[10.5px] text-[var(--color-text-dim)]">
              Currently analysing: <span className="text-[var(--color-text)] font-semibold">{details.crop}</span>
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
        <div className="mb-3 border-t border-[var(--color-border)] pt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-dim)]">
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

          <SearchableSelect
            label="Growth stage"
            value={details.growthStage}
            options={GROWTH_STAGES}
            placeholder="Select stage"
            onChange={(val) => field("growthStage", val)}
            searchable={false}
          />

          <SearchableSelect
            label="Irrigation type"
            value={details.irrigationType}
            options={IRRIGATION_TYPES}
            placeholder="Select irrigation"
            onChange={(val) => field("irrigationType", val)}
            searchable={false}
          />

          <SearchableSelect
            label="Soil type"
            value={details.soilType}
            options={SOIL_TYPES}
            placeholder="Select soil type"
            onChange={(val) => field("soilType", val)}
            searchable={false}
          />
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
