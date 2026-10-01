"use client";

import React, { useState } from "react";
import { Card, CardHeader, StatusBadge } from "@/components/ui/primitives";
import { User, Building, ShieldCheck, Calculator, Bell, Lock, CheckCircle2 } from "lucide-react";
import { CROP_BASE_RATES, RISK_TIER_MULTIPLIERS, DEFAULT_CROP_BASE_RATE } from "@/lib/pricing/pricingConfig";

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building },
  { id: "underwriting", label: "Underwriting Rules", icon: ShieldCheck },
  { id: "pricing", label: "Pricing Rules", icon: Calculator },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFakeSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <Card>
            <CardHeader title="Profile Information" subtitle="Your personal account settings." />
            <div className="px-5 py-4 flex flex-col gap-5">
              <div className="flex items-center gap-4 border-b border-[var(--color-border)] pb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[18px] font-semibold text-[var(--color-emerald)] border border-[var(--color-border-strong)]">
                  RA
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-[var(--color-text)]">Ronit A.</h3>
                  <p className="text-[13px] text-[var(--color-text-muted)]">Underwriting Manager</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Email</label>
                  <p className="mt-0.5 text-[13px] text-[var(--color-text)]">ronit@example.com</p>
                </div>
                <div>
                  <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Role</label>
                  <p className="mt-0.5 text-[13px] text-[var(--color-text)]">Underwriting</p>
                </div>
                <div>
                  <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Organization</label>
                  <p className="mt-0.5 text-[13px] text-[var(--color-text)]">Deccan Mutual</p>
                </div>
                <div>
                  <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Status</label>
                  <div className="mt-1">
                    <StatusBadge status="connected" />
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button disabled className="rounded-[6px] border border-[var(--color-border-strong)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed">
                  Edit Profile (Not Configured)
                </button>
              </div>
            </div>
          </Card>
        );

      case "organization":
        return (
          <Card>
            <CardHeader title="Organization" subtitle="Company details and regional operations." />
            <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <div>
                <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Organization Name</label>
                <p className="mt-0.5 text-[13.5px] text-[var(--color-text)]">Deccan Mutual</p>
              </div>
              <div>
                <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Organization ID</label>
                <p className="mt-0.5 text-[13.5px] font-mono text-[var(--color-text)]">ORG-89302</p>
              </div>
              <div>
                <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Organization Type</label>
                <p className="mt-0.5 text-[13.5px] text-[var(--color-text)]">Agricultural Insurance Provider</p>
              </div>
              <div>
                <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Primary Contact</label>
                <p className="mt-0.5 text-[13.5px] text-[var(--color-text)]">Admin Team</p>
              </div>
              <div className="md:col-span-2 border-t border-[var(--color-border)] pt-5 mt-1 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Operating Region</label>
                  <p className="mt-0.5 text-[13.5px] text-[var(--color-text)]">Maharashtra, India</p>
                </div>
                <div>
                  <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Default Currency</label>
                  <p className="mt-0.5 text-[13.5px] text-[var(--color-text)]">INR (₹)</p>
                </div>
                <div>
                  <label className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Default Policy Year</label>
                  <p className="mt-0.5 text-[13.5px] text-[var(--color-text)]">2026–27</p>
                </div>
              </div>
            </div>
          </Card>
        );

      case "underwriting":
        return (
          <Card>
            <CardHeader title="Underwriting Rules" subtitle="Risk thresholds and approval workflows." />
            <div className="px-5 py-5 flex flex-col gap-6">
              <div>
                <h4 className="text-[13px] font-medium text-[var(--color-text)] mb-3">Risk Classification Thresholds</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[6px] border border-[var(--color-border)] p-3 bg-[var(--color-surface-raised)]">
                    <p className="text-[11.5px] uppercase tracking-wide font-semibold text-[var(--color-emerald)]">Low Risk</p>
                    <p className="mt-1 text-[16px] font-bold text-[var(--color-text)]">0 – 39</p>
                  </div>
                  <div className="rounded-[6px] border border-[var(--color-border)] p-3 bg-[var(--color-surface-raised)]">
                    <p className="text-[11.5px] uppercase tracking-wide font-semibold text-[var(--color-amber)]">Moderate Risk</p>
                    <p className="mt-1 text-[16px] font-bold text-[var(--color-text)]">40 – 69</p>
                  </div>
                  <div className="rounded-[6px] border border-[var(--color-border)] p-3 bg-[var(--color-surface-raised)]">
                    <p className="text-[11.5px] uppercase tracking-wide font-semibold text-[var(--color-red)]">High Risk</p>
                    <p className="mt-1 text-[16px] font-bold text-[var(--color-text)]">70 – 100</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-[var(--color-border)] pt-5">
                <h4 className="text-[13px] font-medium text-[var(--color-text)] mb-3">Workflow Rules</h4>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-text)]">High-risk review</p>
                      <p className="text-[12px] text-[var(--color-text-dim)]">Require manual underwriter review for high-risk applications.</p>
                    </div>
                    <span className="px-2 py-1 rounded-[4px] bg-[var(--color-emerald-dim)] text-[var(--color-emerald)] text-[11px] font-semibold uppercase tracking-wider">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-text)]">High-risk approval restriction</p>
                      <p className="text-[12px] text-[var(--color-text-dim)]">High-risk policies require authorized Senior Underwriter approval.</p>
                    </div>
                    <span className="px-2 py-1 rounded-[4px] bg-[var(--color-emerald-dim)] text-[var(--color-emerald)] text-[11px] font-semibold uppercase tracking-wider">Enabled</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-5">
                <h4 className="text-[13px] font-medium text-[var(--color-text)] mb-3">Minimum Information Required</h4>
                <ul className="list-disc pl-5 text-[12.5px] text-[var(--color-text-muted)] space-y-1">
                  <li>Farm location (Lat/Lng)</li>
                  <li>Insured Crop Type</li>
                  <li>Farm boundary polygon (Area &ge; 0.1 ha)</li>
                  <li>Applicant identifying information</li>
                </ul>
              </div>
            </div>
          </Card>
        );

      case "pricing":
        return (
          <Card>
            <CardHeader title="Pricing Rules" subtitle="Base premium and risk multipliers currently active." />
            <div className="px-5 py-5 flex flex-col gap-6">
              <div>
                <h4 className="text-[13px] font-medium text-[var(--color-text)] mb-3">Base Premium (Default)</h4>
                <div className="rounded-[6px] border border-[var(--color-border)] p-3 bg-[var(--color-surface-raised)] w-max">
                  <p className="text-[11.5px] uppercase tracking-wide font-medium text-[var(--color-text-dim)]">Fallback Base Rate</p>
                  <p className="mt-1 text-[17px] font-bold text-[var(--color-text)]">₹ {DEFAULT_CROP_BASE_RATE.toLocaleString()} <span className="text-[13px] font-normal text-[var(--color-text-muted)]">/ ha</span></p>
                </div>
                <p className="mt-2 text-[12px] text-[var(--color-text-dim)]">Specific crops have distinct base rates defined in the pricing engine.</p>
              </div>

              <div className="border-t border-[var(--color-border)] pt-5">
                <h4 className="text-[13px] font-medium text-[var(--color-text)] mb-3">Risk Multipliers</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[6px] border border-[var(--color-border)] p-3 bg-[var(--color-surface-raised)]">
                    <p className="text-[11.5px] uppercase tracking-wide font-semibold text-[var(--color-emerald)]">Low Risk</p>
                    <p className="mt-1 text-[16px] font-bold text-[var(--color-text)]">{RISK_TIER_MULTIPLIERS.LOW.multiplier.toFixed(2)} ×</p>
                  </div>
                  <div className="rounded-[6px] border border-[var(--color-border)] p-3 bg-[var(--color-surface-raised)]">
                    <p className="text-[11.5px] uppercase tracking-wide font-semibold text-[var(--color-amber)]">Moderate Risk</p>
                    <p className="mt-1 text-[16px] font-bold text-[var(--color-text)]">{RISK_TIER_MULTIPLIERS.MODERATE.multiplier.toFixed(2)} ×</p>
                  </div>
                  <div className="rounded-[6px] border border-[var(--color-border)] p-3 bg-[var(--color-surface-raised)]">
                    <p className="text-[11.5px] uppercase tracking-wide font-semibold text-[var(--color-red)]">High Risk</p>
                    <p className="mt-1 text-[16px] font-bold text-[var(--color-text)]">{RISK_TIER_MULTIPLIERS.HIGH.multiplier.toFixed(2)} ×</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-4 flex items-center justify-between">
                <p className="text-[12px] text-[var(--color-text-muted)]">Pricing rules are defined securely in the underwriting core.</p>
                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-emerald)]">
                      <CheckCircle2 size={14} /> Changes saved successfully.
                    </span>
                  )}
                  <button onClick={handleFakeSave} disabled={isSaving} className="rounded-[6px] bg-[var(--color-emerald)] hover:bg-[var(--color-accent)] px-4 py-1.5 text-[12.5px] font-medium text-[var(--color-primary-fg)] transition-colors disabled:opacity-70">
                    {isSaving ? "Saving..." : "Save Pricing Rules"}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        );

      case "notifications":
        return (
          <Card>
            <CardHeader title="Notifications" subtitle="Manage workflow and application alerts." />
            <div className="px-5 py-5 flex flex-col gap-4">
              {[
                { label: "Underwriting Alerts", desc: "Notify when a new application requires review." },
                { label: "High Risk Alerts", desc: "Notify when a high-risk policy is detected." },
                { label: "Policy Approval Notifications", desc: "Notify when a policy is approved." },
                { label: "Policy Rejection Notifications", desc: "Notify when a policy is rejected." },
                { label: "Certificate Generated", desc: "Notify when an approved policy certificate is generated." },
                { label: "Claim/Anomaly Alerts", desc: "Notify when an important claim or anomaly requires attention." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[13px] font-medium text-[var(--color-text)]">{item.label}</p>
                    <p className="text-[12px] text-[var(--color-text-dim)]">{item.desc}</p>
                  </div>
                  <span className="px-2 py-1 rounded-[4px] bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] text-[11px] font-semibold uppercase tracking-wider">Unavailable</span>
                </div>
              ))}
            </div>
          </Card>
        );

      case "security":
        return (
          <Card>
            <CardHeader title="Security" subtitle="Account access and session management." />
            <div className="px-5 py-5 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-5">
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text)]">Password</p>
                  <p className="text-[12px] text-[var(--color-text-dim)]">Update your account password.</p>
                </div>
                <button disabled className="rounded-[6px] border border-[var(--color-border-strong)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed">
                  Change Password
                </button>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-5">
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text)]">Two-Factor Authentication</p>
                  <p className="text-[12px] text-[var(--color-text-dim)]">Add an extra layer of security to your account.</p>
                </div>
                <button disabled className="rounded-[6px] border border-[var(--color-border-strong)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed">
                  Enable 2FA
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text)]">Active Sessions</p>
                  <p className="text-[12px] text-[var(--color-text-dim)]">Manage devices currently logged in.</p>
                </div>
                <button disabled className="rounded-[6px] border border-[var(--color-border-strong)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed">
                  View Sessions
                </button>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Settings</h1>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
          Manage your organization workspace, underwriting rules, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-col gap-1">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeTab === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
                }`}
              >
                <Icon size={15} className={isActive ? "text-[var(--color-emerald)]" : "text-[var(--color-text-dim)]"} />
                {section.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">{renderContent()}</div>
      </div>
    </div>
  );
}
