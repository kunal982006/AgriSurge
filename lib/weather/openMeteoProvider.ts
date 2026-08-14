import { CurrentWeather, ForecastDay, ShortTermForecast, WeatherProvider } from "./types";

// Open-Meteo provides live current conditions and 7-day forecast out-of-the-box.
export const openMeteoProvider: WeatherProvider = {
  name: "Open-Meteo",
  async getCurrentWeather(lat, lng) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;

    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed with status ${res.status}`);
    }
    const data = await res.json();

    // Parse 7-day forecast if available
    let forecast: ShortTermForecast | null = null;
    if (data.daily?.time && Array.isArray(data.daily.time)) {
      const dates: string[] = data.daily.time;
      const tMax: number[] = data.daily.temperature_2m_max || [];
      const tMin: number[] = data.daily.temperature_2m_min || [];
      const pSum: number[] = data.daily.precipitation_sum || [];
      const wMax: number[] = data.daily.wind_speed_10m_max || [];

      const days: ForecastDay[] = dates.map((dateStr, i) => ({
        date: dateStr,
        tempMaxC: tMax[i] ?? 0,
        tempMinC: tMin[i] ?? 0,
        precipitationMm: pSum[i] ?? 0,
        maxWindSpeedKph: wMax[i] ?? 0,
      }));

      const totalRainfallMm7d = days.reduce((sum, d) => sum + d.precipitationMm, 0);
      const avgTempMaxC = days.length > 0 ? days.reduce((sum, d) => sum + d.tempMaxC, 0) / days.length : 0;
      const avgTempMinC = days.length > 0 ? days.reduce((sum, d) => sum + d.tempMinC, 0) / days.length : 0;

      forecast = {
        status: "live",
        source: "Open-Meteo (7-Day Forecast)",
        days,
        totalRainfallMm7d: Number(totalRainfallMm7d.toFixed(1)),
        avgTempMaxC: Number(avgTempMaxC.toFixed(1)),
        avgTempMinC: Number(avgTempMinC.toFixed(1)),
      };
    }

    const result: CurrentWeather = {
      temperatureC: data.current?.temperature_2m ?? 0,
      rainfallMm24h: data.current?.precipitation ?? 0,
      humidityPct: data.current?.relative_humidity_2m ?? 0,
      windSpeedKph: data.current?.wind_speed_10m ?? 0,
      status: "live",
      source: "Open-Meteo",
      observedAt: data.current?.time ?? new Date().toISOString(),
      forecast,
    };

    return result;
  },
};
