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
        <Link href="/" className="group flex items-center gap-2.5 transition-all">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] backdrop-blur-md transition-all group-hover:scale-105 group-hover:bg-emerald-500/30">
            <Leaf size={20} strokeWidth={2.3} className="text-emerald-400 drop-shadow" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">AgriSurge</span>
            <span className="text-[10px] font-medium tracking-wide text-emerald-400/90 uppercase">Farmer Portal</span>
          </div>
        </Link>

        {/* Language Selector */}
        <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1.5 backdrop-blur-md border border-white/10 shadow-lg">
          <Globe size={13} className="ml-1.5 mr-0.5 text-emerald-400" />
          {LANG_OPTIONS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                language === l.code
                  ? "bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.4)]"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
      </div>

      {/* Center Content */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px] rounded-3xl border border-white/15 bg-black/40 p-6 sm:p-9 shadow-[0_8px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl">
          {/* Badge */}
          <div className="mb-4 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/50 px-3.5 py-1 text-[11px] font-semibold text-emerald-300 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{language === "mr" ? "शेतकरी सेवा केंद्र" : language === "hi" ? "किसान सेवा केंद्र" : "Smart Agriculture Hub"}</span>
            </span>
          </div>

          {/* Title */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-3xl">
              {s.title}
            </h1>
            <p className="mt-2 text-xs font-medium text-emerald-100/80 leading-relaxed sm:text-sm">
              {s.subtitle}
            </p>
          </div>

          {/* Choose Mode */}
          {mode === "choose" && (
            <div className="flex flex-col gap-3.5">
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="group flex items-center justify-between rounded-2xl bg-emerald-600/90 border border-emerald-400/30 px-5 py-4 text-sm font-bold text-white shadow-[0_4px_24px_rgba(5,150,105,0.35)] backdrop-blur-sm transition-all hover:bg-emerald-500 hover:shadow-[0_6px_28px_rgba(16,185,129,0.5)] active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 text-emerald-200">
                    <Phone size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">{s.loginBtn}</div>
                    <div className="text-[11px] font-normal text-emerald-100/80">
                      {language === "mr" ? "तुमच्या नोंदणीकृत नंबरने प्रवेश करा" : language === "hi" ? "अपने पंजीकृत नंबर से लॉगिन करें" : "Sign in with your mobile number"}
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 text-emerald-200" />
              </button>

              <button
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className="group flex items-center justify-between rounded-2xl bg-black/30 border border-white/15 px-5 py-4 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/50 hover:border-emerald-400/40 active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
                    <User size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">{s.registerBtn}</div>
                    <div className="text-[11px] font-normal text-white/60">
                      {language === "mr" ? "नवीन खाते तयार करा आणि मोफत वापरा" : language === "hi" ? "नया खाता बनाएं और सेवा शुरू करें" : "Create new account with clean workspace"}
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 text-white/70" />
              </button>

              <div className="mt-3 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition"
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
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-lg font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {mode === "login" ? s.loginTitle : s.registerTitle}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10.5px] font-medium text-emerald-300 border border-white/10">
                  {mode === "register" ? "New Account" : "Registered"}
                </span>
              </div>

              {mode === "register" && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                    <User size={13} className="text-emerald-400" />
                    <span>{s.nameHint}</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={s.namePlaceholder}
                    className="w-full rounded-xl bg-black/35 border border-white/15 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner outline-none transition-all focus:border-emerald-400 focus:bg-black/50 focus:ring-2 focus:ring-emerald-400/25"
                    autoComplete="name"
                  />
                  <div className="mt-1.5">
                    <SpeechInput onResult={(t) => setName(t)} className="border-white/20 text-white/90 hover:border-emerald-400 hover:text-emerald-300 bg-black/20" />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                  <Phone size={13} className="text-emerald-400" />
                  <span>{s.phoneHint}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={s.phonePlaceholder}
                  maxLength={10}
                  className="w-full rounded-xl bg-black/35 border border-white/15 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner outline-none transition-all focus:border-emerald-400 focus:bg-black/50 focus:ring-2 focus:ring-emerald-400/25"
                  autoComplete="tel"
                  inputMode="numeric"
                />
                <div className="mt-1.5">
                  <SpeechInput onResult={(t) => setPhone(t.replace(/\D/g, ""))} className="border-white/20 text-white/90 hover:border-emerald-400 hover:text-emerald-300 bg-black/20" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                  <Lock size={13} className="text-emerald-400" />
                  <span>{s.passwordHint}</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={s.passwordPlaceholder}
                  className="w-full rounded-xl bg-black/35 border border-white/15 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner outline-none transition-all focus:border-emerald-400 focus:bg-black/50 focus:ring-2 focus:ring-emerald-400/25"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-medium text-red-200 backdrop-blur-md flex items-start gap-2 shadow-sm">
                  <span className="text-red-400 font-bold shrink-0">!</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(5,150,105,0.4)] transition-all hover:bg-emerald-500 hover:shadow-[0_6px_24px_rgba(16,185,129,0.5)] disabled:opacity-60 active:scale-[0.99] cursor-pointer"
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
              <div className="mt-1 flex flex-col gap-2.5 text-center">
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError(null);
                  }}
                  className="text-xs font-medium text-emerald-300 hover:text-white transition cursor-pointer"
                >
                  {mode === "login" ? s.noAccount : s.hasAccount}
                </button>

                <button
                  onClick={() => {
                    setMode("choose");
                    setError(null);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>{s.back}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 pb-4 text-center text-xs font-medium text-white/60">
        AgriSurge · Smart Agricultural Decision Support
      </div>
    </div>
  );
}
