import { CurrentWeather, WeatherProvider } from "./types";

export const openWeatherMapProvider: WeatherProvider = {
  name: "OpenWeatherMap",
  async getCurrentWeather(lat, lng) {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error("WEATHER_API_KEY is not set");
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) {
      throw new Error(`OpenWeatherMap request failed with status ${res.status}`);
    }
    const data = await res.json();

    const rainfall = data.rain?.["1h"] ? data.rain["1h"] * 24 : (data.rain?.["3h"] ? data.rain["3h"] * 8 : 0);
    const windKph = (data.wind?.speed ?? 0) * 3.6;

    const result: CurrentWeather = {
      temperatureC: data.main?.temp ?? 0,
      rainfallMm24h: Math.round(rainfall * 10) / 10,
      humidityPct: data.main?.humidity ?? 0,
      windSpeedKph: Math.round(windKph),
      status: "live",
      source: "OpenWeatherMap",
      observedAt: new Date(data.dt * 1000).toISOString(),
    };
    return result;
  },
};
