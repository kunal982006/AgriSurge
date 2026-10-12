"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage =
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/auth");

  if (isPublicPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
