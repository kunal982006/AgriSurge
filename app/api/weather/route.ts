import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeather } from "@/lib/weather/provider";
import { CurrentWeather } from "@/lib/weather/types";

// In-memory cache: key = "lat_lng" (rounded to 2 decimals), value = { data, timestamp }
const weatherCache = new Map<string, { data: CurrentWeather; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng query params are required." }, { status: 400 });
  }

  // Check cache (round to 2 decimal places for stability)
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ weather: cached.data });
  }

  const weather = await getCurrentWeather(lat, lng);

  // Store in cache
  weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });

  return NextResponse.json({ weather });
}
