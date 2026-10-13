// Insurance authentication helper & session management
export interface InsuranceUser {
  phone: string;
  name: string;
  role: string;
  organization: string;
  isDefault?: boolean;
}

export const DEFAULT_INSURANCE_USER: InsuranceUser = {
  phone: "8767476106",
  name: "Ronit A.",
  role: "Underwriting Manager",
  organization: "Deccan Mutual",
  isDefault: true,
};

const INSURANCE_SESSION_KEY = "agrisurge_insurance_session";
const INSURANCE_USERS_REGISTRY_KEY = "agrisurge_registered_insurers";

export function getInsuranceSession(): InsuranceUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INSURANCE_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return null;
}

export function setInsuranceSession(user: InsuranceUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INSURANCE_SESSION_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearInsuranceSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(INSURANCE_SESSION_KEY);
  } catch {
    // ignore
  }
}
