import Link from "next/link";
import { Leaf, ArrowLeft, ArrowRight, ShieldCheck, Building2, CheckCircle2 } from "lucide-react";
import { BackgroundVideo } from "@/components/landing/BackgroundVideo";

export const metadata = {
  title: "Insurance Company Portal — AgriSurge",
  description: "Agricultural risk intelligence, underwriting support, and insurance premium recommendations.",
};

export default function InsuranceLoginPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-transparent text-[#e7ebe6] px-4 py-8 sm:px-6 lg:px-8">
      {/* Background Video Layer */}
      <BackgroundVideo />

      {/* Top Bar */}
      <div className="relative z-20 mx-auto w-full max-w-4xl flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-lg bg-black/40 px-3.5 py-2 text-xs font-semibold text-white shadow-md backdrop-blur-xs transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Landing Page</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg border border-white/30">
            <Leaf size={18} strokeWidth={2.2} />
          </div>
          <span className="text-base font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            AgriSurge
          </span>
        </div>
      </div>

      {/* Center Content: Completely Transparent, no opaque card/borders/shadows */}
      <div className="relative z-20 mx-auto my-auto w-full max-w-xl py-8">
        <div
          className="bg-transparent border-0 p-2 sm:p-4 shadow-none"
          style={{ background: "transparent", border: "none" }}
        >
          {/* Header pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/80 px-3.5 py-1 text-xs font-semibold text-white shadow-md border border-white/20">
            <ShieldCheck size={14} className="text-white" />
            <span>Insurance Carrier & Underwriter Access</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] sm:text-4xl">
            Login as Insurance Company
          </h1>
          <p className="mt-2 text-base font-medium leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Agricultural risk intelligence, automated underwriting support, and dynamic insurance premium recommendations.
          </p>

          <div
            className="mt-6 space-y-3 bg-transparent border-0 p-0"
            style={{ background: "transparent", border: "none" }}
          >
            <div className="flex items-start gap-3">
              <Building2 size={18} className="mt-0.5 text-emerald-300 drop-shadow-md shrink-0" />
              <div>
                <p className="text-sm font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  Underwriting & Risk Modeling Platform Available
                </p>
                <p className="mt-1 text-sm font-medium text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] leading-relaxed">
                  Institutional authentication is ready to be linked with corporate SSO. You can enter the active Underwriting Workspace directly to review risk models and policies.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/20 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-300 drop-shadow-md">
              Institutional Capabilities
            </h2>
            <ul className="mt-3 space-y-2 text-sm font-medium text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                <span>Multi-factor AI crop failure risk assessment & dynamic pricing engine</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                <span>Geospatial farm parcel demarcation with live satellite & weather integration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                <span>Comprehensive policy book, actuarial multipliers, and claims dashboard</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/overview"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 active:scale-[0.99]"
            >
              <span>Enter Underwriting Workspace</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black/40 px-5 py-3.5 text-sm font-semibold text-white shadow-md backdrop-blur-xs transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 active:scale-[0.99]"
            >
              <ArrowLeft size={16} />
              <span>Return to Landing</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="relative z-20 text-center text-xs font-medium text-white/80 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
        © 2026 AgriSurge · Institutional Risk Intelligence Platform
      </div>
    </div>
  );
}
