"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useFarmer } from "./FarmerContext";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { stopSpeech, playMicSound } from "@/lib/farmer/speechHelper";

const LANG_CODES: Record<string, string> = {
  mr: "mr-IN",
  hi: "hi-IN",
  en: "en-IN",
};

/**
 * SpeechInput — Self-contained microphone input component.
 * Attaches beside any input field. Listens for speech in Marathi, Hindi, or English,
 * provides auditory feedback, and populates transcribed text.
 */
export function SpeechInput({
  onResult,
  placeholder,
  className = "",
}: {
  onResult: (text: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { language } = useFarmer();
  const [isListening, setIsListening] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep latest onResult without causing re-subscriptions
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorFeedback(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorFeedback(null);
    }, 3500);
  }, []);

  const handleToggle = useCallback(() => {
    if (typeof window === "undefined") return;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      playMicSound("stop");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser.");
      const msg =
        language === "mr"
          ? "या ब्राउझरमध्ये व्हॉइस सपोर्ट नाही"
          : language === "hi"
          ? "इस ब्राउज़र में वॉइस सपोर्ट नहीं है"
          : "Voice recognition not supported in browser";
      showError(msg);
      playMicSound("error");
      return;
    }

    // Stop any ongoing TTS audio immediately so mic does not hear the computer's speaker
    stopSpeech();

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      // Use mr-IN for Marathi, hi-IN for Hindi, en-IN for English
      recognition.lang = LANG_CODES[language] || "mr-IN";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorFeedback(null);
        playMicSound("start");
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const finalTranscript = event.results[0][0].transcript.trim();
          if (finalTranscript) {
            onResultRef.current(finalTranscript);
            playMicSound("stop");
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        const errType = e?.error;
        if (errType === "not-allowed") {
          playMicSound("error");
          showError(
            language === "mr"
              ? "माइक परवानगी नाकारली"
              : language === "hi"
              ? "माइक की अनुमति नहीं दी गई"
              : "Microphone permission denied"
          );
        } else if (errType === "no-speech") {
          // Softly ignored or show brief prompt
          showError(
            language === "mr"
              ? "आवाज आला नाही, पुन्हा बोला"
              : language === "hi"
              ? "आवाज़ नहीं आई, फिर बोलें"
              : "No speech heard, try again"
          );
        } else if (errType === "network") {
          playMicSound("error");
          showError(
            language === "mr"
              ? "इंटरनेट अडचण"
              : language === "hi"
              ? "इंटरनेट समस्या"
              : "Network error"
          );
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Error starting speech recognition:", err);
      setIsListening(false);
      playMicSound("error");
    }
  }, [isListening, language, showError]);

  const labels = {
    mr: { tap: "बोला", stop: "थांबा", hint: "माइक दाबा आणि बोलून सांगा", listening: "ऐकत आहे..." },
    hi: { tap: "बोलें", stop: "रुकें", hint: "माइक दबाएं और बोलकर बताएं", listening: "सुन रहा है..." },
    en: { tap: "Speak", stop: "Stop", hint: "Tap the mic and speak", listening: "Listening..." },
  };
  const t = labels[language] || labels.mr;

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        title={isListening ? t.stop : (placeholder || t.hint)}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition active:scale-95 ${
          isListening
            ? "bg-red-600 text-white shadow-md animate-pulse ring-2 ring-red-400/40"
            : "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:border-emerald-600 hover:text-emerald-700"
        } ${className}`}
      >
        {isListening ? (
          <>
            <MicOff size={14} />
            <span>{t.stop}</span>
            <span className="flex gap-0.5 ml-1">
              <span className="inline-block w-1 h-2 bg-white rounded-full animate-pulse" />
              <span className="inline-block w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: "75ms" }} />
              <span className="inline-block w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
            </span>
          </>
        ) : (
          <>
            <Mic size={14} />
            <span>{t.tap}</span>
          </>
        )}
      </button>

      {/* Ephemeral Feedback Toast for voice errors */}
      {errorFeedback && (
        <div className="absolute left-0 top-full mt-1.5 z-30 flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-red-950/90 border border-red-500/40 px-2.5 py-1 text-[10px] font-semibold text-red-200 shadow-lg animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}
    </div>
  );
}
