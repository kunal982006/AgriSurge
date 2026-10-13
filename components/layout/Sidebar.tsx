"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  ScanSearch,
  Map,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Leaf,
  LogOut,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import {
  getInsuranceSession,
  clearInsuranceSession,
  DEFAULT_INSURANCE_USER,
  InsuranceUser,
} from "@/lib/insurance/auth";

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  "/overview": LayoutGrid,
  "/risk-analysis": ScanSearch,
  "/farm-map": Map,
  "/policies": FileText,
  "/reports": BarChart3,
  "/notifications": Bell,
  "/settings": Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<InsuranceUser>(DEFAULT_INSURANCE_USER);

  useEffect(() => {
    const session = getInsuranceSession();
    if (session) {
      setUser(session);
    }
  }, []);

  const handleLogout = () => {
    clearInsuranceSession();
    router.push("/login/insurance");
  };

  const initials = (user.name || "RA")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]">
          <Leaf size={16} strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-semibold tracking-tight text-[var(--color-text)]">AgriSurge</p>
          <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-dim)]">Risk Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = ICONS[item.href] ?? LayoutGrid;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-2.5 rounded-[6px] px-2.5 py-[7px] text-[13px] transition-colors ${
                    active
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  <span className={active ? "font-medium" : ""}>{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-emerald)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info & Logout */}
      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <div className="flex items-center justify-between rounded-[6px] px-2 py-2 hover:bg-[var(--color-surface-raised)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[11px] font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)]">
              {initials}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12.5px] font-medium text-[var(--color-text)]">{user.name}</p>
              <p className="truncate text-[10.5px] text-[var(--color-text-dim)]">
                {user.role} · {user.organization}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out of insurance portal"
            aria-label="Log out"
            className="ml-2 shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-red-500 transition cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
