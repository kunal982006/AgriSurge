import { CurrentWeather } from "./types";
import { openMeteoProvider } from "./openMeteoProvider";
import { openWeatherMapProvider } from "./openWeatherMapProvider";

export async function getCurrentWeather(lat: number, lng: number): Promise<CurrentWeather> {
  const hasWeatherKey = !!process.env.WEATHER_API_KEY;
  const primaryProvider = hasWeatherKey ? openWeatherMapProvider : openMeteoProvider;

  try {
    const weather = await primaryProvider.getCurrentWeather(lat, lng);
    
    // If OWM doesn't return a forecast, fallback to fetching it from Open-Meteo
    if (!weather.forecast && hasWeatherKey) {
      try {
        const meteoWeather = await openMeteoProvider.getCurrentWeather(lat, lng);
        weather.forecast = meteoWeather.forecast;
      } catch (err) {
        console.warn("Fallback forecast fetch failed", err);
      }
    }
    
    return weather;
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
