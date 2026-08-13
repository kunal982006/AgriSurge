export type RiskFactor = {
  name: string;
  contribution: number; // 0-1, relative contribution to the score
  direction: "increases_risk" | "decreases_risk";
};

export type RiskPredictionInput = {
  latitude: number;
  longitude: number;
  crop: string;
  soilType?: string;
  irrigationType?: string;
  rainfallMm: number;
  temperatureC: number;
  humidityPct: number;
  soilMoisturePct?: number;
  ndvi?: number | null;
};

export type RiskPredictionResult = {
  riskScore: number;
  riskLevel: "low" | "moderate" | "high";
  modelVersion: string;
  modelName: string;
  generatedAt: string;
  factors: RiskFactor[];
  isMock: boolean;
};
