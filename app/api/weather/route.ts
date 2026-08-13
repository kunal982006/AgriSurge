import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeather } from "@/lib/weather/provider";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng query params are required." }, { status: 400 });
  }

  const weather = await getCurrentWeather(lat, lng);
  return NextResponse.json({ weather });
}
