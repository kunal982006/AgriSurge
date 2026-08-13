// Demo/UI-only data. Not connected to the database or ML service.
// Replace with real queries once db/schema.ts and the ML service are wired up.

export type RiskLevel = "low" | "moderate" | "high";

export type Farm = {
  id: string;
  name: string;
  farmer: string;
  location: string;
  region: string;
  crop: string;
  areaAcres: number;
  riskScore: number; // 0-1
  riskLevel: RiskLevel;
  recommendedPremium: number;
  policyStatus: "active" | "pending" | "expired" | "under_review";
  lastAssessment: string;
  coordinates: [number, number]; // [lng, lat]
};

function levelFromScore(score: number): RiskLevel {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "moderate";
  return "low";
}

export const DEMO_FARMS: Farm[] = [
  {
    id: "F-10293",
    name: "Kadam Cotton Fields",
    farmer: "Vikram Kadam",
    location: "Yavatmal, Maharashtra",
    region: "Vidarbha",
    crop: "Cotton",
    areaAcres: 12.4,
    riskScore: 0.82,
    riskLevel: "high",
    recommendedPremium: 30000,
    policyStatus: "active",
    lastAssessment: "2026-08-09",
    coordinates: [78.1307, 20.3888],
  },
  {
    id: "F-10188",
    name: "Patil Soybean Farm",
    farmer: "Sunita Patil",
    location: "Latur, Maharashtra",
    region: "Marathwada",
    crop: "Soybean",
    areaAcres: 8.1,
    riskScore: 0.58,
    riskLevel: "moderate",
    recommendedPremium: 15000,
    policyStatus: "active",
    lastAssessment: "2026-08-08",
    coordinates: [76.5604, 18.4088],
  },
  {
    id: "F-10041",
    name: "Deshmukh Sugarcane Estate",
    farmer: "Rahul Deshmukh",
    location: "Kolhapur, Maharashtra",
    region: "Western Maharashtra",
    crop: "Sugarcane",
    areaAcres: 21.7,
    riskScore: 0.21,
    riskLevel: "low",
    recommendedPremium: 10000,
    policyStatus: "active",
    lastAssessment: "2026-08-07",
    coordinates: [74.2433, 16.705],
  },
  {
    id: "F-10305",
    name: "Shinde Paddy Fields",
    farmer: "Anita Shinde",
    location: "Chandrapur, Maharashtra",
    region: "Vidarbha",
    crop: "Paddy",
    areaAcres: 6.3,
    riskScore: 0.74,
    riskLevel: "high",
    recommendedPremium: 30000,
    policyStatus: "under_review",
    lastAssessment: "2026-08-10",
    coordinates: [79.2961, 19.9615],
  },
  {
    id: "F-10077",
    name: "Jadhav Groundnut Farm",
    farmer: "Prakash Jadhav",
    location: "Ahilyanagar, Maharashtra",
    region: "Western Maharashtra",
    crop: "Groundnut",
    areaAcres: 9.9,
    riskScore: 0.36,
    riskLevel: "low",
    recommendedPremium: 10000,
    policyStatus: "pending",
    lastAssessment: "2026-08-06",
    coordinates: [74.7496, 19.0948],
  },
  {
    id: "F-10152",
    name: "More Onion Fields",
    farmer: "Geeta More",
    location: "Nashik, Maharashtra",
    region: "North Maharashtra",
    crop: "Onion",
    areaAcres: 5.5,
    riskScore: 0.63,
    riskLevel: "moderate",
    recommendedPremium: 15000,
    policyStatus: "active",
    lastAssessment: "2026-08-05",
    coordinates: [73.7898, 20.0059],
  },
];

export function riskLevelFrom(score: number): RiskLevel {
  return levelFromScore(score);
}

export const RISK_DISTRIBUTION = [
  { level: "Low", count: 142, fill: "var(--color-emerald)" },
  { level: "Moderate", count: 68, fill: "var(--color-amber)" },
  { level: "High", count: 31, fill: "var(--color-red)" },
];

export const RISK_TREND = [
  { month: "Mar", avgRisk: 0.31 },
  { month: "Apr", avgRisk: 0.34 },
  { month: "May", avgRisk: 0.4 },
  { month: "Jun", avgRisk: 0.52 },
  { month: "Jul", avgRisk: 0.49 },
  { month: "Aug", avgRisk: 0.46 },
];

export const PREMIUM_TREND = [
  { month: "Mar", premium: 1120000 },
  { month: "Apr", premium: 1180000 },
  { month: "May", premium: 1340000 },
  { month: "Jun", premium: 1560000 },
  { month: "Jul", premium: 1490000 },
  { month: "Aug", premium: 1610000 },
];

export const REGIONAL_RISK = [
  { region: "Vidarbha", avgRisk: 0.61 },
  { region: "Marathwada", avgRisk: 0.55 },
  { region: "North Maharashtra", avgRisk: 0.47 },
  { region: "Western Maharashtra", avgRisk: 0.29 },
  { region: "Konkan", avgRisk: 0.22 },
];

export const CROP_RISK = [
  { crop: "Cotton", avgRisk: 0.66 },
  { crop: "Paddy", avgRisk: 0.58 },
  { crop: "Onion", avgRisk: 0.52 },
  { crop: "Soybean", avgRisk: 0.44 },
  { crop: "Groundnut", avgRisk: 0.33 },
  { crop: "Sugarcane", avgRisk: 0.19 },
];

export type AlertItem = {
  id: string;
  severity: "high" | "medium" | "info";
  message: string;
  farmId?: string;
  timestamp: string;
  read: boolean;
};

export const DEMO_ALERTS: AlertItem[] = [
  {
    id: "A-1",
    severity: "high",
    message: "Drought risk increased for Farm F-10293 following 12 days without rainfall.",
    farmId: "F-10293",
    timestamp: "2026-08-12T06:40:00+05:30",
    read: false,
  },
  {
    id: "A-2",
    severity: "medium",
    message: "Heavy rainfall forecast for Vidarbha region over the next 48 hours.",
    timestamp: "2026-08-11T18:05:00+05:30",
    read: false,
  },
  {
    id: "A-3",
    severity: "info",
    message: "Risk assessment completed for Farm F-10152.",
    farmId: "F-10152",
    timestamp: "2026-08-11T10:12:00+05:30",
    read: true,
  },
  {
    id: "A-4",
    severity: "medium",
    message: "Soil moisture below threshold for Farm F-10305.",
    farmId: "F-10305",
    timestamp: "2026-08-10T09:30:00+05:30",
    read: true,
  },
];
