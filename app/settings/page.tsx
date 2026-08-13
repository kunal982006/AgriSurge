import { Card, CardHeader, StatusBadge } from "@/components/ui/primitives";

const SETTINGS_SECTIONS = ["Profile", "Organization", "API & Data Sources", "Risk Configuration", "Pricing Rules", "Notifications", "Security"];

const DATA_SOURCES: { name: string; status: "connected" | "not_configured" | "error"; note: string }[] = [
  { name: "Map (OpenStreetMap)", status: "connected", note: "No key required" },
  { name: "Weather Provider (Open-Meteo)", status: "connected", note: "No key required" },
  { name: "Satellite Provider (Sentinel Hub)", status: "not_configured", note: "SATELLITE_CLIENT_ID / SECRET" },
  { name: "ML Risk Service", status: "not_configured", note: "ML_SERVICE_URL — using development mock predictor" },
  { name: "Database (PostgreSQL / Neon)", status: "not_configured", note: "DATABASE_URL" },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Settings</h1>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
          Manage integrations, risk configuration, and pricing rules
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <Card className="h-fit px-3 py-3">
          <ul className="flex flex-col gap-0.5">
            {SETTINGS_SECTIONS.map((s, i) => (
              <li key={s}>
                <button
                  className={`w-full rounded-[6px] px-2.5 py-2 text-left text-[12.5px] ${
                    i === 2
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]"
                  }`}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="API & data sources"
            subtitle="Connection status for external providers. No secrets are shown here."
          />
          <ul className="divide-y divide-[var(--color-border)]">
            {DATA_SOURCES.map((source) => (
              <li key={source.name} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-[12.5px] text-[var(--color-text)]">{source.name}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-dim)]">{source.note}</p>
                </div>
                <StatusBadge status={source.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
