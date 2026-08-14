import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define cache interface
interface Village {
  code: string;
  nameEnglish: string;
  nameLocal: string;
}

interface LocationDataCache {
  districts: string[];
  talukas: Record<string, string[]>; // district -> list of talukas
  villages: Record<string, Village[]>; // "district:taluka" -> list of villages
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  isFallback?: boolean;
}

// Global cache variables to avoid re-parsing and re-requesting
let cache: LocationDataCache | null = null;
const geocodeCache = new Map<string, GeocodeResult>();

function loadAndParseCSV(): LocationDataCache {
  if (cache) return cache;

  try {
    const csvPath = path.join(process.cwd(), "maharashtravillage.csv");
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, "utf8");
    const lines = csvContent.split(/\r?\n/);

    const districtsSet = new Set<string>();
    const talukasMap = new Map<string, Set<string>>(); // district -> Set of talukas
    const villagesMap = new Map<string, Village[]>(); // "district:taluka" -> list of villages

    // Column indexes based on header:
    // villageCode = 0
    // villageNameEnglish = 1
    // villageNameLocal = 2
    // subdistrictNameEnglish = 5 (Taluka)
    // districtNameEnglish = 9

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple comma splitting.
      const cols = line.split(",");
      if (cols.length < 10) continue;

      const villageCode = cols[0]?.trim();
      const villageNameEnglish = cols[1]?.trim();
      const villageNameLocal = cols[2]?.trim();
      const subdistrictNameEnglish = cols[5]?.trim();
      const districtNameEnglish = cols[9]?.trim();

      if (!districtNameEnglish || !subdistrictNameEnglish || !villageNameEnglish) {
        continue;
      }

      districtsSet.add(districtNameEnglish);

      if (!talukasMap.has(districtNameEnglish)) {
        talukasMap.set(districtNameEnglish, new Set<string>());
      }
      talukasMap.get(districtNameEnglish)!.add(subdistrictNameEnglish);

      const key = `${districtNameEnglish.toLowerCase()}:${subdistrictNameEnglish.toLowerCase()}`;
      if (!villagesMap.has(key)) {
        villagesMap.set(key, []);
      }
      villagesMap.get(key)!.push({
        code: villageCode,
        nameEnglish: villageNameEnglish,
        nameLocal: villageNameLocal,
      });
    }

    // Sort outputs
    const districts = Array.from(districtsSet).sort();
    
    const talukas: Record<string, string[]> = {};
    talukasMap.forEach((set, dist) => {
      talukas[dist] = Array.from(set).sort();
    });

    const villages: Record<string, Village[]> = {};
    villagesMap.forEach((list, key) => {
      // Sort villages alphabetically by English name
      villages[key] = list.sort((a, b) => a.nameEnglish.localeCompare(b.nameEnglish));
    });

    cache = { districts, talukas, villages };
    return cache;
  } catch (error) {
    console.error("Error parsing village CSV:", error);
    return { districts: [], talukas: {}, villages: {} };
  }
}

async function queryNominatim(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "AgriSurge/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Nominatim request failed");
  }

  const data = await response.json();
  if (data && data.length > 0) {
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const district = searchParams.get("district");
  const taluka = searchParams.get("taluka");
  const query = searchParams.get("query") || "";

  const data = loadAndParseCSV();

  if (type === "districts") {
    return NextResponse.json({ districts: data.districts });
  }

  if (type === "talukas") {
    if (!district) {
      return NextResponse.json({ error: "District parameter required" }, { status: 400 });
    }
    const list = data.talukas[district] || [];
    return NextResponse.json({ talukas: list });
  }

  if (type === "villages") {
    if (!district || !taluka) {
      return NextResponse.json({ error: "District and Taluka parameters are required" }, { status: 400 });
    }

    const key = `${district.toLowerCase()}:${taluka.toLowerCase()}`;
    const list = data.villages[key] || [];

    // If query is provided, filter the results
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      const filtered = list.filter(
        (v) =>
          v.nameEnglish.toLowerCase().includes(lowerQuery) ||
          v.nameLocal.toLowerCase().includes(lowerQuery)
      );
      // Return first 50 results to avoid UI bottlenecks
      return NextResponse.json({ villages: filtered.slice(0, 50) });
    }

    return NextResponse.json({ villages: list.slice(0, 50) });
  }

  if (type === "geocode") {
    if (!query.trim()) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
    }

    const cacheKey = query.trim().toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      return NextResponse.json(geocodeCache.get(cacheKey));
    }

    try {
      // 1. Try geocoding the specific village query
      let result = await queryNominatim(query);
      
      if (result) {
        geocodeCache.set(cacheKey, result);
        return NextResponse.json(result);
      }

      // 2. If specific village fails, parse and try geocoding the Taluka center
      // Query structure: Village, Taluka, District, Maharashtra, India
      const parts = query.split(",");
      if (parts.length >= 4) {
        const talukaQuery = parts.slice(1).join(",").trim(); // Taluka, District, Maharashtra, India
        const talukaResult = await queryNominatim(talukaQuery);
        
        if (talukaResult) {
          result = {
            ...talukaResult,
            isFallback: true,
          };
          geocodeCache.set(cacheKey, result);
          return NextResponse.json(result);
        }
      }

      return NextResponse.json({ error: "No matching location found" }, { status: 404 });
    } catch (error) {
      console.error("Server-side Nominatim geocoding error:", error);
      return NextResponse.json({ error: "Geocoding request failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
}
