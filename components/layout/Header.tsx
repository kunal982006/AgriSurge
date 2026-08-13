"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";

export function Header() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname?.startsWith(item.href + "/")
  );

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)] px-6">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[var(--color-text-dim)]">AgriSurge</span>
        <span className="text-[12px] text-[var(--color-text-dim)]">/</span>
        <span className="text-[13px] font-medium text-[var(--color-text)]">
          {current?.label ?? "Overview"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] sm:flex">
          Kharif 2026
          <ChevronDown size={13} />
        </button>
        <button className="hidden items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] sm:flex">
          All regions
          <ChevronDown size={13} />
        </button>
        <button className="relative flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]">
          <Bell size={15} strokeWidth={1.8} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--color-red)]" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[11px] font-semibold text-[var(--color-text-muted)]">
          RA
        </div>
      </div>
    </header>
  );
}
