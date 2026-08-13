"use client";

export type FarmDetails = {
  farmName: string;
  farmerName: string;
  crop: string;
  cropVariety: string;
  sowingDate: string;
  growthStage: string;
  irrigationType: string;
  soilType: string;
};

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

export function FarmDetailsStep({
  details,
  onChange,
}: {
  details: FarmDetails;
  onChange: (d: FarmDetails) => void;
}) {
  const set = (key: keyof FarmDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...details, [key]: e.target.value });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Farm name">
        <input className={FIELD_CLASS} value={details.farmName} onChange={set("farmName")} placeholder="Kadam Cotton Fields" />
      </Field>
      <Field label="Farmer name">
        <input className={FIELD_CLASS} value={details.farmerName} onChange={set("farmerName")} placeholder="Vikram Kadam" />
      </Field>
      <Field label="Crop">
        <select className={FIELD_CLASS} value={details.crop} onChange={set("crop")}>
          <option value="">Select crop</option>
          <option>Cotton</option>
          <option>Soybean</option>
          <option>Paddy</option>
          <option>Sugarcane</option>
          <option>Groundnut</option>
          <option>Onion</option>
        </select>
      </Field>
      <Field label="Crop variety">
        <input className={FIELD_CLASS} value={details.cropVariety} onChange={set("cropVariety")} placeholder="Bt Cotton, hybrid" />
      </Field>
      <Field label="Sowing date">
        <input type="date" className={FIELD_CLASS} value={details.sowingDate} onChange={set("sowingDate")} />
      </Field>
      <Field label="Growth stage">
        <select className={FIELD_CLASS} value={details.growthStage} onChange={set("growthStage")}>
          <option value="">Select stage</option>
          <option>Sowing</option>
          <option>Vegetative</option>
          <option>Flowering</option>
          <option>Maturity</option>
          <option>Harvest</option>
        </select>
      </Field>
      <Field label="Irrigation type">
        <select className={FIELD_CLASS} value={details.irrigationType} onChange={set("irrigationType")}>
          <option value="">Select irrigation</option>
          <option>Rain-fed</option>
          <option>Drip</option>
          <option>Sprinkler</option>
          <option>Canal</option>
          <option>Borewell</option>
        </select>
      </Field>
      <Field label="Soil type">
        <select className={FIELD_CLASS} value={details.soilType} onChange={set("soilType")}>
          <option value="">Select soil type</option>
          <option>Black cotton soil</option>
          <option>Alluvial</option>
          <option>Red loamy</option>
          <option>Laterite</option>
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
};
