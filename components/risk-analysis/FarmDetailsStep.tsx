"use client";

import { useState, useEffect, useRef } from "react";

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

interface CropItem {
  name: string;
  category: string;
}

const FIELD_CLASS =
  "w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-2 text-[12.5px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-emerald)] focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

// Searchable custom select dropdown component
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
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <span className="text-[11.5px] text-[var(--color-text-muted)]">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-2 text-[12.5px] text-left text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none disabled:opacity-50 flex justify-between items-center transition-all"
      >
        <span>{value || placeholder}</span>
        <span className="text-[10px] text-[var(--color-text-dim)]">▼</span>
      </button>

      {open && (
        <div className="absolute top-[60px] left-0 right-0 z-50 rounded-[6px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-lg p-1.5 flex flex-col gap-1.5 max-h-56">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-1 text-[12px] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-emerald)]"
            autoFocus
          />
          <div className="overflow-y-auto flex flex-col max-h-40">
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
                  className="w-full text-left px-2 py-1.5 text-[12.5px] rounded-[4px] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
                >
                  {opt}
                </button>
              ))
            ) : (
              <span className="text-[11px] text-[var(--color-text-dim)] p-2">No options found</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FarmDetailsStep({
  details,
  onChange,
}: {
  details: FarmDetails;
  onChange: (d: FarmDetails) => void;
}) {
  const [categories, setCategories] = useState<string[]>([]);
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [varieties, setVarieties] = useState<string[]>([]);
  const [loadingVarieties, setLoadingVarieties] = useState(false);

  // Fetch unique categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/crops?type=categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch crops list filtered by category
  useEffect(() => {
    if (!details.cropCategory) {
      setCrops([]);
      return;
    }

    async function fetchCrops() {
      try {
        const res = await fetch(`/api/crops?type=list&category=${encodeURIComponent(details.cropCategory || "")}`);
        if (res.ok) {
          const data = await res.json();
          setCrops(data.crops || []);
        }
      } catch (err) {
        console.error("Error fetching crops:", err);
      }
    }
    fetchCrops();
  }, [details.cropCategory]);

  // Fetch varieties when crop selection changes
  useEffect(() => {
    if (!details.crop) {
      setVarieties([]);
      return;
    }

    async function fetchVarieties() {
      setLoadingVarieties(true);
      try {
        const res = await fetch(`/api/crops?type=varieties&crop=${encodeURIComponent(details.crop)}`);
        if (res.ok) {
          const data = await res.json();
          // Append "Other" dynamically
          setVarieties([...(data.varieties || []), "Other"]);
        }
      } catch (err) {
        console.error("Error fetching varieties:", err);
      } finally {
        setLoadingVarieties(false);
      }
    }
    fetchVarieties();
  }, [details.crop]);

  const handleFieldChange = (key: keyof FarmDetails, value: string) => {
    onChange({ ...details, [key]: value });
  };

  const handleCategoryChange = (categoryName: string) => {
    onChange({
      ...details,
      cropCategory: categoryName,
      crop: "", // Reset crop on category change
      cropVariety: "", // Reset variety on category change
      customCropVariety: "", // Clear custom variety input
    });
  };

  const handleCropChange = (cropName: string) => {
    onChange({
      ...details,
      crop: cropName,
      cropVariety: "", // Reset variety on crop change
      customCropVariety: "", // Clear custom variety input
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Farm name">
        <input
          className={FIELD_CLASS}
          value={details.farmName}
          onChange={(e) => handleFieldChange("farmName", e.target.value)}
          placeholder="Kadam Cotton Fields"
        />
      </Field>

      <Field label="Farmer name">
        <input
          className={FIELD_CLASS}
          value={details.farmerName}
          onChange={(e) => handleFieldChange("farmerName", e.target.value)}
          placeholder="Vikram Kadam"
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
        placeholder={details.cropCategory ? "Select crop" : "Select category first"}
        onChange={handleCropChange}
        disabled={!details.cropCategory}
      />

      <SearchableSelect
        label="Crop variety"
        value={details.cropVariety}
        options={varieties}
        placeholder={details.crop ? (loadingVarieties ? "Loading..." : "Select variety") : "Select crop first"}
        onChange={(val) => handleFieldChange("cropVariety", val)}
        disabled={!details.crop || loadingVarieties}
      />

      {/* Manual Variety Input */}
      {details.cropVariety === "Other" && (
        <div className="sm:col-span-2">
          <Field label="Enter crop variety">
            <input
              className={FIELD_CLASS}
              value={details.customCropVariety || ""}
              onChange={(e) => handleFieldChange("customCropVariety", e.target.value)}
              placeholder="e.g. Local Basmati Variant"
            />
          </Field>
        </div>
      )}

      <Field label="Sowing date">
        <input
          type="date"
          className={FIELD_CLASS}
          value={details.sowingDate}
          onChange={(e) => handleFieldChange("sowingDate", e.target.value)}
        />
      </Field>

      <Field label="Growth stage">
        <select
          className={FIELD_CLASS}
          value={details.growthStage}
          onChange={(e) => handleFieldChange("growthStage", e.target.value)}
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
          onChange={(e) => handleFieldChange("irrigationType", e.target.value)}
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
          onChange={(e) => handleFieldChange("soilType", e.target.value)}
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
