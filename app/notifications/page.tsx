"use client";

import { useState } from "react";
import { AlertTriangle, CloudRain, Info } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { DEMO_ALERTS } from "@/lib/demo-data/farms";

const SEVERITY_ICON = { high: AlertTriangle, medium: CloudRain, info: Info };
const SEVERITY_COLOR = {
  high: "text-[var(--color-red)] bg-[var(--color-red-dim)]",
  medium: "text-[var(--color-amber)] bg-[var(--color-amber-dim)]",
  info: "text-[var(--color-emerald)] bg-[var(--color-emerald-dim)]",
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const items = DEMO_ALERTS.filter((a) => filter === "all" || !a.read);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Notifications</h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            {DEMO_ALERTS.filter((a) => !a.read).length} unread of {DEMO_ALERTS.length}
          </p>
        </div>
        <div className="flex rounded-[6px] border border-[var(--color-border)] p-0.5">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-[4px] px-2.5 py-1.5 text-[12px] ${
              filter === "all" ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]" : "text-[var(--color-text-dim)]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-[4px] px-2.5 py-1.5 text-[12px] ${
              filter === "unread" ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]" : "text-[var(--color-text-dim)]"
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)]">You&rsquo;re all caught up.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((alert) => {
              const Icon = SEVERITY_ICON[alert.severity];
              return (
                <li key={alert.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--color-surface-raised)]">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] ${SEVERITY_COLOR[alert.severity]}`}>
                    <Icon size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12.5px] leading-snug ${alert.read ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`}>
                      {alert.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--color-text-dim)]">
                      <span>
                        {new Date(alert.timestamp).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {alert.farmId && (
                        <>
                          <span>·</span>
                          <span className="tnum">{alert.farmId}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!alert.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-emerald)]" />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
