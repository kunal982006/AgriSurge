import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import util from "util";

const execFilePromise = util.promisify(execFile);

// In-memory cache for grid calculations: key = lat_lng_crop_season
const imdCache = new Map<string, any>();

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const crop = req.nextUrl.searchParams.get("crop") || "RICE";
  const season = req.nextUrl.searchParams.get("season") || "Kharif";

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { available: false, error: "lat and lng query params are required." },
      { status: 400 }
    );
  }

  // Check cache (rounded to 3 decimal places for coordinate stability)
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}_${crop}_${season}`;
  if (imdCache.has(cacheKey)) {
    return NextResponse.json(imdCache.get(cacheKey));
  }

  try {
    const scriptPath = path.join(process.cwd(), "lib", "weather", "query_imd.py");
    const { stdout } = await execFilePromise("python", [
      scriptPath,
      "--lat", String(lat),
      "--lng", String(lng),
      "--crop", crop,
      "--season", season,
    ], {
      timeout: 10000,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    const result = JSON.parse(stdout.trim());
    if (result.available) {
      imdCache.set(cacheKey, result);
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Historical IMD weather lookup error:", err);
    return NextResponse.json({
      available: false,
      error: "Historical weather data temporarily unavailable for selected location",
      sourceLabel: "IMD Historical Weather",
    });
  }
}
