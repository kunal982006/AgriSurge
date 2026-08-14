export type WeatherSourceStatus = "live" | "not_configured" | "error";

export type ForecastDay = {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  maxWindSpeedKph: number;
};

export type ShortTermForecast = {
  status: WeatherSourceStatus;
  source: string;
  days: ForecastDay[];
  totalRainfallMm7d: number;
  avgTempMaxC: number;
  avgTempMinC: number;
};

export type CurrentWeather = {
  temperatureC: number;
  rainfallMm24h: number;
  humidityPct: number;
  windSpeedKph: number;
  status: WeatherSourceStatus;
  source: string;
  observedAt: string;
  forecast?: ShortTermForecast | null;
};

export type HistoricalImdReading = {
  available: boolean;
  gridLat?: number;
  gridLon?: number;
  distanceKm?: number;
  referenceYear?: number;
  yearsAvailable?: string;
  crop?: string;
  season?: string;
  seasonMonthsLabel?: string;
  annualRainfallMm?: number;
  seasonalRainfallMm?: number;
  kharifRainfallMm?: number;
  rabiRainfallMm?: number;
  rainyDays?: number;
  dryDays?: number;
  maxDailyRainfallMm?: number;
  maxConsecutiveRainyDays?: number;
  maxConsecutiveDryDays?: number;
  rf7dPreharvestMm?: number | null;
  rf30dPreharvestMm?: number | null;
  rf90dPreharvestMm?: number | null;
  sourceLabel?: string;
  error?: string;
  v2_features?: Record<string, number | null>;
};

export type WeatherProvider = {
  name: string;
  getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather>;
};
