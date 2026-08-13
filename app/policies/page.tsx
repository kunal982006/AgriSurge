import { Card, StatusBadge, RiskBadge } from "@/components/ui/primitives";
import { DEMO_FARMS } from "@/lib/demo-data/farms";

const POLICIES = DEMO_FARMS.map((farm, i) => ({
  policyId: `PLY-${20260 + i}`,
  farm,
  coverage: Math.round(farm.recommendedPremium * 6.5),
  startDate: "2026-06-01",
  endDate: "2026-11-30",
}));

export default function PoliciesPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Policies</h1>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
          {POLICIES.length} policies across the Kharif 2026 book
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[11px] uppercase tracking-wide text-[var(--color-text-dim)]">
                <th className="px-4 py-2.5 font-medium">Policy ID</th>
                <th className="px-4 py-2.5 font-medium">Farm ID</th>
                <th className="px-4 py-2.5 font-medium">Farmer</th>
                <th className="px-4 py-2.5 font-medium">Crop</th>
                <th className="px-4 py-2.5 font-medium">Coverage</th>
                <th className="px-4 py-2.5 font-medium">Base premium</th>
                <th className="px-4 py-2.5 font-medium">Recommended premium</th>
                <th className="px-4 py-2.5 font-medium">Risk level</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Period</th>
              </tr>
            </thead>
            <tbody>
              {POLICIES.map((p) => (
                <tr
                  key={p.policyId}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]"
                >
                  <td className="tnum px-4 py-2.5 text-[var(--color-text)]">{p.policyId}</td>
                  <td className="tnum px-4 py-2.5 text-[var(--color-text-muted)]">{p.farm.id}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{p.farm.farmer}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{p.farm.crop}</td>
                  <td className="tnum px-4 py-2.5 text-[var(--color-text)]">₹{p.coverage.toLocaleString("en-IN")}</td>
                  <td className="tnum px-4 py-2.5 text-[var(--color-text-muted)]">₹10,000</td>
                  <td className="tnum px-4 py-2.5 text-[var(--color-text)]">
                    ₹{p.farm.recommendedPremium.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-2.5">
                    <RiskBadge level={p.farm.riskLevel} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={p.farm.policyStatus} />
                  </td>
                  <td className="px-4 py-2.5 text-[11.5px] text-[var(--color-text-dim)]">
                    {p.startDate} → {p.endDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
