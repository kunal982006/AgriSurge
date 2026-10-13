"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Leaf,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
  Phone,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { BackgroundVideo } from "@/components/landing/BackgroundVideo";
import { setInsuranceSession } from "@/lib/insurance/auth";

type InsuranceAuthMode = "login" | "register";

export default function InsuranceLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InsuranceAuthMode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillQuickDemo = () => {
    setMode("login");
    setPhone("8767476106");
    setPassword("password123");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "register" && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/insurance/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          phone: cleanPhone,
          password: password.trim(),
          name: name.trim(),
          organization: organization.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Please verify your credentials.");
        setLoading(false);
        return;
      }

      // Save user session in localStorage
      setInsuranceSession(data.user);

      // If new account registered: start clean slate / zero records by setting user-scoped flag
      if (mode === "register" || data.isNew) {
        localStorage.setItem(`agrisurge_insurance_fresh_${data.user.phone}`, "true");
      }

      // Navigate to overview workspace
      router.push("/overview");
    } catch (err: any) {
      console.error("Insurance auth error:", err);
      setError("Something went wrong during authentication. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-transparent text-[#e7ebe6] px-4 py-8 sm:px-6 lg:px-8">
      {/* Background Video Layer */}
      <BackgroundVideo />

      {/* Top Bar */}
      <div className="relative z-20 mx-auto w-full max-w-4xl flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-xl bg-black/40 px-3.5 py-2 text-xs font-semibold text-white/90 shadow-md backdrop-blur-md border border-white/10 transition-all hover:bg-black/60 hover:text-white hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5 text-emerald-400" />
          <span>Back to Landing Page</span>
        </Link>

        <Link href="/" className="group flex items-center gap-2.5 transition-all">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] backdrop-blur-md transition-all group-hover:scale-105 group-hover:bg-emerald-500/30">
            <Leaf size={20} strokeWidth={2.3} className="text-emerald-400 drop-shadow" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">AgriSurge</span>
            <span className="text-[10px] font-medium tracking-wide text-emerald-400/90 uppercase">Underwriting Portal</span>
          </div>
        </Link>
      </div>

      {/* Center Content: Clean Glassmorphic Card */}
      <div className="relative z-20 mx-auto my-auto w-full max-w-[500px] py-6">
        <div className="rounded-3xl border border-white/15 bg-black/40 p-6 sm:p-9 shadow-[0_8px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl">
          {/* Header Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/50 px-3.5 py-1 text-[11px] font-semibold text-emerald-300 shadow-sm backdrop-blur-sm">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Institutional Underwriter Access</span>
            </div>

            <button
              type="button"
              onClick={fillQuickDemo}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300/90 hover:text-white transition cursor-pointer underline underline-offset-4"
              title="Click to fill current insurance account"
            >
              <KeyRound size={12} />
              <span>Use Current Account</span>
            </button>
          </div>

          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-3xl">
            {mode === "login" ? "Insurance Company Login" : "Register Insurance Account"}
          </h1>
          <p className="mt-2 text-xs font-medium text-emerald-100/80 leading-relaxed sm:text-sm">
            {mode === "login"
              ? "Access active underwriting queues, risk analytics, and actuarial pricing models."
              : "Register a new insurance carrier or underwriter profile. New accounts begin with a clean slate."}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                    <User size={13} className="text-emerald-400" />
                    <span>Officer Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Deshmukh"
                    className="w-full rounded-xl bg-black/35 border border-white/15 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner outline-none transition-all focus:border-emerald-400 focus:bg-black/50 focus:ring-2 focus:ring-emerald-400/25"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                    <Building2 size={13} className="text-emerald-400" />
                    <span>Insurance Organization / Carrier</span>
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. National Crop Insurance Corp"
                    className="w-full rounded-xl bg-black/35 border border-white/15 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner outline-none transition-all focus:border-emerald-400 focus:bg-black/50 focus:ring-2 focus:ring-emerald-400/25"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                <Phone size={13} className="text-emerald-400" />
                <span>Phone Number (10 digits)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit phone (e.g. 8767476106)"
                maxLength={10}
                className="w-full rounded-xl bg-black/35 border border-white/15 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner outline-none transition-all focus:border-emerald-400 focus:bg-black/50 focus:ring-2 focus:ring-emerald-400/25"
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                <Lock size={13} className="text-emerald-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password (e.g. password123)"
                className="w-full rounded-xl bg-black/35 border border-white/15 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner outline-none transition-all focus:border-emerald-400 focus:bg-black/50 focus:ring-2 focus:ring-emerald-400/25"
                autoComplete="current-password"
              />
            </div>

            {/* Quick credentials hint note */}
            {mode === "login" && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/40 p-3 text-xs text-emerald-200/90 flex items-start gap-2.5 backdrop-blur-sm">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-300">Default Demo Credentials:</p>
                  <p className="mt-0.5 text-[11px] text-emerald-100/80 font-mono">
                    Phone: <span className="font-bold text-white">8767476106</span> &nbsp;|&nbsp; Password: <span className="font-bold text-white">password123</span>
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-medium text-red-200 backdrop-blur-md flex items-start gap-2 shadow-sm">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(5,150,105,0.4)] transition-all hover:bg-emerald-500 hover:shadow-[0_6px_24px_rgba(16,185,129,0.5)] disabled:opacity-60 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <>
                  <span>
                    {mode === "login" ? "Enter Underwriting Workspace" : "Create Account & Start Fresh"}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Switch Mode Button */}
            <div className="mt-1 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError(null);
                }}
                className="font-medium text-emerald-300 hover:text-white transition cursor-pointer"
              >
                {mode === "login"
                  ? "Need a new account? Register as new carrier →"
                  : "Already registered? Login with phone & password →"}
              </button>

              <Link
                href="/"
                className="text-white/60 hover:text-white transition"
              >
                Return to Landing
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="relative z-20 text-center text-xs font-medium text-white/60">
        AgriSurge · Institutional Risk Intelligence Platform
      </div>
    </div>
  );
}
