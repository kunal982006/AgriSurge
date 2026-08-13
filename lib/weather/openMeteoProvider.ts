import { CurrentWeather, WeatherProvider } from "./types";

// Open-Meteo requires no API key, used as the default live provider.
// Structured so a key-based provider can be swapped in via provider.ts
// without touching any UI code.
export const openMeteoProvider: WeatherProvider = {
  name: "Open-Meteo",
  async getCurrentWeather(lat, lng) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation`;

    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed with status ${res.status}`);
    }
    const data = await res.json();

    const result: CurrentWeather = {
      temperatureC: data.current?.temperature_2m ?? 0,
      rainfallMm24h: data.current?.precipitation ?? 0,
      humidityPct: data.current?.relative_humidity_2m ?? 0,
      windSpeedKph: data.current?.wind_speed_10m ?? 0,
      status: "live",
      source: "Open-Meteo",
      observedAt: data.current?.time ?? new Date().toISOString(),
    };
    return result;
  },
};
