import { Language } from "./types";

/**
 * Robust Speech Synthesis & Voice Recognition Helper for AgriSurge.
 *
 * Problem Solved:
 * Most Windows/Desktop Chromium browsers do NOT have a pre-installed native Marathi ('mr-IN')
 * speech synthesis voice. Setting `utterance.lang = 'mr-IN'` without an assigned voice causes
 * the browser's speech synthesis engine to fail silently (remaining completely mute).
 *
 * Solution:
 * 1. Both Marathi (मराठी) and Hindi (हिंदी) use the identical Devanagari (देवनागरी) script.
 * 2. If a dedicated Marathi voice exists in the OS/browser, we prioritize it.
 * 3. If no Marathi voice exists, we intelligently fall back to a high-quality Indic Devanagari
 *    voice (e.g. 'Google हिन्दी', 'Microsoft Swara Online', or 'hi-IN').
 * 4. We align both `utterance.voice` AND `utterance.lang` to match the selected voice so that
 *    the browser engine never rejects the utterance due to language mismatch.
 * 5. We include Chromium keepalive logic to prevent long speech from pausing after 14 seconds.
 * 6. We provide soft audio cues (Web Audio API) for mic start/stop so farmers get clear audible feedback.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];
let voiceLoadingPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let keepAliveTimer: NodeJS.Timeout | null = null;

/**
 * Retrieve all available browser voices asynchronously with onvoiceschanged support.
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  if (cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) {
    cachedVoices = existing;
    return Promise.resolve(existing);
  }

  if (!voiceLoadingPromise) {
    voiceLoadingPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
      let resolved = false;

      const handleVoicesChanged = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0 && !resolved) {
          resolved = true;
          cachedVoices = v;
          window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
          resolve(v);
        }
      };

      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

      // Fallback timeout in case voiceschanged doesn't fire
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const v = window.speechSynthesis.getVoices();
          cachedVoices = v;
          resolve(v);
        }
      }, 400);
    });
  }

  return voiceLoadingPromise;
}

/**
 * Automatically find the highest-quality voice for the requested language.
 */
export function getBestVoiceForLanguage(
  lang: Language | string,
  voices: SpeechSynthesisVoice[] = cachedVoices
): { voice: SpeechSynthesisVoice | null; voiceLang: string } {
  if (!voices || voices.length === 0) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      voices = window.speechSynthesis.getVoices();
      cachedVoices = voices;
    }
  }

  const normLang = (lang || "mr").toLowerCase();

  // ── MARATHI ─────────────────────────────────────────────────────────────
  if (normLang === "mr" || normLang.startsWith("mr")) {
    // 1. Direct Marathi voice (e.g. mobile Chrome or Windows with Marathi pack)
    const marathiVoice = voices.find(
      (v) =>
        v.lang?.toLowerCase().startsWith("mr") ||
        v.name?.toLowerCase().includes("marathi") ||
        v.name?.includes("मराठी")
    );
    if (marathiVoice) {
      return { voice: marathiVoice, voiceLang: marathiVoice.lang || "mr-IN" };
    }

    // 2. Indic Devanagari Voice (Hindi) — Perfect phonetic match for Devanagari Marathi script
    const hindiVoice = voices.find(
      (v) =>
        v.lang?.toLowerCase() === "hi-in" ||
        v.lang?.toLowerCase().startsWith("hi") ||
        v.name?.toLowerCase().includes("hindi") ||
        v.name?.includes("हिन्दी") ||
        v.name?.toLowerCase().includes("swara") ||
        v.name?.toLowerCase().includes("madhur") ||
        v.name?.toLowerCase().includes("kalpana")
    );
    if (hindiVoice) {
      // Must match voiceLang to the Hindi voice's lang so browser engine accepts utterance!
      return { voice: hindiVoice, voiceLang: hindiVoice.lang || "hi-IN" };
    }

    // 3. Any Indian regional voice
    const indicVoice = voices.find(
      (v) =>
        v.lang?.toLowerCase().includes("-in") ||
        v.name?.toLowerCase().includes("india")
    );
    if (indicVoice) {
      return { voice: indicVoice, voiceLang: indicVoice.lang || "hi-IN" };
    }

    // 4. Default voice
    const defVoice = voices.find((v) => v.default) || voices[0] || null;
    return { voice: defVoice, voiceLang: defVoice?.lang || "hi-IN" };
  }

  // ── HINDI ───────────────────────────────────────────────────────────────
  if (normLang === "hi" || normLang.startsWith("hi")) {
    const hindiVoice = voices.find(
      (v) =>
        v.lang?.toLowerCase().startsWith("hi") ||
        v.name?.toLowerCase().includes("hindi") ||
        v.name?.includes("हिन्दी")
    );
    if (hindiVoice) {
      return { voice: hindiVoice, voiceLang: hindiVoice.lang || "hi-IN" };
    }

    const indicVoice = voices.find(
      (v) =>
        v.lang?.toLowerCase().includes("-in") ||
        v.name?.toLowerCase().includes("india")
    );
    if (indicVoice) {
      return { voice: indicVoice, voiceLang: indicVoice.lang || "hi-IN" };
    }

    const defVoice = voices.find((v) => v.default) || voices[0] || null;
    return { voice: defVoice, voiceLang: defVoice?.lang || "hi-IN" };
  }

  // ── ENGLISH ─────────────────────────────────────────────────────────────
  const indianEngVoice = voices.find(
    (v) =>
      v.lang?.toLowerCase() === "en-in" ||
      (v.lang?.toLowerCase().startsWith("en") && v.name?.toLowerCase().includes("india"))
  );
  if (indianEngVoice) {
    return { voice: indianEngVoice, voiceLang: "en-IN" };
  }

  const engVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("en"));
  if (engVoice) {
    return { voice: engVoice, voiceLang: engVoice.lang || "en-US" };
  }

  const defVoice = voices.find((v) => v.default) || voices[0] || null;
  return { voice: defVoice, voiceLang: defVoice?.lang || "en-US" };
}

/**
 * Cleans raw text for speech synthesis:
 * Strips markdown symbols, URLs, asterisks, hashtags, emojis and extra spacing
 * to avoid stuttering or "asterisk asterisk" announcements.
 */
export function sanitizeTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/[*#_~`>]/g, " ") // Strip markdown characters
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Strip markdown links, keep text
    .replace(/https?:\/\/\S+/g, "") // Strip URLs
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "") // Strip emojis
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

export interface SpeakOptions {
  lang?: Language | string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Speaks the given text using the best matching speech synthesis voice.
 * Prevents muting by assigning fallback Indic Devanagari voices for Marathi.
 */
export async function speakText(
  text: string,
  options: SpeakOptions = {}
): Promise<() => void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options.onError?.(new Error("Speech synthesis not supported in this browser"));
    return () => {};
  }

  const cleanText = sanitizeTextForSpeech(text);
  if (!cleanText) {
    options.onEnd?.();
    return () => {};
  }

  // Ensure any current speech is cleanly stopped
  stopSpeech();

  // Load voices if not cached
  const voices = await getAvailableVoices();
  const targetLang = (options.lang || "mr") as Language;
  const { voice, voiceLang } = getBestVoiceForLanguage(targetLang, voices);

  return new Promise<() => void>((resolve) => {
    // Small delay so speechSynthesis.cancel() settles cleanly in Chromium
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);

        if (voice) {
          utterance.voice = voice;
          utterance.lang = voiceLang;
        } else {
          // If no voice object was resolved, match to appropriate Indic code
          utterance.lang = targetLang === "mr" ? "hi-IN" : targetLang === "hi" ? "hi-IN" : "en-IN";
        }

        // Natural, clear pacing suitable for Indian farmers
        utterance.rate = options.rate ?? (targetLang === "mr" ? 0.85 : targetLang === "hi" ? 0.88 : 0.92);
        utterance.pitch = options.pitch ?? 1.0;

        utterance.onstart = () => {
          // Chromium Keepalive: Resume every 8s to prevent 14s silence bug
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          keepAliveTimer = setInterval(() => {
            if (window.speechSynthesis && window.speechSynthesis.speaking) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }, 8000);

          options.onStart?.();
        };

        const cleanup = () => {
          if (keepAliveTimer) {
            clearInterval(keepAliveTimer);
            keepAliveTimer = null;
          }
        };

        utterance.onend = () => {
          cleanup();
          options.onEnd?.();
        };

        utterance.onerror = (e) => {
          cleanup();
          // Ignore interruption events from intentional cancel()
          if (e.error !== "interrupted" && e.error !== "canceled") {
            console.warn("Speech synthesis error event:", e);
            options.onError?.(e);
          }
          options.onEnd?.();
        };

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);

        resolve(() => stopSpeech());
      } catch (err) {
        console.warn("Failed to invoke speech synthesis:", err);
        options.onError?.(err);
        options.onEnd?.();
        resolve(() => {});
      }
    }, 60);
  });
}

/**
 * Cancel any ongoing speech and clear keepalive timers.
 */
export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

/**
 * Web Audio API gentle sound cue for microphone interactions.
 * Informs the farmer audibly when the mic is activated or deactivated.
 */
export function playMicSound(type: "start" | "stop" | "error"): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "start") {
      // Gentle ascending chime (440Hz -> 660Hz)
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === "stop") {
      // Soft descending tone (660Hz -> 440Hz)
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      // Muted soft double buzz for errors
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Ignore audio context errors if sound is disabled in browser
  }
}
