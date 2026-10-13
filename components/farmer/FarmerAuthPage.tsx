"use client";

import { useState, useEffect } from "react";
import { useFarmer } from "./FarmerContext";
import { useVoiceGuide } from "./VoiceGuideProvider";
import { SpeechInput } from "./SpeechInput";
import { BackgroundVideo } from "@/components/landing/BackgroundVideo";
import { Leaf, Phone, User, Lock, ArrowRight, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";
import { Language } from "@/lib/farmer/types";

const LANG_OPTIONS: { code: Language; label: string; native: string }[] = [
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "en", label: "English", native: "English" },
];

type AuthMode = "choose" | "login" | "register";

export function FarmerAuthPage() {
  const { setFarmer, setLanguage, language, resetAssessment } = useFarmer();
  const { setActiveStep } = useVoiceGuide();
  const [mode, setMode] = useState<AuthMode>("choose");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync active step to Voice Guide on mode change
  useEffect(() => {
    const key = mode === "choose" ? "auth_choose" : mode === "login" ? "auth_login" : "auth_register";
    setActiveStep(key);
  }, [mode, setActiveStep]);

  const ui = {
    mr: {
      title: "शेतकरी पोर्टल",
      subtitle: "AI-आधारित पीक शिफारस आणि विमा प्रीमियम माहिती",
      loginBtn: "लॉगिन करा",
      registerBtn: "नवीन नोंदणी करा",
      loginTitle: "शेतकरी लॉगिन",
      registerTitle: "नवीन शेतकरी नोंदणी",
      phonePlaceholder: "मोबाईल नंबर (10 अंक)",
      namePlaceholder: "तुमचे पूर्ण नाव",
      passwordPlaceholder: "तुमचा पासवर्ड टाका",
      submit: "सुरू करा",
      back: "मागे जा",
      phoneHint: "मोबाईल नंबर टाका",
      nameHint: "आपले संपूर्ण नाव लिहा",
      passwordHint: "खाते पासवर्ड",
      noAccount: "नोंदणी नाही? नवीन खाते तयार करा →",
      hasAccount: "आधीच नोंदणी आहे? लॉगिन करा →",
    },
    hi: {
      title: "किसान पोर्टल",
      subtitle: "AI आधारित फसल सिफारिश और बीमा प्रीमियम जानकारी",
      loginBtn: "लॉगिन करें",
      registerBtn: "नया पंजीकरण करें",
      loginTitle: "किसान लॉगिन",
      registerTitle: "नया किसान पंजीकरण",
      phonePlaceholder: "मोबाइल नंबर (10 अंक)",
      namePlaceholder: "आपका पूरा नाम",
      passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
      submit: "शुरू करें",
      back: "वापस जाएं",
      phoneHint: "मोबाइल नंबर दर्ज करें",
      nameHint: "अपना पूरा नाम लिखें",
      passwordHint: "खाता पासवर्ड",
      noAccount: "पंजीकरण नहीं? नया खाता बनाएं →",
      hasAccount: "पहले से पंजीकृत? लॉगिन करें →",
    },
    en: {
      title: "Farmer Portal",
      subtitle: "AI-powered crop recommendations and insurance premium guidance",
      loginBtn: "Login",
      registerBtn: "Register",
      loginTitle: "Farmer Login",
      registerTitle: "New Farmer Registration",
      phonePlaceholder: "Mobile number (10 digits)",
      namePlaceholder: "Your full name",
      passwordPlaceholder: "Enter your password",
      submit: "Get Started",
      back: "Go Back",
      phoneHint: "Enter mobile number",
      nameHint: "Enter your full name",
      passwordHint: "Account password",
      noAccount: "Not registered? Create a new account →",
      hasAccount: "Already registered? Login →",
    },
  };

  const s = ui[language];

  const handleSubmit = async () => {
    setError(null);
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError(
        language === "mr"
          ? "१० अंकी मोबाईल नंबर टाका."
          : language === "hi"
          ? "10 अंकों का नंबर दर्ज करें।"
          : "Enter a valid 10-digit mobile number."
      );
      return;
    }

    if (!password.trim()) {
      setError(
        language === "mr"
          ? "पासवर्ड टाकणे आवश्यक आहे."
          : language === "hi"
          ? "पासवर्ड दर्ज करना आवश्यक है।"
          : "Password is required."
      );
      return;
    }

    if (mode === "register" && name.trim().length < 2) {
      setError(
        language === "mr"
          ? "तुमचे नाव टाका."
          : language === "hi"
          ? "अपना नाम दर्ज करें।"
          : "Enter your name."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/farmer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode === "register" ? "register" : "login",
          name: name.trim(),
          phone: cleanPhone,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // If user registers fresh new account: restart all assessment and progress details from zero
      const isFresh = mode === "register" || Boolean(data.isNew);
      if (isFresh) {
        resetAssessment();
      }

      setFarmer(
        {
          id: data.farmer.id,
          name: data.farmer.name,
          phone: cleanPhone,
          district: data.farmer.region || "",
          taluka: "",
          village: "",
          language,
        },
        isFresh
      );
    } catch (err) {
      console.error("Auth error:", err);
      setError(
        language === "mr"
          ? "काहीतरी चूक झाली. पुन्हा प्रयत्न करा."
          : language === "hi"
          ? "कुछ गलत हुआ। पुनः प्रयास करें।"
          : "Something went wrong. Please try again."
      );
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
        <div className="w-full max-w-lg rounded-3xl border border-emerald-500/20 bg-slate-950/75 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
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
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(5,150,105,0.4)] transition hover:bg-emerald-500 active:scale-[0.98] cursor-pointer"
              >
                <Phone size={20} />
                <span>{s.loginBtn}</span>
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className="flex items-center justify-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-6 py-4 text-base font-bold text-white shadow-lg backdrop-blur-xs transition hover:bg-white/20 active:scale-[0.98] cursor-pointer"
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                  {mode === "login" ? s.loginTitle : s.registerTitle}
                </h2>
                <span className="text-[11px] font-medium text-emerald-300/80">
                  {mode === "register" ? "Fresh Account" : "Secure Login"}
                </span>
              </div>

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
                  <div className="mt-1.5">
                    <SpeechInput onResult={(t) => setName(t)} className="border-white/25 text-white hover:border-emerald-400 hover:text-emerald-300" />
                  </div>
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
                <div className="mt-1.5">
                  <SpeechInput onResult={(t) => setPhone(t.replace(/\D/g, ""))} className="border-white/25 text-white hover:border-emerald-400 hover:text-emerald-300" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-emerald-200 drop-shadow-sm">
                  <Lock size={13} className="inline mr-1.5" />
                  {s.passwordHint}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={s.passwordPlaceholder}
                  className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-3.5 text-sm font-medium text-white placeholder-white/50 backdrop-blur-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 transition"
                  autoComplete="current-password"
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
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition hover:bg-emerald-500 disabled:opacity-60 active:scale-[0.98] cursor-pointer"
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
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError(null);
                }}
                className="text-xs font-medium text-white/75 hover:text-white drop-shadow-md transition text-center cursor-pointer"
              >
                {mode === "login" ? s.noAccount : s.hasAccount}
              </button>

              <button
                onClick={() => {
                  setMode("choose");
                  setError(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-white/60 hover:text-white/90 drop-shadow-md transition cursor-pointer"
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
