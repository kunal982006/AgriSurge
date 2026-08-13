import { Card, CardHeader } from "@/components/ui/primitives";
import { RiskTrendChart } from "@/components/charts/RiskTrendChart";
import { PremiumTrendChart } from "@/components/charts/PremiumTrendChart";
import { RiskBarChart } from "@/components/charts/RiskBarChart";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { CROP_RISK, PREMIUM_TREND, REGIONAL_RISK, RISK_DISTRIBUTION, RISK_TREND } from "@/lib/demo-data/farms";
import { Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Reports & analytics</h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Portfolio-level trends across regions and crops, Kharif 2026
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] px-3 py-2 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]">
          <Download size={13} />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["Last 6 months", "All regions", "All crops"].map((f) => (
          <button
            key={f}
            className="rounded-[6px] border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Risk trend over time" subtitle="Average portfolio risk score" />
          <div className="h-[220px] px-4 py-4">
            <RiskTrendChart data={RISK_TREND} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Premium trend" subtitle="Total recommended premium, monthly" />
          <div className="h-[220px] px-4 py-4">
            <PremiumTrendChart data={PREMIUM_TREND} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Regional risk comparison" subtitle="Average risk score by region" />
          <div className="h-[220px] px-4 py-4">
            <RiskBarChart data={REGIONAL_RISK} categoryKey="region" valueKey="avgRisk" horizontal />
          </div>
        </Card>
        <Card>
          <CardHeader title="Crop-wise risk" subtitle="Average risk score by crop type" />
          <div className="h-[220px] px-4 py-4">
            <RiskBarChart data={CROP_RISK} categoryKey="crop" valueKey="avgRisk" horizontal />
          </div>
        </Card>
        <Card>
          <CardHeader title="Risk distribution" subtitle="Share of farms by risk level" />
          <div className="px-4 py-4">
            <RiskDistributionChart data={RISK_DISTRIBUTION} />
          </div>
        </Card>
        <Card>
          <CardHeader title="High-risk regions" subtitle="Regions above 0.55 average risk" />
          <ul className="divide-y divide-[var(--color-border)]">
            {REGIONAL_RISK.filter((r) => r.avgRisk >= 0.55)
              .sort((a, b) => b.avgRisk - a.avgRisk)
              .map((r) => (
                <li key={r.region} className="flex items-center justify-between px-4 py-3 text-[12.5px]">
                  <span className="text-[var(--color-text-muted)]">{r.region}</span>
                  <span className="tnum text-[var(--color-red)]">{r.avgRisk.toFixed(2)}</span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
