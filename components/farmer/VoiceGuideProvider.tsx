"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { Language } from "@/lib/farmer/types";
import { speakText, stopSpeech, getAvailableVoices } from "@/lib/farmer/speechHelper";

// ─── Local Storage Keys ─────────────────────────────────────────────────────
const VOICE_STORAGE_KEY = "agrisurge_voice_enabled";

// ─── Types ──────────────────────────────────────────────────────────────────

interface VoiceGuideCtx {
  /** Master toggle — is voice guide active? */
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;

  /** Active screen / step identifier */
  activeStep: string;
  setActiveStep: (step: string) => void;

  /** Speak arbitrary text in the current language */
  speak: (text: string, lang?: Language, onEnd?: () => void) => void;

  /** Stop any ongoing speech */
  stopSpeaking: () => void;

  /** Is the browser currently speaking? */
  isSpeaking: boolean;

  /** Narrate a step with friendly, human guidance voice */
  narrateStep: (stepKey?: string, lang?: Language) => void;

  /** Auto-narrate page on mount if voice mode is on */
  autoNarrate: (text: string, lang?: Language) => void;
}

const VoiceGuideContext = createContext<VoiceGuideCtx | null>(null);

// ─── Voice narration scripts for each screen / wizard step ───────────────────
const STEP_NARRATIONS: Record<string, Record<Language, string>> = {
  // ── Auth Page
  auth_choose: {
    mr: "नमस्कार शेतकरी बंधू! हे AgriSurge शेतकरी पोर्टल आहे. तुमचे मोबाईलवरून आधीच खाते असल्यास वरचे हिरवे 'लॉगिन' बटण दाबा. नवीन असल्यास खालचे 'नवीन नोंदणी' बटण दाबा.",
    hi: "नमस्ते किसान भाई! यह AgriSurge किसान पोर्टल है। अगर आपका पहले से खाता है तो ऊपर हरा 'लॉगिन' बटन दबाएं। नया खाता बनाना है तो नीचे 'नया पंजीकरण' बटन दबाएं।",
    en: "Hello farmer! This is the AgriSurge Farmer Portal. If you already have an account, tap Login. If you are new, tap Register below.",
  },
  auth_login: {
    mr: "लॉगिन करण्यासाठी: पहिल्या खाण्यात तुमचा दहा अंकी मोबाईल नंबर टाका. दुसऱ्या खाण्यात तुमचा पासवर्ड टाका. मग हिरवे 'सुरू करा' बटण दाबा.",
    hi: "लॉगिन करने के लिए: पहले खाने में अपना दस अंकों का मोबाइल नंबर डालें। दूसरे खाने में अपना पासवर्ड डालें। फिर हरा 'शुरू करें' बटन दबाएं।",
    en: "To login: Enter your 10-digit mobile number in the first box, your password in the second box, then tap Get Started.",
  },
  auth_register: {
    mr: "नवीन नोंदणीसाठी: पहिल्या खाण्यात तुमचे पूर्ण नाव लिहा. दुसऱ्यात दहा अंकी मोबाईल नंबर टाका. तिसऱ्यात पासवर्ड ठरवा. माहिती बोलून सांगण्यासाठी माइक बटणही दाबू शकता.",
    hi: "नए पंजीकरण के लिए: पहले खाने में अपना पूरा नाम लिखें। दूसरे में दस अंकों का मोबाइल नंबर। तीसरे में पासवर्ड बनाएं। बोलकर बताने के लिए माइक बटन दबाएं।",
    en: "To register: Type your full name, 10-digit mobile number, and set a password. You can also tap the mic to speak.",
  },

  // ── Dashboard
  dashboard: {
    mr: "हे तुमचे मुख्य डॅशबोर्ड आहे. नवीन शेत मूल्यांकन सुरू करण्यासाठी मोठे हिरवे बटण दाबा. तुमच्या शेताचे GPS स्थान, हवामान, माती, आणि पीक शिफारस या सर्व गोष्टी AI करेल. मागील अहवाल पाहण्यासाठी इतिहास बटण दाबा.",
    hi: "यह आपका मुख्य डैशबोर्ड है। नया खेत मूल्यांकन शुरू करने के लिए बड़ा हरा बटन दबाएं। आपके खेत का GPS स्थान, मौसम, मिट्टी और फसल सिफारिश सब AI करेगा। पिछली रिपोर्ट देखने के लिए इतिहास बटन दबाएं।",
    en: "This is your main dashboard. Tap the green button to start a new farm assessment. The AI will analyze GPS, weather, soil, and crop suitability.",
  },

  // ── History View
  history: {
    mr: "येथे तुमचे सर्व मागील शेत मूल्यांकन अहवाल आहेत. कोणत्याही कार्डवर दाबून तुम्ही त्याचा सविस्तर अहवाल, निवडलेले पीक आणि विमा प्रीमियम पाहू शकता. डॅशबोर्डवर परत जाण्यासाठी वरील डावे बटण दाबा.",
    hi: "यहाँ आपके सभी पुराने खेत मूल्यांकन रिकॉर्ड हैं। किसी भी कार्ड पर टैप करके आप पूरी रिपोर्ट, चुनी फसल और बीमा प्रीमियम देख सकते हैं। डैशबोर्ड पर लौटने के लिए ऊपर बायाँ बटन दबाएं।",
    en: "Here are all your previous farm assessment records. Tap any card to review its full report, crop advisory, and insurance premium. Tap Back to return to Dashboard.",
  },

  // ── Detail / Report View
  detail: {
    mr: "हा तुमच्या शेताचा संपूर्ण AI अहवाल आहे. येथे निवडलेले पीक, शेताचे हवामान, मातीचा प्रकार आणि विमा प्रीमियमची सविस्तर माहिती दिलेली आहे. डॅशबोर्डवर परत जाण्यासाठी वरील 'डॅशबोर्डवर परत जा' बटण दाबा.",
    hi: "यह आपके खेत की पूरी AI रिपोर्ट है। यहाँ चुनी हुई फसल, खेत का मौसम, मिट्टी का प्रकार और बीमा प्रीमियम का पूरा विवरण है। डैशबोर्ड पर वापस जाने के लिए ऊपर 'डैशबोर्ड पर वापस जाएं' बटन दबाएं।",
    en: "This is your complete farm assessment report showing crop selection, weather metrics, soil profile, and insurance premium breakdown. Tap Back to return to Dashboard.",
  },

  // ── Wizard Step 1: Farmer Details
  details: {
    mr: "या पहिल्या टप्प्यात तुमची माहिती भरा. तुमचा जिल्हा, तालुका, आणि गाव निवडा. हे तुमच्या शेतासाठी अचूक हवामान व स्थानिक पीक सल्ला मिळवण्यासाठी आवश्यक आहे. नाव व गाव सांगण्यासाठी माइक बटण दाबा.",
    hi: "इस पहले चरण में अपनी जानकारी भरें। अपना जिला, तहसील और गांव चुनें। यह आपके खेत के सटीक मौसम व फसल सलाह के लिए जरूरी है। बोलने के लिए माइक बटन दबाएं।",
    en: "In step one, select your district, taluka, and village. This enables localized weather and agronomic advisory. Use the microphone to speak your name or village.",
  },

  // ── Wizard Step 2: Location
  location: {
    mr: "दुसऱ्या टप्प्यात तुमच्या शेताचे GPS स्थान घ्या. हिरवे 'स्थान शोधा' बटण दाबा. तुमचा फोन शेताचे अचूक अक्षांश व रेखांश स्वतः शोधेल. बाहेर शेतात उभे राहून हे करा.",
    hi: "दूसरे चरण में अपने खेत की GPS लोकेशन लें। हरा 'स्थान खोजें' बटन दबाएं। आपका फोन खेत की सटीक लोकेशन खुद ढूंढ लेगा। खेत में खड़े होकर यह बटन दबाएं।",
    en: "In step two, capture your farm's GPS location. Tap the green Detect Location button while standing in your farm.",
  },

  // ── Wizard Step 3: Photos
  photos: {
    mr: "तिसऱ्या टप्प्यात शेताचे दोन फोटो काढा. पहिले बटण दाबून शेताचा फोटो काढा, आणि दुसरे बटण दाबून मातीचा फोटो काढा. फोटोमुळे AI ला जमिनीची अचूक स्थिती समजते.",
    hi: "तीसरे चरण में खेत की दो फोटो लें। पहला बटन दबाकर खेत का फोटो और दूसरा दबाकर मिट्टी का फोटो लें। फोटो से AI जमीन की सही स्थिति समझता है।",
    en: "In step three, capture two photos — one of your farm landscape and one of the soil. This helps AI vision evaluate your field.",
  },

  // ── Wizard Step 4: Weather
  weather: {
    mr: "चौथ्या टप्प्यात हवामान माहिती आपोआप लोड होत आहे. भारतीय हवामान विभागाकडून थेट तापमान, पाऊस, आणि ऐतिहासिक पर्जन्यमान आकडे आले आहेत. माहिती तपासल्यावर खालील 'पुढे' बटण दाबा.",
    hi: "चौथे चरण में मौसम की जानकारी अपने आप लोड हो रही है। भारतीय मौसम विभाग (IMD) से सीधा तापमान, बारिश और पुराना डेटा आ चुका है। आगे बढ़ने के लिए 'आगे' बटन दबाएं।",
    en: "In step four, weather intelligence has loaded from IMD gridded datasets. Review the live metrics and historical trends, then tap Next.",
  },

  // ── Wizard Step 5: Farm & Soil
  soil: {
    mr: "पाचव्या टप्प्यात शेतीचे एकूण क्षेत्रफळ एकरमध्ये निवडा. मातीचा प्रकार — काळी, लाल किंवा दोमट निवडा, आणि सिंचनाची पद्धत निवडा. मग 'पुढे' बटण दाबा.",
    hi: "पांचवें चरण में खेत का कुल क्षेत्रफल एकड़ में चुनें। मिट्टी का प्रकार और सिंचाई का तरीका चुनें। फिर 'आगे' बटन दबाएं।",
    en: "In step five, enter your farm acreage, choose your soil type, and select irrigation method. Then tap Next.",
  },

  // ── Wizard Step 6: Crop Advice
  crops: {
    mr: "सहाव्या टप्प्यात AI ने तुमच्या जमिनीसाठी पाच सर्वोत्तम पिके शोधली आहेत. नफा, हवामान आणि पाणी गरजेनुसार प्रत्येक पिकाचे कार्ड पहा. तुम्हाला हवे असलेले पीक निवडण्यासाठी 'हे पीक निवडा' दाबा.",
    hi: "छठे चरण में AI ने आपकी जमीन के लिए 5 सबसे उपयुक्त फसलें सुझाई हैं। मुनाफा और मौसम के अनुसार कार्ड देखें। पसंद की फसल के कार्ड पर 'यह फसल चुनें' दबाएं।",
    en: "In step six, AI has evaluated suitable crops for your soil and climate. Review the recommendations and tap Select This Crop on your choice.",
  },

  // ── Wizard Step 7: Crop Guidance
  guidance: {
    mr: "सातव्या टप्प्यात तुमच्या पिकासाठी AI कृषी सल्ला आहे. खताचे वेळापत्रक, पाणी व्यवस्थापन, आणि कीड नियंत्रण माहिती दिली आहे. मोठ्याने ऐकण्यासाठी हिरवे 'ऐका' बटण दाबा.",
    hi: "सातवें चरण में आपकी फसल के लिए AI कृषि सलाह है। खाद, पानी और कीट नियंत्रण का पूरा शेड्यूल दिया गया है। जोर से सुनने के लिए हरा 'सुनें' बटन दबाएं।",
    en: "In step seven, review detailed agronomic guidance for fertilizer scheduling, irrigation intervals, and pest management. Tap Listen to hear it aloud.",
  },

  // ── Wizard Step 8: Premium & Save
  premium: {
    mr: "आठव्या टप्प्यात तुमच्या शेतीचा विमा प्रीमियम अंदाज तयार आहे. हे मूल्यांकन जतन करण्यासाठी खालील 'मूल्यांकन जतन करा' बटण दाबा. तुमचा अहवाल डॅशबोर्डवर सुरक्षित राहील.",
    hi: "आठवें चरण में आपके खेत का बीमा प्रीमियम अनुमान तैयार है। इसे सेव करने के लिए नीचे 'मूल्यांकन सहेजें' बटन दबाएं। आपकी रिपोर्ट सुरक्षित हो जाएगी।",
    en: "In step eight, your actuarial insurance premium is estimated. Tap Save Assessment to store your complete farm report.",
  },
};

// ─── Lang code mapping for Web Speech API ───────────────────────────────────
const LANG_CODES: Record<Language, string> = {
  mr: "mr-IN",
  hi: "hi-IN",
  en: "en-IN",
};

// ─── Provider Component ─────────────────────────────────────────────────────

export function VoiceGuideProvider({
  children,
  language,
}: {
  children: React.ReactNode;
  language: Language;
}) {
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(false);
  const [activeStep, setActiveStepState] = useState<string>("dashboard");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const currentLangRef = useRef<Language>(language);
  const activeStepRef = useRef<string>("dashboard");
  const voiceEnabledRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentLangRef.current = language;
  }, [language]);

  // Hydrate voice preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VOICE_STORAGE_KEY);
      if (saved === "true") {
        setVoiceEnabledState(true);
        voiceEnabledRef.current = true;
      }
    } catch {
      // ignore
    }
  }, []);

  // Preload voices on mount for snappy voice synthesis response
  useEffect(() => {
    getAvailableVoices();
  }, []);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // ── Text-to-Speech ──────────────────────────────────────────────────────
  const speak = useCallback(
    (text: string, lang?: Language, onEnd?: () => void) => {
      if (!text) return;
      const targetLang = lang || currentLangRef.current;
      speakText(text, {
        lang: targetLang,
        rate: 0.85,
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          onEnd?.();
        },
        onError: () => {
          setIsSpeaking(false);
          onEnd?.();
        },
      });
    },
    []
  );

  const stopSpeaking = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
  }, []);

  // ── Step narration (uses pre-written scripts) ─────────────────────────
  const narrateStep = useCallback(
    (stepKey?: string, lang?: Language) => {
      const targetKey = stepKey || activeStepRef.current;
      const script = STEP_NARRATIONS[targetKey];
      const targetLang = lang || currentLangRef.current;

      if (script) {
        const text = script[targetLang] || script.en;
        speak(text, targetLang);
      }
    },
    [speak]
  );

  // ── Set active step with automatic voice narration and STRICT LOOP GUARD ─
  const setActiveStep = useCallback(
    (step: string) => {
      // CRITICAL: Prevent re-running if step is already the active step!
      if (activeStepRef.current === step) return;

      activeStepRef.current = step;
      setActiveStepState(step);

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      // If voice guide is enabled, auto-narrate this new step after UI renders
      if (voiceEnabledRef.current) {
        debounceTimerRef.current = setTimeout(() => {
          narrateStep(step, currentLangRef.current);
        }, 400);
      }
    },
    [narrateStep]
  );

  // ── Toggle master voice switch ────────────────────────────────────────
  const setVoiceEnabled = useCallback(
    (enabled: boolean) => {
      voiceEnabledRef.current = enabled;
      setVoiceEnabledState(enabled);
      try {
        localStorage.setItem(VOICE_STORAGE_KEY, enabled ? "true" : "false");
      } catch {
        // ignore
      }

      if (enabled) {
        setTimeout(() => {
          narrateStep(activeStepRef.current, currentLangRef.current);
        }, 150);
      } else {
        stopSpeaking();
      }
    },
    [narrateStep, stopSpeaking]
  );

  // ── Auto-narrate custom text ──────────────────────────────────────────
  const autoNarrate = useCallback(
    (text: string, lang?: Language) => {
      if (voiceEnabledRef.current) {
        speak(text, lang || currentLangRef.current);
      }
    },
    [speak]
  );

  const contextValue = useMemo<VoiceGuideCtx>(
    () => ({
      voiceEnabled,
      setVoiceEnabled,
      activeStep,
      setActiveStep,
      speak,
      stopSpeaking,
      isSpeaking,
      narrateStep,
      autoNarrate,
    }),
    [
      voiceEnabled,
      setVoiceEnabled,
      activeStep,
      setActiveStep,
      speak,
      stopSpeaking,
      isSpeaking,
      narrateStep,
      autoNarrate,
    ]
  );

  return (
    <VoiceGuideContext.Provider value={contextValue}>
      {children}
    </VoiceGuideContext.Provider>
  );
}

export function useVoiceGuide(): VoiceGuideCtx {
  const ctx = useContext(VoiceGuideContext);
  if (!ctx)
    throw new Error("useVoiceGuide must be used inside <VoiceGuideProvider>");
  return ctx;
}

export { STEP_NARRATIONS };
