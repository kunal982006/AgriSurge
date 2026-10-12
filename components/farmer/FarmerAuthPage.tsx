"use client";

import { useState } from "react";
import { useFarmer } from "./FarmerContext";
import { BackgroundVideo } from "@/components/landing/BackgroundVideo";
import { Leaf, Phone, User, ArrowRight, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";
import { Language } from "@/lib/farmer/types";

const LANG_OPTIONS: { code: Language; label: string; native: string }[] = [
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "en", label: "English", native: "English" },
];

type AuthMode = "choose" | "login" | "register";

export function FarmerAuthPage() {
  const { setFarmer, setLanguage, language } = useFarmer();
  const [mode, setMode] = useState<AuthMode>("choose");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ui = {
    mr: {
      title: "शेतकरी पोर्टल",
      subtitle: "AI-आधारित पीक शिफारस आणि विमा प्रीमियम माहिती",
      loginBtn: "लॉगिन करा",
      registerBtn: "नोंदणी करा",
      loginTitle: "लॉगिन",
      registerTitle: "नोंदणी",
      phonePlaceholder: "मोबाईल नंबर (10 अंक)",
      namePlaceholder: "तुमचे पूर्ण नाव",
      submit: "सुरू करा",
      back: "मागे जा",
      phoneHint: "नोंदणीकृत मोबाईल नंबर टाका",
      nameHint: "आपले संपूर्ण नाव लिहा",
      noAccount: "नोंदणी नाही? नोंदणी करा →",
      hasAccount: "आधीच नोंदणी आहे? लॉगिन करा →",
    },
    hi: {
      title: "किसान पोर्टल",
      subtitle: "AI आधारित फसल सिफारिश और बीमा प्रीमियम जानकारी",
      loginBtn: "लॉगिन करें",
      registerBtn: "पंजीकरण करें",
      loginTitle: "लॉगिन",
      registerTitle: "पंजीकरण",
      phonePlaceholder: "मोबाइल नंबर (10 अंक)",
      namePlaceholder: "आपका पूरा नाम",
      submit: "शुरू करें",
      back: "वापस जाएं",
      phoneHint: "पंजीकृत मोबाइल नंबर दर्ज करें",
      nameHint: "अपना पूरा नाम लिखें",
      noAccount: "पंजीकरण नहीं? अभी पंजीकरण करें →",
      hasAccount: "पहले से पंजीकृत? लॉगिन करें →",
    },
    en: {
      title: "Farmer Portal",
      subtitle: "AI-powered crop recommendations and insurance premium guidance",
      loginBtn: "Login",
      registerBtn: "Register",
      loginTitle: "Login",
      registerTitle: "Register",
      phonePlaceholder: "Mobile number (10 digits)",
      namePlaceholder: "Your full name",
      submit: "Get Started",
      back: "Go Back",
      phoneHint: "Enter your registered mobile number",
      nameHint: "Enter your full name",
      noAccount: "Not registered? Register now →",
      hasAccount: "Already registered? Login →",
    },
  };

  const s = ui[language];

  const handleSubmit = async () => {
    setError(null);
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError(language === "mr" ? "१० अंकी मोबाईल नंबर टाका." : language === "hi" ? "10 अंकों का नंबर दर्ज करें।" : "Enter a valid 10-digit mobile number.");
      return;
    }

    if (mode === "register" && name.trim().length < 2) {
      setError(language === "mr" ? "तुमचे नाव टाका." : language === "hi" ? "अपना नाम दर्ज करें।" : "Enter your name.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        // Lookup farmer by phone
        const lookupRes = await fetch(`/api/farmer/auth?phone=${cleanPhone}`);
        const lookupData = await lookupRes.json();

        if (!lookupData.found || !lookupData.farmer) {
          setError(
            language === "mr"
              ? "हा मोबाईल नंबर नोंदणीकृत नाही. कृपया प्रथम नोंदणी करा."
              : language === "hi"
              ? "यह मोबाइल नंबर पंजीकृत नहीं है। पहले पंजीकरण करें।"
              : "This mobile number is not registered. Please register first."
          );
          setLoading(false);
          return;
        }

        setFarmer({
          id: lookupData.farmer.id,
          name: lookupData.farmer.name,
          phone: cleanPhone,
          district: lookupData.farmer.region || "",
          taluka: "",
          village: "",
          language,
        });
      } else {
        // Register — POST to auth API
        const regRes = await fetch("/api/farmer/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), phone: cleanPhone }),
        });

        if (!regRes.ok) {
          const errData = await regRes.json();
          setError(errData.error || "Registration failed. Please try again.");
          setLoading(false);
          return;
        }

        const regData = await regRes.json();
        setFarmer({
          id: regData.farmer.id,
          name: regData.farmer.name,
          phone: cleanPhone,
          district: "",
          taluka: "",
          village: "",
          language,
        });
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(language === "mr" ? "काहीतरी चूक झाली. पुन्हा प्रयत्न करा." : language === "hi" ? "कुछ गलत हुआ। पुनः प्रयास करें।" : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden text-white">
      <BackgroundVideo />

      {/* Top Bar */}
      <div className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 border border-white/20 shadow-lg">
            <Leaf size={20} strokeWidth={2.2} />
          </div>
          <span className="text-lg font-bold tracking-tight drop-shadow-md">AgriSurge</span>
        </Link>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 rounded-lg bg-black/30 p-1 backdrop-blur-xs border border-white/10">
          <Globe size={13} className="ml-1 text-emerald-300" />
          {LANG_OPTIONS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                language === l.code
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
      </div>

      {/* Center Content */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg rounded-3xl border border-emerald-500/20 bg-slate-950/70 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.95)] sm:text-4xl">
              {s.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-emerald-100/90">
              {s.subtitle}
            </p>
          </div>

          {/* Choose Mode */}
          {mode === "choose" && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setMode("login")}
                className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(5,150,105,0.4)] transition hover:bg-emerald-500 active:scale-[0.98]"
              >
                <Phone size={20} />
                <span>{s.loginBtn}</span>
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => setMode("register")}
                className="flex items-center justify-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-6 py-4 text-base font-bold text-white shadow-lg backdrop-blur-xs transition hover:bg-white/20 active:scale-[0.98]"
              >
                <User size={20} />
                <span>{s.registerBtn}</span>
                <ArrowRight size={18} />
              </button>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-200/75 hover:text-white transition"
                >
                  <ArrowLeft size={13} />
                  <span>Back to landing page</span>
                </Link>
              </div>
            </div>
          )}

          {/* Login / Register Form */}
          {(mode === "login" || mode === "register") && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                {mode === "login" ? s.loginTitle : s.registerTitle}
              </h2>

              {mode === "register" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-emerald-200 drop-shadow-sm">
                    <User size={13} className="inline mr-1.5" />
                    {s.nameHint}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={s.namePlaceholder}
                    className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-3.5 text-sm font-medium text-white placeholder-white/50 backdrop-blur-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-200 drop-shadow-sm">
                  <Phone size={13} className="inline mr-1.5" />
                  {s.phoneHint}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={s.phonePlaceholder}
                  maxLength={10}
                  className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-3.5 text-sm font-medium text-white placeholder-white/50 backdrop-blur-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm font-medium text-red-200 backdrop-blur-xs">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition hover:bg-emerald-500 disabled:opacity-60 active:scale-[0.98]"
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <>
                    <span>{s.submit}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Toggle mode */}
              <button
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
                className="text-xs font-medium text-white/75 hover:text-white drop-shadow-md transition text-center"
              >
                {mode === "login" ? s.noAccount : s.hasAccount}
              </button>

              <button
                onClick={() => { setMode("choose"); setError(null); }}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-white/60 hover:text-white/90 drop-shadow-md transition"
              >
                <ArrowLeft size={13} />
                <span>{s.back}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 h-8 w-full" />
    </div>
  );
}
