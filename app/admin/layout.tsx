import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgriSurge Admin — Platform Analytics",
  description: "Enterprise SaaS Admin Analytics Dashboard for AgriSurge",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 antialiased font-sans">
      {children}
    </div>
  );
}
