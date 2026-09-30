"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { MapView } from "@/components/map/MapView";
import { UNDERWRITING_STATUS_CONFIG, UnderwritingStatus } from "@/lib/underwriting/status";
import { CertificateTemplate } from "@/components/pdf/CertificateTemplate";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

// ─── Small helper components ─────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {children}
    </p>
  );
}

function DataRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-[11.5px] text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className={`text-[12px] font-medium text-slate-800 dark:text-slate-200 text-right ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function RiskBar({ label, contribution, level }: { label: string; contribution: number; level: "low" | "moderate" | "high" }) {
  const pct = Math.min(100, Math.round(contribution * 100));
  const barColor = level === "high" ? "bg-red-500" : level === "moderate" ? "bg-amber-400" : "bg-emerald-500";
  const dotColor = level === "high" ? "bg-red-500" : level === "moderate" ? "bg-amber-400" : "bg-emerald-500";
  const textColor = level === "high" ? "text-red-600 dark:text-red-400" : level === "moderate" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
          <span className="text-[11.5px] text-slate-600 dark:text-slate-400">{label}</span>
        </div>
        <span className={`text-[11px] font-semibold tabular-nums ${textColor}`}>
          {level === "high" ? "High" : level === "moderate" ? "Moderate" : "Low"}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.max(8, pct)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export default function UnderwritingDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<any>(null);

  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [activeModal, setActiveModal] = useState<"APPROVE" | "REJECT" | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const certificateRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<HTMLDivElement>(null);

  const fetchRecord = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/policies/${id}`);
      if (!res.ok) throw new Error(`Policy ${id} not found.`);
      const data = await res.json();
      setRecord(data.record);
      if (data.record?.rejectionReason) setRejectionReasonText(data.record.rejectionReason);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policy.");
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
      // Step 1: Ensure image exists before approval
      if (!record.boundaryImageBase64) {
        if (!record.geoJson) {
          throw new Error("Missing farm boundary polygon. Cannot generate certificate. Please re-validate the farm area.");
        }
        
        let capturedImage: string | undefined;
        if (mapRef.current) {
          try {
            // Hide Leaflet UI controls for a clean satellite evidence image
            const controls = mapRef.current.querySelectorAll('.leaflet-control-container, .leaflet-top, .leaflet-bottom') as NodeListOf<HTMLElement>;
            const typeSelector = mapRef.current.parentElement?.querySelectorAll('button, div.z-\\[1001\\]') as NodeListOf<HTMLElement>;
            
            controls.forEach(c => { c.style.display = 'none'; });
            typeSelector?.forEach(c => { c.style.opacity = '0'; });

            // Ensure we wait for a moment for styles to apply
            await new Promise(r => setTimeout(r, 100));

            capturedImage = await toJpeg(mapRef.current, { quality: 0.8, pixelRatio: 2 });

            // Restore UI
            controls.forEach(c => { c.style.display = ''; });
            typeSelector?.forEach(c => { c.style.opacity = '1'; });
          } catch (captureErr) {
            console.error("Failed to capture map image:", captureErr);
          }
        }

        if (!capturedImage) {
          throw new Error("Failed to regenerate farm image from the map display.");
        }
        
        // Use the new image for the approval payload
        record.boundaryImageBase64 = capturedImage;
      }

      // Step 2: Approve Policy
      const res = await fetch(`/api/policies/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          actor: "Senior Underwriter", 
          decisionReason: "Acceptable risk appetite", 
          underwriterNotes: "",
          boundaryImageBase64: record.boundaryImageBase64 // Ensure it's passed to backend to be saved
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve.");
      
      // Step 3: Generate PDF
      if (!data.record.boundaryImageBase64) {
        setRecord(data.record);
        throw new Error("Missing farm boundary image. Cannot generate certificate. Please try again or re-validate the farm area.");
      }

      setRecord(data.record);
      // Wait for React to render the image into the DOM before capturing
      await new Promise(r => setTimeout(r, 500));

      if (certificateRef.current) {
        try {
          // ensure component is visible temporarily for drawing if hidden
          certificateRef.current.style.display = 'block';
          
          const width = certificateRef.current.clientWidth;
          const height = certificateRef.current.clientHeight;
          
          const imgData = await toJpeg(certificateRef.current, { quality: 1.0, pixelRatio: 2 });
          certificateRef.current.style.display = 'none';
          
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [width, height]
          });
          pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
          const pdfBase64 = pdf.output('datauristring');
          
          // Upload PDF
          const uploadRes = await fetch(`/api/policies/${id}/certificate`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ certificatePdf: pdfBase64 })
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.record) {
            setRecord(uploadData.record);
          } else {
            setRecord(data.record);
          }
        } catch (pdfErr) {
          console.error("Failed to generate PDF", pdfErr);
          // If PDF generation fails, we still set the record as approved because the DB update succeeded.
          setRecord(data.record);
          throw new Error("Policy approved, but certificate generation failed. Please retry generation.");
        }
      } else {
        setRecord(data.record);
      }
      
      setActiveModal(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approval failed.");
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
        body: JSON.stringify({ actor: "Senior Underwriter", rejectionReason: rejectionReasonText, underwriterNotes: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject.");
      setRecord(data.record);
      setActiveModal(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // ── Loading / Error states ────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw size={24} className="animate-spin text-emerald-500" />
        <p className="text-[13px] text-slate-500">Loading underwriting record…</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertTriangle size={28} className="text-red-500" />
        <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-200">Record Not Found</h2>
        <p className="text-[12.5px] text-slate-500">{error || "This policy record does not exist."}</p>
        <Link href="/policies" className="inline-flex items-center gap-1.5 rounded-[5px] border border-slate-200 dark:border-slate-700 px-4 py-2 text-[12.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          <ArrowLeft size={13} /> Back to Underwriting Queue
        </Link>
      </div>
    );
  }

  // ── Derived values (no logic changes) ────────────────────────────

  const statusInfo = UNDERWRITING_STATUS_CONFIG[record.status as keyof typeof UNDERWRITING_STATUS_CONFIG] || {
    label: record.status,
    badgeClass: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  };

  const riskLevelStr = String(record.riskLevel).toUpperCase();
  const isHighRisk = riskLevelStr === "HIGH";
  const isModerateRisk = riskLevelStr === "MODERATE";
  const isLowRisk = riskLevelStr === "LOW";
  const isPositiveDev = record.yieldDeviationPct >= 0;

  const riskScoreNum = Number(record.riskScore);
  const riskCircleColor = isHighRisk ? "#ef4444" : isModerateRisk ? "#f59e0b" : "#10b981";
  const riskBgColor = isHighRisk ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40" : isModerateRisk ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40";
  const riskTextColor = isHighRisk ? "text-red-700 dark:text-red-400" : isModerateRisk ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400";

  // Risk factors — derived from existing data (no new logic)
  const rawFactors: Array<{ name: string; contribution: number }> = record.riskFactors || [];
  function mapLevel(contribution: number): "low" | "moderate" | "high" {
    if (contribution >= 0.4) return "high";
    if (contribution >= 0.2) return "moderate";
    return "low";
  }
  const riskBars = rawFactors.map((f) => ({
    label: f.name,
    contribution: f.contribution,
    level: mapLevel(f.contribution),
  }));

  // Underwriting summary text — uses existing real data, no technical terms
  const summaryText = (() => {
    const devPart = isPositiveDev
      ? `Predicted yield is ${Math.abs(record.yieldDeviationPct)}% above the regional baseline, indicating favorable growing conditions.`
      : `Predicted yield is ${Math.abs(record.yieldDeviationPct)}% below the regional baseline, indicating elevated loss exposure.`;
    const irrigPart = record.irrigationType?.toLowerCase().includes("rainfed") || record.irrigationType?.toLowerCase().includes("rain")
      ? "The farm relies on rainfed irrigation, which increases sensitivity to seasonal rainfall variability."
      : `The farm uses ${record.irrigationType}, which provides moderate to good moisture reliability.`;
    const soilPart = `Soil classified as ${record.soilType}.`;
    return `${devPart} ${irrigPart} ${soilPart} A recommended premium of ₹${Number(record.recommendedPremium).toLocaleString("en-IN")} has been calculated based on the assessed risk profile and farm characteristics.`;
  })();

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 text-slate-900 dark:text-slate-100">

      {/* BREADCRUMB */}
      <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
        <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">AgriSurge</Link>
        <span>/</span>
        <Link href="/policies" className="hover:text-slate-700 dark:hover:text-slate-300">Policies</Link>
        <span>/</span>
        <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">{record.id}</span>
      </div>

      {/* BACK LINK + PAGE TITLE */}
      <div>
        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-3"
        >
          <ArrowLeft size={13} /> Back to Underwriting Queue
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
          Policy Underwriting
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Review farm details, risk assessment and premium recommendation to make an underwriting decision.
        </p>
      </div>

      {/* HIGH RISK BANNER */}
      {isHighRisk && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[6px] border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-0.5">
                High Risk — Review Recommended
              </p>
              <p className="text-[12px] text-red-600/90 dark:text-red-400/80 leading-relaxed max-w-xl">
                This farm shows higher than average risk of yield shortfall based on historical data, environmental conditions and crop characteristics. Review the key risk factors before approving.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right sm:pl-6 sm:border-l border-red-200 dark:border-red-800/50">
            <p className="text-[10.5px] uppercase tracking-wider text-red-500 dark:text-red-500 font-semibold mb-0.5">Recommended Premium</p>
            <p className="text-[22px] font-bold tabular-nums text-red-700 dark:text-red-400">
              ₹{Number(record.recommendedPremium).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-red-500/80">for {record.areaHectares} ha</p>
          </div>
        </div>
      )}

      {/* ── ROW 1: Policy Information | Risk Summary | Key Predictions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Policy Information */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <SectionLabel>Policy Information</SectionLabel>
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            <DataRow label="Policy ID" value={<span className="tabular-nums font-mono text-[11px]">{record.id}</span>} />
            <DataRow label="Application ID" value={<span className="tabular-nums font-mono text-[11px]">{record.farmCode}</span>} />
            <DataRow label="Status" value={
              <span className={`rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            } />
            <DataRow label="Application Date" value={
              record.createdAt
                ? new Date(record.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "—"
            } />
            <DataRow label="Applicant" value={record.farmerName} />
            <DataRow label="Location" value={`${record.village || record.taluka || "—"}, ${record.district}`} />
          </div>
        </Card>

        {/* Risk Summary */}
        <Card className={`p-4 border ${riskBgColor}`}>
          <SectionLabel>Risk Summary</SectionLabel>
          <div className="flex flex-col items-center justify-center h-[calc(100%-28px)] gap-3 py-2">
            {/* Circular Score */}
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 88 88" className="absolute inset-0 -rotate-90">
                <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="8" />
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke={riskCircleColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(riskScoreNum / 100) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[22px] font-bold tabular-nums leading-none ${riskTextColor}`}>{riskScoreNum}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="text-center">
              <p className={`text-[14px] font-bold ${riskTextColor}`}>{riskLevelStr} RISK</p>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[180px] leading-relaxed">
                {isHighRisk
                  ? "Elevated loss probability. Manual review strongly recommended."
                  : isModerateRisk
                  ? "Moderate risk exposure. Review conditions before binding."
                  : "Risk within acceptable appetite. Standard underwriting applies."}
              </p>
            </div>
          </div>
        </Card>

        {/* Key Predictions */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <SectionLabel>Key Predictions</SectionLabel>
          <div className="flex flex-col gap-3">
            <div className="rounded-[5px] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
              <p className="text-[10.5px] text-slate-400 uppercase tracking-wide">Predicted Yield</p>
              <p className="tnum text-[17px] font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {record.predictedYieldKgHa} <span className="text-[11px] font-normal text-slate-400">kg/ha</span>
              </p>
            </div>
            <div className="rounded-[5px] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
              <p className="text-[10.5px] text-slate-400 uppercase tracking-wide">Regional Baseline</p>
              <p className="tnum text-[17px] font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {record.expectedYieldKgHa} <span className="text-[11px] font-normal text-slate-400">kg/ha</span>
              </p>
            </div>
            <div className={`rounded-[5px] border px-3 py-2.5 ${isPositiveDev ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20" : "border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20"}`}>
              <p className="text-[10.5px] text-slate-400 uppercase tracking-wide">Yield Deviation</p>
              <p className={`tnum text-[17px] font-bold mt-0.5 ${isPositiveDev ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                {isPositiveDev ? `+${record.yieldDeviationPct}%` : `${record.yieldDeviationPct}%`}
              </p>
              <p className={`text-[10.5px] mt-0.5 ${isPositiveDev ? "text-emerald-600/70 dark:text-emerald-500" : "text-red-600/70 dark:text-red-500"}`}>
                {isPositiveDev ? "Above regional average" : "Below regional average"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── ROW 2: Farm Location | Farm & Crop Details | Risk Factor Analysis ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Farm Location */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <SectionLabel>Farm Location</SectionLabel>
          <div ref={mapRef} className="isolate h-48 w-full overflow-hidden rounded-[5px] border border-slate-200 dark:border-slate-700 mb-3 relative z-0">
            <MapView
              center={[Number(record.latitude), Number(record.longitude)]}
              zoom={14}
              className="h-full w-full"
              polygon={record.geoJson}
              markers={[
                {
                  id: record.farmCode,
                  position: [Number(record.latitude), Number(record.longitude)],
                  riskLevel: (String(record.riskLevel).toLowerCase() as any) || "low",
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-0.5 text-[11.5px]">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {record.village || "—"}, {record.taluka || "—"}
            </p>
            <p className="text-slate-500">{record.district}, Maharashtra</p>
            <p className="font-mono text-[10.5px] text-slate-400 mt-0.5">
              {Number(record.latitude).toFixed(5)}°N, {Number(record.longitude).toFixed(5)}°E
            </p>
          </div>
        </Card>

        {/* Farm & Crop Details */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <SectionLabel>Farm &amp; Crop Details</SectionLabel>
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            <DataRow label="Crop Category" value={record.cropCategory || "—"} />
            <DataRow label="Crop Name" value={<span className="font-semibold text-slate-900 dark:text-white">{record.crop}</span>} />
            <DataRow label="Variety" value={record.cropVariety || "Standard"} />
            <DataRow label="Season" value={record.growthStage || "Kharif Season"} />
            <DataRow label="Irrigation Type" value={record.irrigationType} />
            <DataRow label="Soil Type" value={record.soilType} />
            <DataRow label="Farm Area" value={
              <span>
                <span className="font-semibold tabular-nums">{record.areaAcres} ac</span>
                <span className="text-slate-400 text-[11px] ml-1">({record.areaHectares} ha)</span>
              </span>
            } />
          </div>
        </Card>

        {/* Risk Factor Analysis */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <SectionLabel>Risk Factor Analysis</SectionLabel>
          {riskBars.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {riskBars.map((bar) => (
                <RiskBar key={bar.label} label={bar.label} contribution={bar.contribution} level={bar.level} />
              ))}
              <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Low</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />Moderate</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />High</span>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-slate-400 italic">
              Detailed factor analysis is not available for this assessment.
            </p>
          )}
        </Card>
      </div>

      {/* ── ROW 3: Premium Details | Underwriting Assessment | Underwriting Decision ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Premium Details */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <SectionLabel>Premium Details</SectionLabel>
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            <DataRow
              label={`Base Exposure (${record.areaHectares} ha)`}
              value={<span className="tabular-nums">₹{Number(record.baseExposure).toLocaleString("en-IN")}</span>}
            />
            <DataRow
              label={`Risk Multiplier (${riskLevelStr})`}
              value={<span className="tabular-nums">{Number(record.riskMultiplier).toFixed(2)}×</span>}
            />
            <DataRow
              label="Underwriting Adjustments"
              value={
                <span className="tabular-nums">
                  {record.underwritingAdjAmount >= 0
                    ? `+₹${Math.round(record.underwritingAdjAmount).toLocaleString("en-IN")}`
                    : `-₹${Math.abs(Math.round(record.underwritingAdjAmount)).toLocaleString("en-IN")}`}
                </span>
              }
            />
          </div>
          <div className="mt-4 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-3 py-3 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Recommended Premium</span>
            <span className="tabular-nums text-[20px] font-bold text-emerald-700 dark:text-emerald-400">
              ₹{Number(record.recommendedPremium).toLocaleString("en-IN")}
            </span>
          </div>
        </Card>

        {/* Underwriting Assessment */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <SectionLabel>Underwriting Assessment</SectionLabel>
          <div className={`mb-3 flex items-center gap-2 rounded-[4px] border px-2.5 py-1.5 ${riskBgColor}`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${riskTextColor}`}>
              {riskLevelStr} RISK
            </span>
            <span className={`text-[11px] tabular-nums ${riskTextColor}`}>· Score {riskScoreNum}/100</span>
          </div>
          <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400">
            {summaryText}
          </p>
          {record.status === "APPROVED" && (
            <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={13} /> This policy has been approved.
            </div>
          )}
          {record.status === "REJECTED" && record.rejectionReason && (
            <div className="mt-3 rounded-[4px] border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 px-2.5 py-2">
              <p className="text-[11px] text-red-600 dark:text-red-400 font-medium mb-0.5">Rejection Reason</p>
              <p className="text-[11.5px] text-red-600/80 dark:text-red-400/80">{record.rejectionReason}</p>
            </div>
          )}
        </Card>

        {/* Underwriting Decision */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col">
          <SectionLabel>Underwriting Decision</SectionLabel>
          <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
            Record a final underwriting decision. This action is logged and updates the policy status immediately.
          </p>
          <div className="flex flex-col gap-3 mt-auto">
            {record.status !== "APPROVED" && record.status !== "REJECTED" && (
              <>
                <button
                  onClick={() => { setActionError(null); setActiveModal("APPROVE"); }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[5px] bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={15} /> Approve Policy
                </button>
                <button
                  onClick={() => { setActionError(null); setActiveModal("REJECT"); }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[5px] border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 px-4 py-2.5 text-[13px] font-semibold text-red-700 dark:text-red-400 transition-colors cursor-pointer"
                >
                  <XCircle size={15} /> Reject Policy
                </button>
              </>
            )}
            {record.status === "APPROVED" && !record.certificatePdf && (
              <button
                onClick={() => { setActionError(null); handleApproveSubmit(); }}
                disabled={submittingAction}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[5px] bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors cursor-pointer"
              >
                <CheckCircle2 size={15} /> {submittingAction ? "Generating..." : "Generate Missing Certificate"}
              </button>
            )}
            {record.status === "APPROVED" && record.certificatePdf && (
              <div className="w-full inline-flex items-center justify-center gap-2 rounded-[5px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-700">
                <CheckCircle2 size={15} /> Decision Finalized
              </div>
            )}
            {record.status === "REJECTED" && (
              <div className="w-full inline-flex items-center justify-center gap-2 rounded-[5px] border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-700">
                <XCircle size={15} /> Policy Rejected
              </div>
            )}
          </div>
          <p className="mt-3 text-[10.5px] text-slate-400 text-center">
            Current status: <span className={`font-semibold`}>{statusInfo.label}</span>
          </p>
        </Card>
      </div>

      {/* ── ROW 4: Policy Certificate ── */}
      {record.status === "APPROVED" && record.certificatePdf && (
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center gap-3 mt-2">
          <div className="flex flex-col items-center">
            <CheckCircle2 size={32} className="text-emerald-500 mb-3" />
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Policy Approved & Bound</h3>
            <p className="text-[13px] text-slate-500 mt-1 max-w-md">
              The official policy certificate has been successfully generated and permanently associated with this underwriting record.
            </p>
          </div>
          <a
            href={record.certificatePdf}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-[13px] font-semibold text-white transition-colors cursor-pointer shadow-sm"
          >
            <ExternalLink size={15} /> View Full Certificate
          </a>
        </Card>
      )}

      {/* ── CONFIRMATION MODALS ────────────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 shadow-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">

            {activeModal === "APPROVE" && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Approve Policy?</h3>
                  </div>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed">
                    You are approving policy <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{record.id}</span>. Status will be updated to <strong>APPROVED</strong> and an audit record will be created.
                  </p>
                </div>
                <div className="rounded-[5px] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3 flex flex-col gap-1.5 text-[12px]">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Risk Score</span>
                    <span className={`font-semibold ${riskTextColor}`}>{riskScoreNum}% — {riskLevelStr}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Bound Premium</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">₹{Number(record.recommendedPremium).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                {actionError && <p className="text-[11.5px] text-red-600 dark:text-red-400">{actionError}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setActiveModal(null)} disabled={submittingAction} className="rounded-[5px] border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-[12.5px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                  <button onClick={handleApproveSubmit} disabled={submittingAction} className="rounded-[5px] bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-[12.5px] font-semibold text-white cursor-pointer">
                    {submittingAction ? "Confirming…" : "Confirm Approval"}
                  </button>
                </div>
              </div>
            )}

            {activeModal === "REJECT" && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle size={18} className="text-red-600 dark:text-red-400" />
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Reject Policy?</h3>
                  </div>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed">
                    Provide a rejection reason for policy <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{record.id}</span>. Status will be updated to <strong>REJECTED</strong>.
                  </p>
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g. Risk exposure exceeds underwriting appetite due to rainfed irrigation and yield deficit…"
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  className="w-full rounded-[5px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-[12.5px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-red-400 focus:outline-none resize-none"
                />
                {actionError && <p className="text-[11.5px] text-red-600 dark:text-red-400">{actionError}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setActiveModal(null)} disabled={submittingAction} className="rounded-[5px] border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-[12.5px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                  <button onClick={handleRejectSubmit} disabled={submittingAction} className="rounded-[5px] bg-red-600 hover:bg-red-700 px-4 py-1.5 text-[12.5px] font-semibold text-white cursor-pointer">
                    {submittingAction ? "Rejecting…" : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
      
      {/* Hidden Certificate Template for PDF Generation */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {record && <CertificateTemplate ref={certificateRef} record={record} />}
      </div>
    </div>
  );
}
