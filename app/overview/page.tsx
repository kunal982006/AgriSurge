import { AlertTriangle, CloudRain, Info } from "lucide-react";
import { Card, CardHeader, KpiCard, RiskBadge, StatusBadge } from "@/components/ui/primitives";
import { DEMO_ALERTS, DEMO_FARMS, RISK_DISTRIBUTION, RISK_TREND } from "@/lib/demo-data/farms";
import { RiskTrendChart } from "@/components/charts/RiskTrendChart";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { RegionalRiskMap } from "@/components/map/RegionalRiskMap";

const SEVERITY_ICON = { high: AlertTriangle, medium: CloudRain, info: Info };
const SEVERITY_COLOR = {
  high: "text-[var(--color-red)] bg-[var(--color-red-dim)]",
  medium: "text-[var(--color-amber)] bg-[var(--color-amber-dim)]",
  info: "text-[var(--color-emerald)] bg-[var(--color-emerald-dim)]",
};

export default function OverviewPage() {
  const recent = DEMO_FARMS.slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Portfolio overview</h1>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
          Aggregated risk exposure across insured farms, Kharif 2026 season.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Insured Farms" value="241" delta="+12" deltaDirection="up" />
        <KpiCard label="High Risk Farms" value="31" delta="+6" deltaDirection="up" />
        <KpiCard label="Avg. Risk Score" value="0.46" delta="+0.03" deltaDirection="up" />
        <KpiCard label="Premium Portfolio" value="₹16.1L" delta="+8.1%" deltaDirection="up" />
        <KpiCard label="Active Policies" value="198" delta="+4" deltaDirection="up" />
        <KpiCard label="Claims This Month" value="7" delta="-2" deltaDirection="down" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title="Regional risk heatmap"
            subtitle="Farm-level risk across insured regions — click a marker for details"
          />
          <div className="h-[360px]">
            <RegionalRiskMap farms={DEMO_FARMS} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Risk distribution" subtitle="241 farms, current season" />
          <div className="px-4 py-4">
            <RiskDistributionChart data={RISK_DISTRIBUTION} />
            <div className="mt-3 flex flex-col gap-1.5">
              {RISK_DISTRIBUTION.map((d) => (
                <div key={d.level} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                    {d.level}
                  </span>
                  <span className="tnum text-[var(--color-text)]">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader title="Recent risk assessments" subtitle="Latest 5 of 241 farms" />
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[11px] uppercase tracking-wide text-[var(--color-text-dim)]">
                  <th className="px-4 py-2 font-medium">Farm ID</th>
                  <th className="px-4 py-2 font-medium">Location</th>
                  <th className="px-4 py-2 font-medium">Crop</th>
                  <th className="px-4 py-2 font-medium">Risk score</th>
                  <th className="px-4 py-2 font-medium">Level</th>
                  <th className="px-4 py-2 font-medium">Premium</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((farm) => (
                  <tr
                    key={farm.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <td className="tnum px-4 py-2.5 text-[var(--color-text)]">{farm.id}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{farm.location}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{farm.crop}</td>
                    <td className="tnum px-4 py-2.5 text-[var(--color-text)]">{farm.riskScore.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <RiskBadge level={farm.riskLevel} />
                    </td>
                    <td className="tnum px-4 py-2.5 text-[var(--color-text)]">
                      ₹{farm.recommendedPremium.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={farm.policyStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent alerts" subtitle={`${DEMO_ALERTS.filter((a) => !a.read).length} unread`} />
          <ul className="divide-y divide-[var(--color-border)]">
            {DEMO_ALERTS.map((alert) => {
              const Icon = SEVERITY_ICON[alert.severity];
              return (
                <li key={alert.id} className="flex gap-2.5 px-4 py-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] ${SEVERITY_COLOR[alert.severity]}`}
                  >
                    <Icon size={12} />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[12px] leading-snug ${alert.read ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`}>
                      {alert.message}
                    </p>
                    <p className="mt-1 text-[10.5px] text-[var(--color-text-dim)]">
                      {new Date(alert.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Risk trend, last 6 months" subtitle="Average portfolio risk score" />
        <div className="h-[220px] px-4 py-4">
          <RiskTrendChart data={RISK_TREND} />
        </div>
      </Card>
    </div>
  );
}
