import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface CropItem {
  name: string;
  category: string;
}

interface CropDataCache {
  categories: string[];
  crops: CropItem[];
  varieties: Record<string, string[]>; // cropName -> array of varieties
}

let cache: CropDataCache | null = null;

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function loadAndParseCropsCSV(): CropDataCache {
  if (cache) return cache;

  try {
    let csvPath = path.join(process.cwd(), "cropdetails.csv");
    if (!fs.existsSync(csvPath)) {
      csvPath = path.join(process.cwd(), "cropdetails_agrisurge.csv");
    }

    if (!fs.existsSync(csvPath)) {
      throw new Error("Crop details CSV file not found");
    }

    const fileContent = fs.readFileSync(csvPath, "utf8");
    const lines = fileContent.split(/\r?\n/);

    const cropsMap = new Map<string, string>(); // cropName -> category
    const varietiesMap = new Map<string, Set<string>>(); // cropName -> Set of varieties
    const categoriesSet = new Set<string>();

    // Column indexes based on header:
    // crop_category = 0
    // crop_name = 1
    // variety_name = 4

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = splitCSVLine(line);
      if (cols.length < 5) continue;

      const category = cols[0];
      const cropName = cols[1];
      const varietyName = cols[4];

      if (!cropName) continue;

      const normalizedCategory = category || "Other";

      // Deduplicate crops and keep category mapping
      if (!cropsMap.has(cropName)) {
        cropsMap.set(cropName, normalizedCategory);
      }

      categoriesSet.add(normalizedCategory);

      if (varietyName) {
        if (!varietiesMap.has(cropName)) {
          varietiesMap.set(cropName, new Set<string>());
        }
        varietiesMap.get(cropName)!.add(varietyName);
      }
    }

    // Convert maps to sorted arrays
    const categoriesList = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b));
    const cropsList: CropItem[] = Array.from(cropsMap.entries())
      .map(([name, category]) => ({ name, category }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const varieties: Record<string, string[]> = {};
    varietiesMap.forEach((set, crop) => {
      varieties[crop] = Array.from(set).sort((a, b) => a.localeCompare(b));
    });

    cache = { categories: categoriesList, crops: cropsList, varieties };
    return cache;
  } catch (error) {
    console.error("Error loading crop CSV:", error);
    return { categories: [], crops: [], varieties: {} };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const crop = searchParams.get("crop");
  const category = searchParams.get("category");

  const data = loadAndParseCropsCSV();

  if (type === "categories") {
    return NextResponse.json({ categories: data.categories });
  }

  if (type === "list") {
    let filteredCrops = data.crops;
    if (category) {
      filteredCrops = filteredCrops.filter(
        (c) => c.category.toLowerCase() === category.toLowerCase()
      );
    }
    return NextResponse.json({ crops: filteredCrops });
  }

  if (type === "varieties") {
    if (!crop) {
      return NextResponse.json({ error: "Crop parameter is required" }, { status: 400 });
    }
    const list = data.varieties[crop] || [];
    return NextResponse.json({ varieties: list });
  }

  return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
}
