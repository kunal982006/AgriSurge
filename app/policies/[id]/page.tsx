"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileCheck,
  FileSearch,
  FileText,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sprout,
  TrendingDown,
  TrendingUp,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { MapView } from "@/components/map/MapView";
import { UNDERWRITING_STATUS_CONFIG, UnderwritingStatus } from "@/lib/underwriting/status";

export default function UnderwritingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<any>(null);

  // Decision Panel State
  const [underwriterNotes, setUnderwriterNotes] = useState("");
  const [decisionReason, setDecisionReason] = useState("Acceptable risk appetite");
  const [customReason, setCustomReason] = useState("");
  const [informationRequestText, setInformationRequestText] = useState("");
  const [rejectionReasonText, setRejectionReasonText] = useState("");

  // Action Modal State
  const [activeModal, setActiveModal] = useState<"APPROVE" | "REQUEST_INFO" | "REJECT" | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRecord = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/policies/${id}`);
      if (!res.ok) throw new Error(`Underwriting application ${id} not found.`);
      const data = await res.json();
      setRecord(data.record);
      if (data.record?.underwriterNotes) setUnderwriterNotes(data.record.underwriterNotes);
      if (data.record?.informationRequest) setInformationRequestText(data.record.informationRequest);
      if (data.record?.rejectionReason) setRejectionReasonText(data.record.rejectionReason);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load application.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRecord();
  }, [id]);

  const handleApproveSubmit = async () => {
    setSubmittingAction(true);
    setActionError(null);
    try {
      const finalReason = decisionReason === "Other" ? customReason : decisionReason;
      const res = await fetch(`/api/policies/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor: "Senior Underwriter",
          decisionReason: finalReason,
          underwriterNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve application.");

      setRecord(data.record);
      setActiveModal(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRequestInfoSubmit = async () => {
    if (!informationRequestText.trim()) {
      setActionError("Please describe the information required from the applicant.");
      return;
    }
    setSubmittingAction(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/policies/${id}/request-information`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor: "Senior Underwriter",
          informationRequest: informationRequestText,
          underwriterNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request information.");

      setRecord(data.record);
      setActiveModal(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReasonText.trim()) {
      setActionError("Please provide an explicit rejection reason.");
      return;
    }
    setSubmittingAction(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/policies/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor: "Senior Underwriter",
          rejectionReason: rejectionReasonText,
          underwriterNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject application.");

      setRecord(data.record);
      setActiveModal(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <RefreshCw size={28} className="animate-spin text-[var(--color-emerald)]" />
        <p className="mt-3 text-[13px] text-[var(--color-text-muted)]">Loading underwriting assessment {id}…</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertTriangle size={32} className="text-[var(--color-red)]" />
        <h2 className="text-[16px] font-bold text-[var(--color-red)]">Application Not Found</h2>
        <p className="text-[12.5px] text-[var(--color-text-muted)]">{error || "Record does not exist."}</p>
        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2 text-[12.5px] font-medium text-[var(--color-text)]"
        >
          <ArrowLeft size={14} /> Back to Underwriting Queue
        </Link>
      </div>
    );
  }

  const statusInfo = UNDERWRITING_STATUS_CONFIG[record.status as keyof typeof UNDERWRITING_STATUS_CONFIG] || {
    label: record.status,
    badgeClass: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  };

  const riskLevelStr = String(record.riskLevel).toUpperCase();
  const isHighRisk = riskLevelStr === "HIGH";
  const isLowRisk = riskLevelStr === "LOW";
  const isPositiveDev = record.yieldDeviationPct >= 0;

  // Farm Polygon formatting for Leaflet MapView
  const mapPolygons = record.geoJson
    ? [
        {
          id: record.farmCode || "farm-poly",
          crop: record.crop,
          area: record.areaAcres,
          coordinates:
            record.geoJson.geometry?.coordinates?.[0]?.map((c: number[]) => [c[1], c[0]]) || [
              [record.latitude, record.longitude],
            ],
          riskScore: record.riskScore,
          riskLevel: record.riskLevel,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6 text-[var(--color-text)]">
      {/* BREADCRUMB & BACK LINK */}
      <div>
        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={13} /> Back to Underwriting Queue
        </Link>
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-dim)]">
              Underwriting Review Application
            </span>
            <span className={`rounded-[4px] border px-2 py-0.5 text-[11px] font-bold uppercase ${statusInfo.badgeClass}`}>
              {statusInfo.label}
            </span>
          </div>
          <h1 className="mt-1 tnum text-[22px] font-bold tracking-tight text-[var(--color-text)]">
            {record.id} <span className="text-[14px] font-normal text-[var(--color-text-muted)]">({record.farmCode})</span>
          </h1>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">
            Applicant: <strong>{record.farmerName}</strong> • {record.farmName} • {record.district}, Maharashtra
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-[var(--color-text-dim)]">Recommended Premium</span>
            <p className="tnum text-[20px] font-bold text-[var(--color-emerald)]">
              ₹{Number(record.recommendedPremium).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* HIGH RISK WARNING BANNER */}
      {isHighRisk && (
        <div className="flex items-start gap-3 rounded-[6px] border border-[var(--color-red)]/40 bg-[var(--color-red-dim)]/30 p-4 text-[12.5px] text-[var(--color-red)]">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider">HIGH RISK — Additional Underwriting Review Recommended</span>
            <p className="mt-0.5 text-[12px] text-[var(--color-red)]/90">
              The AI V2 ML model predicts significant yield deficit relative to historical average. Careful review of irrigation availability and climate exposure is advised before binding.
            </p>
          </div>
        </div>
      )}

      {/* UNDERWRITER DECISION PANEL (SECTION 9) */}
      <Card className="border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5">
        <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-[var(--color-emerald)]" />
            <h2 className="text-[13.5px] font-bold uppercase tracking-wider text-[var(--color-text)]">
              Underwriter Decision Panel
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-[var(--color-text-dim)]">Current Status:</span>
            <span className={`rounded-[4px] border px-2 py-0.5 text-[11px] font-bold uppercase ${statusInfo.badgeClass}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Decision Reason & Notes Controls */}
          <div className="flex flex-col gap-3 text-[12px]">
            <div>
              <label className="mb-1 block font-medium text-[var(--color-text-muted)]">Decision Reason Category</label>
              <select
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[12px] text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
              >
                <option value="Acceptable risk appetite">Acceptable risk appetite</option>
                <option value="Risk within underwriting appetite">Risk within underwriting appetite</option>
                <option value="Additional information required">Additional information required</option>
                <option value="Risk exceeds underwriting appetite">Risk exceeds underwriting appetite</option>
                <option value="Data inconsistency detected">Data inconsistency detected</option>
                <option value="Other">Other (Custom explanation)</option>
              </select>
            </div>

            {decisionReason === "Other" && (
              <div>
                <label className="mb-1 block font-medium text-[var(--color-text-muted)]">Specify Custom Reason</label>
                <input
                  type="text"
                  placeholder="Enter detailed reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[12px] text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block font-medium text-[var(--color-text-muted)]">Underwriter Notes & Assessment Feedback</label>
              <textarea
                rows={3}
                placeholder="Enter internal underwriting notes, conditions, or risk evaluation comments…"
                value={underwriterNotes}
                onChange={(e) => setUnderwriterNotes(e.target.value)}
                className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[12px] text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col justify-between rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div>
              <h3 className="text-[12.5px] font-semibold text-[var(--color-text)]">Underwriting Action Triggers</h3>
              <p className="mt-0.5 text-[11.5px] text-[var(--color-text-dim)]">
                Selecting an action records an immutable audit event with your notes and updates policy status.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setActionError(null);
                  setActiveModal("APPROVE");
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[6px] bg-[var(--color-emerald)] px-4 py-2.5 text-[12.5px] font-semibold text-[#0c1210] hover:opacity-90"
              >
                <CheckCircle2 size={15} /> Approve Policy
              </button>

              <button
                onClick={() => {
                  setActionError(null);
                  setActiveModal("REQUEST_INFO");
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[6px] border border-blue-500/50 bg-blue-500/10 px-4 py-2.5 text-[12.5px] font-semibold text-blue-400 hover:bg-blue-500/20"
              >
                <FileSearch size={15} /> Request Info
              </button>

              <button
                onClick={() => {
                  setActionError(null);
                  setActiveModal("REJECT");
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[6px] border border-[var(--color-red)]/50 bg-[var(--color-red-dim)] px-4 py-2.5 text-[12.5px] font-semibold text-[var(--color-red)] hover:bg-[var(--color-red)]/30"
              >
                <XCircle size={15} /> Reject
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* TWO COLUMN GRID FOR DETAILED SECTIONS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: SECTIONS A, B, C */}
        <div className="flex flex-col gap-6">
          {/* SECTION A — FARM & APPLICANT */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
              <MapPin size={16} className="text-[var(--color-emerald)]" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                Section A — Farm & Applicant Profile
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <span className="text-[var(--color-text-dim)]">Farmer Name:</span>
                <p className="font-semibold text-[var(--color-text)]">{record.farmerName}</p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">Farm Name:</span>
                <p className="font-semibold text-[var(--color-text)]">{record.farmName}</p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">Farm Code:</span>
                <p className="tnum font-semibold text-[var(--color-emerald)]">{record.farmCode}</p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">Farm Area:</span>
                <p className="tnum font-semibold text-[var(--color-text)]">
                  {record.areaAcres} acres <span className="font-normal text-[var(--color-text-dim)]">({record.areaHectares} ha)</span>
                </p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">Village / Taluka:</span>
                <p className="font-medium text-[var(--color-text)]">{record.village || "N/A"}, {record.taluka || "N/A"}</p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">District / State:</span>
                <p className="font-medium text-[var(--color-text)]">{record.district}, Maharashtra</p>
              </div>
              <div className="col-span-2">
                <span className="text-[var(--color-text-dim)]">Center Coordinates:</span>
                <p className="tnum font-mono text-[11.5px] text-[var(--color-text-muted)]">
                  Latitude: {record.latitude}°N, Longitude: {record.longitude}°E
                </p>
              </div>
            </div>
          </Card>

          {/* SECTION B — FARM MAP */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[var(--color-emerald)]" />
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                  Section B — Farm Boundary Map
                </h3>
              </div>
              <span className="text-[11px] text-[var(--color-text-dim)]">Satellite Polygon View</span>
            </div>

            <div className="h-64 w-full overflow-hidden rounded-[6px] border border-[var(--color-border)]">
              <MapView
                center={[Number(record.latitude), Number(record.longitude)]}
                zoom={14}
                className="h-full w-full"
                markers={[
                  {
                    id: record.farmCode,
                    position: [Number(record.latitude), Number(record.longitude)],
                    riskLevel: (String(record.riskLevel).toLowerCase() as any) || "low",
                  },
                ]}
              />
            </div>
          </Card>

          {/* SECTION C — CROP PROFILE */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
              <Sprout size={16} className="text-[var(--color-emerald)]" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                Section C — Crop Profile & Agronomics
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <span className="text-[var(--color-text-dim)]">Crop Category:</span>
                <p className="font-semibold text-[var(--color-text)]">{record.cropCategory || "Cereals / Grains"}</p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">Crop Name:</span>
                <p className="font-semibold text-[var(--color-text)]">{record.crop}</p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">Crop Variety:</span>
                <p className="font-semibold text-[var(--color-text)]">{record.cropVariety || "Standard"}</p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">Growth Stage / Season:</span>
                <p className="font-semibold text-[var(--color-text)]">{record.growthStage || "Kharif Season"}</p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">Irrigation Type:</span>
                <p className="font-semibold text-[var(--color-text)]">{record.irrigationType}</p>
              </div>
              <div>
                <span className="text-[var(--color-text-dim)]">Soil Classification:</span>
                <p className="font-semibold text-[var(--color-text)]">{record.soilType}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: SECTIONS D, E, F, G, H & AUDIT */}
        <div className="flex flex-col gap-6">
          {/* SECTION E — AI RISK ASSESSMENT */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--color-emerald)]" />
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                  Section E — Stored AI V2 Risk Assessment
                </h3>
              </div>
              <span className={`rounded-[4px] border px-2 py-0.5 text-[10.5px] font-bold uppercase ${
                isHighRisk ? "bg-[var(--color-red-dim)] text-[var(--color-red)] border-[var(--color-red)]/30" : isLowRisk ? "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)] border-[var(--color-emerald)]/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}>
                {record.riskScore}% {riskLevelStr}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
                <span className="text-[10.5px] text-[var(--color-text-dim)]">V2 Predicted Yield</span>
                <p className="tnum mt-0.5 text-[15px] font-bold text-[var(--color-text)]">
                  {record.predictedYieldKgHa} <span className="text-[11px] font-normal text-[var(--color-text-dim)]">kg/ha</span>
                </p>
              </div>
              <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
                <span className="text-[10.5px] text-[var(--color-text-dim)]">Expected Baseline</span>
                <p className="tnum mt-0.5 text-[15px] font-bold text-[var(--color-text)]">
                  {record.expectedYieldKgHa} <span className="text-[11px] font-normal text-[var(--color-text-dim)]">kg/ha</span>
                </p>
              </div>
              <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
                <span className="text-[10.5px] text-[var(--color-text-dim)]">Yield Deviation</span>
                <p className={`tnum mt-0.5 text-[15px] font-bold ${isPositiveDev ? "text-[var(--color-emerald)]" : "text-[var(--color-red)]"}`}>
                  {isPositiveDev ? `+${record.yieldDeviationPct}%` : `${record.yieldDeviationPct}%`}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--color-text-dim)]">
              <span>Model: AgriSurge V2 Crop Yield Model</span>
              <span>Metadata Version: {record.modelMetadata?.modelVersion || "2.0.0"}</span>
            </div>
          </Card>

          {/* SECTION F — RISK EXPLANATION */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
              <BarChart3 size={16} className="text-[var(--color-emerald)]" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                Section F — Model Feature Explainability
              </h3>
            </div>

            <div className="flex flex-col gap-2 text-[11.5px]">
              {record.riskFactors && record.riskFactors.length > 0 ? (
                record.riskFactors.map((f: any) => {
                  const pct = Math.min(100, Math.round((f.contribution || 0) * 100));
                  return (
                    <div key={f.name} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--color-text-muted)]">{f.name}</span>
                        <span className="tnum font-semibold text-[var(--color-text-dim)]">{pct}% weight</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-emerald)]"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[11.5px] text-[var(--color-text-dim)]">
                  Feature-level model explanation is not available for this assessment.
                </p>
              )}
            </div>
          </Card>

          {/* SECTION G — PREMIUM RECOMMENDATION */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-[var(--color-emerald)]" />
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                  Section G — Stored Premium Recommendation
                </h3>
              </div>
              <span className="text-[11px] text-[var(--color-text-dim)]">Model {record.pricingModelVersion || "v2.0"}</span>
            </div>

            <div className="flex flex-col gap-2 text-[12px]">
              <div className="flex justify-between border-b border-[var(--color-border)] pb-1.5">
                <span className="text-[var(--color-text-dim)]">Base Exposure ({record.areaHectares} ha):</span>
                <span className="tnum font-medium text-[var(--color-text)]">
                  ₹{Number(record.baseExposure).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-1.5">
                <span className="text-[var(--color-text-dim)]">Risk Multiplier ({riskLevelStr}):</span>
                <span className="tnum font-medium text-[var(--color-text)]">{Number(record.riskMultiplier).toFixed(2)}×</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-1.5">
                <span className="text-[var(--color-text-dim)]">Underwriting Adjustments:</span>
                <span className="tnum font-medium text-[var(--color-text)]">
                  {record.underwritingAdjAmount >= 0 ? `+₹${Math.round(record.underwritingAdjAmount).toLocaleString("en-IN")}` : `-₹${Math.abs(Math.round(record.underwritingAdjAmount)).toLocaleString("en-IN")}`}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-[13.5px]">
                <span className="text-[var(--color-text)]">Recommended Policy Premium:</span>
                <span className="tnum text-[17px] text-[var(--color-emerald)]">
                  ₹{Number(record.recommendedPremium).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </Card>

          {/* SECTION H — DYNAMIC UNDERWRITING SUMMARY */}
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
              <FileText size={16} className="text-[var(--color-emerald)]" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                Section H — Underwriting Summary
              </h3>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[var(--color-text-muted)]">
              Risk: <strong>{riskLevelStr}</strong> ({record.riskScore}% score). Primary concern:{" "}
              {isPositiveDev ? "Above-baseline predicted yield (+20.8%)" : "Yield deficit relative to historical district mean"}. Environmental exposure:{" "}
              {record.irrigationType} ({record.soilType}). Recommended premium of <strong>₹{Number(record.recommendedPremium).toLocaleString("en-IN")}</strong> generated via AgriSurge pricing model {record.pricingModelVersion || "v2.0"}.
            </p>
          </Card>

          {/* SECTION 13 — AUDIT TRAIL / HISTORY */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--color-emerald)]" />
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                  Audit History & Decision Logs
                </h3>
              </div>
              <span className="text-[10.5px] text-[var(--color-text-dim)]">Immutable Audit Trail</span>
            </div>

            <div className="flex flex-col gap-3 text-[11.5px]">
              {record.auditTrail && record.auditTrail.length > 0 ? (
                record.auditTrail.map((ev: any) => (
                  <div key={ev.id} className="flex gap-2.5 border-b border-[var(--color-border)] pb-2.5 last:border-0 last:pb-0">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-[var(--color-emerald)] shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--color-text)]">{ev.action}</span>
                        <span className="text-[10px] text-[var(--color-text-dim)]">• {ev.actor}</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)]">{ev.notes}</p>
                      <span className="tnum text-[10px] text-[var(--color-text-dim)]">
                        {new Date(ev.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11.5px] text-[var(--color-text-dim)]">No audit events logged yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* CONFIRMATION MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-5 shadow-xl">
            {activeModal === "APPROVE" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[var(--color-emerald)]">
                  <CheckCircle2 size={20} />
                  <h3 className="text-[15px] font-bold">Approve Underwriting Policy?</h3>
                </div>
                <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed">
                  You are approving application <strong>{record.id}</strong>. This will set policy status to <strong>APPROVED</strong> and log an immutable audit event.
                </p>

                <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-dim)]">Risk Score:</span>
                    <span className="font-bold">{record.riskScore}% ({riskLevelStr})</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[var(--color-text-dim)]">Bound Premium:</span>
                    <span className="font-bold text-[var(--color-emerald)]">₹{Number(record.recommendedPremium).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {actionError && <p className="text-[11.5px] text-[var(--color-red)]">{actionError}</p>}

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    disabled={submittingAction}
                    className="rounded-[6px] border border-[var(--color-border)] px-3.5 py-1.5 text-[12px] text-[var(--color-text-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveSubmit}
                    disabled={submittingAction}
                    className="rounded-[6px] bg-[var(--color-emerald)] px-4 py-1.5 text-[12px] font-bold text-[#0c1210]"
                  >
                    {submittingAction ? "Confirming..." : "Confirm Approval"}
                  </button>
                </div>
              </div>
            )}

            {activeModal === "REQUEST_INFO" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <FileSearch size={20} />
                  <h3 className="text-[15px] font-bold">Request Additional Information</h3>
                </div>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  Specify the documentation or information required from the applicant. Status will update to <strong>NEEDS_INFORMATION</strong>.
                </p>

                <textarea
                  rows={3}
                  placeholder="e.g. Please provide updated drip irrigation certification or soil report…"
                  value={informationRequestText}
                  onChange={(e) => setInformationRequestText(e.target.value)}
                  className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-[12px] text-[var(--color-text)] focus:border-blue-500 focus:outline-none"
                />

                {actionError && <p className="text-[11.5px] text-[var(--color-red)]">{actionError}</p>}

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    disabled={submittingAction}
                    className="rounded-[6px] border border-[var(--color-border)] px-3.5 py-1.5 text-[12px] text-[var(--color-text-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestInfoSubmit}
                    disabled={submittingAction}
                    className="rounded-[6px] bg-blue-500 px-4 py-1.5 text-[12px] font-bold text-white"
                  >
                    {submittingAction ? "Submitting..." : "Send Request"}
                  </button>
                </div>
              </div>
            )}

            {activeModal === "REJECT" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[var(--color-red)]">
                  <XCircle size={20} />
                  <h3 className="text-[15px] font-bold">Reject Underwriting Policy?</h3>
                </div>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  Provide an explicit rejection reason for declining application <strong>{record.id}</strong>. Status will update to <strong>REJECTED</strong>.
                </p>

                <textarea
                  rows={3}
                  placeholder="e.g. Risk score exceeds underwriting appetite due to extreme pre-harvest rainfall deficit…"
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-[12px] text-[var(--color-text)] focus:border-[var(--color-red)] focus:outline-none"
                />

                {actionError && <p className="text-[11.5px] text-[var(--color-red)]">{actionError}</p>}

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    disabled={submittingAction}
                    className="rounded-[6px] border border-[var(--color-border)] px-3.5 py-1.5 text-[12px] text-[var(--color-text-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectSubmit}
                    disabled={submittingAction}
                    className="rounded-[6px] bg-[var(--color-red)] px-4 py-1.5 text-[12px] font-bold text-white"
                  >
                    {submittingAction ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
