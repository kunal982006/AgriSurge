"use client";

import { usePathname } from "next/navigation";
import { Bell, Sun, Moon } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { useTheme } from "@/components/theme/ThemeProvider";

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname?.startsWith(item.href + "/")
  );

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[var(--color-text-dim)]">AgriSurge</span>
        <span className="text-[12px] text-[var(--color-text-dim)]">/</span>
        <span className="text-[13px] font-medium text-[var(--color-text)]">
          {current?.label ?? "Overview"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Light / Dark Mode Toggle button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center gap-2 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-text)] shadow-xs transition-all hover:border-[var(--color-border-strong)] hover:text-[var(--color-emerald)] cursor-pointer"
        >
          {theme === "dark" ? (
            <>
              <Sun size={14} className="text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={14} className="text-[var(--color-emerald)] shrink-0" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>

        <button className="relative flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)] transition-colors">
          <Bell size={15} strokeWidth={1.8} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--color-red)]" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[11px] font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)]">
          RA
        </div>
      </div>
    </header>
  );
}
