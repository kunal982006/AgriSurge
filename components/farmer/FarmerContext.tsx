"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  Language,
  FarmerProfile,
  AssessmentData,
  FarmLocation,
  FarmPhotos,
  WeatherData,
  SoilInputs,
  CropRecommendation,
  STRINGS,
  UIStrings,
} from "@/lib/farmer/types";

const SESSION_KEY = "agrisurge_farmer_session";

type FarmerCtx = {
  farmer: FarmerProfile | null;
  setFarmer: (f: FarmerProfile | null) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: UIStrings;
  assessment: AssessmentData;
  updateAssessment: (patch: Partial<AssessmentData>) => void;
  resetAssessment: () => void;
  logout: () => void;
  isLoggedIn: boolean;
};

const DEFAULT_SOIL: SoilInputs = {
  areaAcres: 2.0,
  irrigationType: "Rainfed",
  soilType: "Black Soil",
};

function emptyAssessment(farmer: FarmerProfile): AssessmentData {
  return {
    farmer,
    location: null,
    photos: {},
    weather: null,
    soilInputs: DEFAULT_SOIL,
    recommendations: [],
    selectedCrop: null,
    premiumINR: null,
    premiumDetails: null,
  };
}

const FarmerContext = createContext<FarmerCtx | null>(null);

export function FarmerProvider({ children }: { children: React.ReactNode }) {
  const [farmer, setFarmerState] = useState<FarmerProfile | null>(null);
  const [language, setLanguageState] = useState<Language>("mr");
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session.farmer) {
          setFarmerState(session.farmer);
          setLanguageState(session.language || "mr");
          setAssessment(session.assessment || emptyAssessment(session.farmer));
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever session changes
  useEffect(() => {
    if (!hydrated) return;
    if (farmer) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ farmer, language, assessment })
      );
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [farmer, language, assessment, hydrated]);

  const setFarmer = useCallback((f: FarmerProfile | null) => {
    setFarmerState(f);
    if (f && !assessment) {
      setAssessment(emptyAssessment(f));
    }
  }, [assessment]);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
  }, []);

  const updateAssessment = useCallback((patch: Partial<AssessmentData>) => {
    setAssessment((prev) => {
      if (!prev) return prev;
      return { ...prev, ...patch };
    });
  }, []);

  const resetAssessment = useCallback(() => {
    if (farmer) {
      setAssessment(emptyAssessment(farmer));
    }
  }, [farmer]);

  const logout = useCallback(() => {
    setFarmerState(null);
    setAssessment(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const t = STRINGS[language];

  if (!hydrated) {
    return null; // prevent SSR/hydration mismatch
  }

  return (
    <FarmerContext.Provider
      value={{
        farmer,
        setFarmer,
        language,
        setLanguage,
        t,
        assessment: assessment || emptyAssessment({ name: "", phone: "", district: "", taluka: "", village: "", language }),
        updateAssessment,
        resetAssessment,
        logout,
        isLoggedIn: !!farmer,
      }}
    >
      {children}
    </FarmerContext.Provider>
  );
}

export function useFarmer(): FarmerCtx {
  const ctx = useContext(FarmerContext);
  if (!ctx) throw new Error("useFarmer must be used inside <FarmerProvider>");
  return ctx;
}
