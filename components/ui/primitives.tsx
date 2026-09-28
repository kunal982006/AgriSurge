import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between border-b border-[var(--color-border)] px-4 py-3">
      <div>
        <h3 className="text-[13px] font-medium text-[var(--color-text)]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11.5px] text-[var(--color-text-dim)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type RiskLevel = "low" | "moderate" | "high";

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]",
  moderate: "bg-[var(--color-amber-dim)] text-[var(--color-amber)]",
  high: "bg-[var(--color-red-dim)] text-[var(--color-red)]",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const label = level === "low" ? "Low" : level === "moderate" ? "Moderate" : "High";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium ${RISK_STYLES[level]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const norm = (status || "").toLowerCase().replace(/\s+/g, "_");

  let style = "border border-[var(--color-border-strong)] text-[var(--color-text-dim)]";
  let label = status ? status.replace(/_/g, " ") : "Unknown";

  if (norm === "approved" || norm === "active" || norm === "connected") {
    style = "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]";
    label = norm === "approved" ? "Approved" : norm === "active" ? "Active" : "Connected";
  } else if (norm === "under_review" || norm === "pending") {
    style = "bg-[var(--color-amber-dim)] text-[var(--color-amber)]";
    label = "Under review";
  } else if (norm === "needs_information") {
    style = "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30";
    label = "Needs Info";
  } else if (norm === "rejected" || norm === "error") {
    style = "bg-[var(--color-red-dim)] text-[var(--color-red)]";
    label = "Rejected";
  } else if (norm === "draft") {
    style = "bg-[var(--color-surface-raised)] text-[var(--color-text-dim)] border border-[var(--color-border)]";
    label = "Draft";
  }

  return (
    <span className={`inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium ${style}`}>
      {label}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  deltaDirection,
  suffix,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  suffix?: string;
}) {
  const isGood =
    deltaDirection === "up"
      ? label.toLowerCase().includes("risk")
        ? false
        : true
      : deltaDirection === "down"
      ? label.toLowerCase().includes("risk")
        ? true
        : false
      : true;

  return (
    <Card className="px-4 py-3.5">
      <p className="text-[11.5px] text-[var(--color-text-muted)]">{label}</p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="tnum text-[22px] font-semibold leading-none text-[var(--color-text)]">
          {value}
        </span>
        {suffix && <span className="text-[11.5px] text-[var(--color-text-dim)]">{suffix}</span>}
      </div>
      {delta && (
        <div
          className={`mt-2 flex items-center gap-1 text-[11px] ${
            deltaDirection === "flat"
              ? "text-[var(--color-text-dim)]"
              : isGood
              ? "text-[var(--color-emerald)]"
              : "text-[var(--color-red)]"
          }`}
        >
          {deltaDirection === "up" && <ArrowUpRight size={12} />}
          {deltaDirection === "down" && <ArrowDownRight size={12} />}
          <span>{delta} vs. last period</span>
        </div>
      )}
    </Card>
  );
}
