"use client";

import { useState, useEffect } from "react";
import { FarmerProvider, useFarmer } from "./FarmerContext";
import { FarmerAuthPage } from "./FarmerAuthPage";
import { FarmerDashboard } from "./FarmerDashboard";
import { AssessmentWizard } from "./AssessmentWizard";
import { AssessmentDetailView } from "./AssessmentDetailView";
import { FarmerAiChatModal, FloatingFarmerChatButton } from "./FarmerAiChatModal";
import { VoiceGuideProvider, useVoiceGuide } from "./VoiceGuideProvider";
import { VoiceGuideOverlay } from "./VoiceGuideOverlay";
import { ArrowLeft, MapPin, Sprout, Loader2, ArrowRight } from "lucide-react";

interface SavedAssessment {
  id: number;
  assessmentCode: string;
  farmerId: number;
  selectedCrop: string;
  crop?: string;
  farmCode?: string;
  locationName?: string | null;
  location?: string | null;
  areaAcres: string;
  soilType: string | null;
  irrigationType: string | null;
  premiumEstimate: string;
  createdAt: string;
}

const VIEW_STORAGE_KEY = "agrisurge_farmer_view";
const DETAIL_ID_KEY = "agrisurge_farmer_detail_id";

function FarmerPortalContent() {
  const { farmer, language } = useFarmer();
  const { setActiveStep } = useVoiceGuide();

  // Hydrate view from localStorage so refresh / retry preserves current page
  const [view, setViewState] = useState<"dashboard" | "wizard" | "history" | "detail">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(VIEW_STORAGE_KEY);
        if (saved && ["dashboard", "wizard", "history", "detail"].includes(saved)) {
          return saved as "dashboard" | "wizard" | "history" | "detail";
        }
      } catch {
        // ignore
      }
    }
    return "dashboard";
  });

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(DETAIL_ID_KEY);
        if (saved) return saved;
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [historyItems, setHistoryItems] = useState<SavedAssessment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // View navigation helper that persists state
  const navigateTo = (
    nextView: "dashboard" | "wizard" | "history" | "detail",
    detailId?: number | string | null
  ) => {
    setViewState(nextView);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, nextView);
      if (detailId !== undefined) {
        setSelectedAssessmentId(detailId);
        if (detailId) localStorage.setItem(DETAIL_ID_KEY, String(detailId));
        else localStorage.removeItem(DETAIL_ID_KEY);
      }
    } catch {
      // ignore
    }
  };

  // Sync active step to Voice Guide on view change
  useEffect(() => {
    if (!farmer) {
      setActiveStep("auth_choose");
    } else if (view === "dashboard") {
      setActiveStep("dashboard");
    } else if (view === "history") {
      setActiveStep("history");
    } else if (view === "detail") {
      setActiveStep("detail");
    }
    // When view === "wizard", AssessmentWizard automatically updates activeStep to its specific sub-step
  }, [view, farmer, setActiveStep]);

  useEffect(() => {
    if (view === "history" && farmer?.id) {
      setLoadingHistory(true);
      fetch(`/api/farmer/assessment?farmerId=${farmer.id}`)
        .then((r) => r.json())
        .then((data) => {
          setHistoryItems(data.assessments || []);
        })
        .catch(() => setHistoryItems([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [view, farmer?.id]);

  if (!farmer) {
    return (
      <>
        <FarmerAuthPage />
        <VoiceGuideOverlay />
      </>
    );
  }

  return (
    <>
      {view === "wizard" && (
        <AssessmentWizard onExit={() => navigateTo("dashboard")} />
      )}

      {view === "detail" && selectedAssessmentId && (
        <AssessmentDetailView
          assessmentId={selectedAssessmentId}
          farmerId={farmer.id}
          language={language}
          onBack={() => navigateTo("dashboard", null)}
        />
      )}

      {view === "dashboard" && (
        <FarmerDashboard
          onStartAssessment={() => navigateTo("wizard")}
          onViewHistory={() => navigateTo("history")}
          onViewDetail={(id) => {
            navigateTo("detail", id);
          }}
          onOpenChat={() => setIsChatOpen(true)}
        />
      )}

      {view === "history" && (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6">
            <button
              onClick={() => navigateTo("dashboard")}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition"
            >
              <ArrowLeft size={14} />
              <span>
                {language === "mr"
                  ? "डॅशबोर्डवर परत जा"
                  : language === "hi"
                  ? "डैशबोर्ड पर वापस जाएं"
                  : "Back to Dashboard"}
              </span>
            </button>
            <span className="text-sm font-bold text-[var(--color-text)]">
              {language === "mr"
                ? "मागील शेत मूल्यांकन इतिहास"
                : language === "hi"
                ? "पिछला खेत मूल्यांकन इतिहास"
                : "Farm Assessment History"}
            </span>
            <div className="w-16" />
          </header>

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {loadingHistory ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-emerald-700" size={32} />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center max-w-xl mx-auto">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Sprout size={28} />
                </div>
                <p className="text-base font-bold text-[var(--color-text)]">
                  {language === "mr"
                    ? "अद्याप कोणतेही मूल्यांकन जतन केलेले नाही."
                    : language === "hi"
                    ? "अभी तक कोई मूल्यांकन सहेजा नहीं गया है।"
                    : "No assessments saved yet."}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-dim)]">
                  {language === "mr"
                    ? "आपल्या शेताचे मूल्यांकन सुरू करा आणि AI शिफारसी मिळवा."
                    : language === "hi"
                    ? "अपने खेत का आकलन शुरू करें और AI सिफारिशें प्राप्त करें।"
                    : "Start an assessment to receive AI crop advice and insurance estimates."}
                </p>
                <button
                  onClick={() => navigateTo("wizard")}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition"
                >
                  <span>
                    {language === "mr"
                      ? "नवीन शेत मूल्यांकन सुरू करा"
                      : language === "hi"
                      ? "नया फार्म असेसमेंट शुरू करें"
                      : "Start Farm Assessment"}
                  </span>
                  <ArrowLeft className="rotate-180" size={14} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      navigateTo("detail", item.id);
                    }}
                    className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm hover:border-emerald-600 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <Sprout size={22} />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-[var(--color-text)]">
                              {item.selectedCrop || item.crop || "Crop Assessment"}
                            </h3>
                            <p className="text-[11px] text-[var(--color-text-dim)] font-mono">
                              {item.assessmentCode || item.farmCode || `ID: ${item.id}`}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-700/10 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                          {item.areaAcres}{" "}
                          {language === "mr" ? "एकर" : language === "hi" ? "एकड़" : "Acres"}
                        </span>
                      </div>

                      {(item.locationName || item.location) && (
                        <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--color-text-dim)]">
                          <MapPin size={14} className="shrink-0 text-emerald-700 dark:text-emerald-400" />
                          <span className="truncate">{item.locationName || item.location}</span>
                        </div>
                      )}

                      {item.premiumEstimate && (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--color-surface-raised)] px-3 py-2 text-xs">
                          <span className="text-[var(--color-text-dim)]">
                            {language === "mr" ? "वार्षिक प्रीमियम" : language === "hi" ? "वार्षिक प्रीमियम" : "Premium Estimate"}
                          </span>
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                            ₹{Number(item.premiumEstimate).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-dim)]">
                      <span className="font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <span>{language === "mr" ? "अहवाल पहा" : language === "hi" ? "रिपोर्ट देखें" : "View Report"}</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Krishi Mitra AI Assistant Button & Modal (Powered by Gemini 3.8) */}
      <FloatingFarmerChatButton onClick={() => setIsChatOpen(true)} />
      <FarmerAiChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Voice Guide Overlay — single global controller reading activeStep from context */}
      <VoiceGuideOverlay />
    </>
  );
}

function FarmerPortalInner() {
  const { language } = useFarmer();
  return (
    <VoiceGuideProvider language={language}>
      <FarmerPortalContent />
    </VoiceGuideProvider>
  );
}

export function FarmerPortal() {
  return (
    <FarmerProvider>
      <FarmerPortalInner />
    </FarmerProvider>
  );
}
