import { CurrentWeather } from "./types";
import { openMeteoProvider } from "./openMeteoProvider";
import { openWeatherMapProvider } from "./openWeatherMapProvider";

export async function getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather> {
  const hasWeatherKey = !!process.env.WEATHER_API_KEY;
  const primaryProvider = hasWeatherKey ? openWeatherMapProvider : openMeteoProvider;

  try {
    return await primaryProvider.getCurrentWeather(lat, lng);
  } catch (err) {
    console.warn(`Primary weather provider (${primaryProvider.name}) failed, falling back to Open-Meteo:`, err);
    try {
      return await openMeteoProvider.getCurrentWeather(lat, lng);
    } catch {
      return {
        temperatureC: 0,
        rainfallMm24h: 0,
        humidityPct: 0,
        windSpeedKph: 0,
        status: "error",
        source: primaryProvider.name,
        observedAt: new Date().toISOString(),
      };
    }
  }
}
