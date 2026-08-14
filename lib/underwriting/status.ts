export type UnderwritingStatus = "DRAFT" | "UNDER_REVIEW" | "NEEDS_INFORMATION" | "APPROVED" | "REJECTED";

export const UNDERWRITING_STATUS_CONFIG: Record<
  UnderwritingStatus,
  { label: string; badgeClass: string }
> = {
  DRAFT: { label: "Draft", badgeClass: "bg-gray-500/10 text-gray-400 border-gray-500/30" },
  UNDER_REVIEW: { label: "Under Review", badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  NEEDS_INFORMATION: { label: "Needs Information", badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  APPROVED: { label: "Approved", badgeClass: "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)] border-[var(--color-emerald)]/30" },
  REJECTED: { label: "Rejected", badgeClass: "bg-[var(--color-red-dim)] text-[var(--color-red)] border-[var(--color-red)]/30" },
};
