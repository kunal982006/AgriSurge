export type RiskFactor = {
  name: string;
  contribution: number; // 0-1, relative contribution to the score
  direction: "increases_risk" | "decreases_risk";
};

export type RiskPredictionInput = {
  latitude: number;
  longitude: number;
  district?: string;
  taluka?: string;
  village?: string;
  crop: string;
  cropVariety?: string;
  sowingDate?: string;
  growthStage?: string;
  soilType?: string;
  irrigationType?: string;
  areaAcres?: number;
  rainfallMm: number;
  temperatureC: number;
  humidityPct: number;
  soilMoisturePct?: number;
  ndvi?: number | null;
  v2Features?: Record<string, number | null> | null;
};

export type ModelMetadataInfo = {
  modelName: string;
  modelType: string;
  modelVersion: string;
  target: string;
  geographicLevel: string;
  trainedAt: string;
  trainRows: number;
  testYears: string;
};

export type RiskPredictionResult = {
  riskScore: number; // 0 - 100 integer
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "low" | "moderate" | "high";
  predictedYieldKgHa: number;
  expectedYieldKgHa: number;
  yieldDeviationPct: number;
  riskBasis: string;
  modelMetadata: ModelMetadataInfo;
  generatedAt: string;
  factors: RiskFactor[];
  isMock: boolean;
  district?: string;
  crop?: string;
  error?: string;
};
