"use client";

import { useState, useRef, useEffect } from "react";
import { useFarmer } from "./FarmerContext";
import { SpeechInput } from "./SpeechInput";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  HelpCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  MessageSquare
} from "lucide-react";
import { Language } from "@/lib/farmer/types";
import { speakText, stopSpeech } from "@/lib/farmer/speechHelper";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS: Record<Language, string[]> = {
  mr: [
    "माझ्या पिकाला पहिले खत कधी द्यावे?",
    "कीड व बोंडअळी नियंत्रणासाठी सेंद्रिय उपाय काय?",
    "कमी पावसात सिंचनाचे नियोजन कसे करावे?",
    "विमा दाव्यासाठी कोणती कागदपत्रे लागतात?",
  ],
  hi: [
    "मेरी फसल के लिए पहला उर्वरक कब डालें?",
    "कीट व इल्ली नियंत्रण के जैविक उपाय बताएं?",
    "कम बारिश में सिंचाई प्रबंधन कैसे करें?",
    "बीमा क्लेम के लिए कौन से दस्तावेज चाहिए?",
  ],
  en: [
    "What is the best fertilizer timing for my crop?",
    "How to manage pest and disease organically?",
    "Optimal irrigation scheduling under low rainfall?",
    "What are key parametric insurance claim triggers?",
  ],
};

const TITLES: Record<Language, { title: string; subtitle: string; placeholder: string; disclaimer: string }> = {
  mr: {
    title: "AgriSurge AI Advisor",
    subtitle: "बुद्धिमत्तापूर्ण शेती व पीक सल्लागार",
    placeholder: "आपला शेतीविषयक प्रश्न येथे विचारा...",
    disclaimer: "कृषी विद्यापीठ व IMD माहितीवर आधारित अचूक सल्ला.",
  },
  hi: {
    title: "AgriSurge AI Advisor",
    subtitle: "कृषि एवं फसल सुरक्षा सलाहकार",
    placeholder: "अपना कृषि संबंधी प्रश्न यहाँ पूछें...",
    disclaimer: "कृषि विश्वविद्यालय व IMD डेटा पर आधारित सटीक सलाह।",
  },
  en: {
    title: "AgriSurge AI Advisor",
    subtitle: "Intelligent Agricultural & Crop Protection Advisor",
    placeholder: "Ask any agronomic or crop protection question...",
    disclaimer: "Real-time agronomic guidance aligned with ICAR & IMD datasets.",
  },
};

export function FarmerAiChatModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { farmer, language, assessment } = useFarmer();
  const t = TITLES[language];
  const quickPrompts = QUICK_PROMPTS[language];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting on first open
  useEffect(() => {
    if (messages.length === 0) {
      const greetingText = {
        mr: `नमस्ते ${farmer?.name || "शेतकरी बंधू"}! मी आपला AgriSurge AI Advisor आहे. तुमच्या ${assessment.selectedCrop?.cropMr || "शेती"} पिकाविषयी, खत व्यवस्थापन, कीड नियंत्रण किंवा हवामानाविषयी काहीही विचारा.`,
        hi: `नमस्ते ${farmer?.name || "किसान भाई"}! मैं आपका AgriSurge AI Advisor हूँ। आपकी ${assessment.selectedCrop?.cropHi || "खेती"} फसल, खाद, कीट नियंत्रण या मौसम के बारे में कोई भी प्रश्न पूछें।`,
        en: `Hello ${farmer?.name || "Farmer"}! I am your AgriSurge AI Advisor. Ask me anything about ${assessment.selectedCrop?.cropEn || "your crop"}, fertilizer schedules, pest control, or weather management.`,
      }[language];

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: greetingText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [language, farmer?.name, assessment.selectedCrop]);

  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
      setActiveSpeechId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || input).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          context: {
            farmerName: farmer?.name,
            crop: assessment.selectedCrop?.cropEn,
            district: farmer?.district,
            soilType: assessment.soilInputs.soilType,
            irrigationType: assessment.soilInputs.irrigationType,
            temperatureC: assessment.weather?.temperatureC,
            humidityPct: assessment.weather?.humidityPct,
            rainfallMm: assessment.weather?.rainfallMm,
            language,
          },
          history: chatHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to get AI response.");
      }

      const botMsg: ChatMessage = {
        id: "a-" + Date.now(),
        role: "assistant",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        text: language === "mr"
          ? "माफ करा, संपर्क साधण्यात अडचण आली. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा."
          : language === "hi"
          ? "क्षमा करें, प्रतिक्रिया प्राप्त करने में समस्या आई। कृपया पुनः प्रयास करें।"
          : "Sorry, could not connect to AgriSurge AI service. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (activeSpeechId === msgId) {
      stopSpeech();
      setActiveSpeechId(null);
      return;
    }

    setActiveSpeechId(msgId);
    speakText(text, {
      lang: language,
      onEnd: () => setActiveSpeechId(null),
      onError: () => setActiveSpeechId(null),
    });
  };

  const handleReset = () => {
    stopSpeech();
    setActiveSpeechId(null);
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl h-[92vh] sm:h-[680px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white shadow-md">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[var(--color-text)]">
                  {t.title}
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles size={11} />
                  <span>AI Active</span>
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-dim)] font-medium">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              title="Reset conversation"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick prompt chips */}
        <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)] shrink-0 flex items-center gap-1">
            <HelpCircle size={12} />
            <span>{language === "mr" ? "उदा." : language === "hi" ? "उदा." : "Suggested:"}</span>
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="shrink-0 rounded-full border border-emerald-600/20 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-3 py-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"}`}
              >
                {isBot && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm mt-0.5">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isBot
                      ? "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] shadow-sm"
                      : "bg-emerald-700 text-white shadow-md font-medium"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] opacity-70">
                    <span>{msg.timestamp}</span>
                    {isBot && (
                      <button
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {activeSpeechId === msg.id ? (
                          <>
                            <VolumeX size={12} />
                            <span>{language === "mr" ? "थांबवा" : language === "hi" ? "रोकें" : "Stop"}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} />
                            <span>{language === "mr" ? "ऐका" : language === "hi" ? "सुनें" : "Listen"}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {!isBot && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-border)] text-[var(--color-text)] shadow-sm mt-0.5">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-xs text-[var(--color-text-dim)]">
                <Loader2 size={14} className="animate-spin text-emerald-700" />
                <span>
                  {language === "mr"
                    ? "कृषी मित्र विचार करत आहे..."
                    : language === "hi"
                    ? "कृषि मित्र सोच रहा है..."
                    : "AgriSurge AI is thinking..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={loading}
              className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-emerald-600 focus:outline-none transition shadow-inner"
            />
            <SpeechInput onResult={(txt) => setInput(txt)} />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50 transition shadow-md"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>

          <p className="mt-2 text-center text-[10px] text-[var(--color-text-dim)]">
            {t.disclaimer}
          </p>
        </div>

      </div>
    </div>
  );
}

export function FloatingFarmerChatButton({ onClick }: { onClick: () => void }) {
  const { language } = useFarmer();
  const label = {
    mr: "AgriSurge AI",
    hi: "AgriSurge AI",
    en: "AgriSurge AI",
  }[language];

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-5 py-3 text-xs font-black text-white shadow-2xl hover:scale-105 active:scale-95 transition-all group ring-4 ring-emerald-500/20"
      aria-label="Open AgriSurge AI Advisor"
    >
      <div className="relative">
        <Bot size={18} />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
      </div>
      <span>{label}</span>
      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider">
        Advisor
      </span>
    </button>
  );
}
