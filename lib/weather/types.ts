export type WeatherSourceStatus = "live" | "not_configured" | "error";

export type CurrentWeather = {
  temperatureC: number;
  rainfallMm24h: number;
  humidityPct: number;
  windSpeedKph: number;
  status: WeatherSourceStatus;
  source: string;
  observedAt: string;
};

export type WeatherProvider = {
  name: string;
  getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather>;
};
