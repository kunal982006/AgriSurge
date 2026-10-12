import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { farmers, farms, weatherData as weatherDataTable, farmerAssessments } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * POST /api/farmer/assessment
 * Persists a complete farmer assessment to the database.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      farmerId,
      district,
      taluka,
      village,
      latitude,
      longitude,
      farmImageUrl,
      soilImageUrl,
      soilType,
      irrigationType,
      crop,
      selectedCrop,
      areaAcres,
      recommendations,
      weather,
      cropGuidance,
      language,
      premiumDetails,
      modelMetadata,
    } = body;

    const chosenCrop = (selectedCrop || crop || "").trim();

    if (!farmerId) {
      return NextResponse.json({ error: "farmerId is required.", success: false }, { status: 400 });
    }

    if (!chosenCrop) {
      return NextResponse.json({ error: "A selected crop is required to save an assessment.", success: false }, { status: 400 });
    }

    const db = getDb();
    const numFarmerId = Number(farmerId);

    // 1. Verify farmer exists or ensure record
    const farmerRecord = await db
      .select()
      .from(farmers)
      .where(eq(farmers.id, numFarmerId))
      .limit(1);

    let farmerName = "Farmer";
    let farmerPhone = "";
    if (farmerRecord.length > 0) {
      farmerName = farmerRecord[0].name || "Farmer";
      farmerPhone = farmerRecord[0].phone || "";
    }

    // 2. Generate unique assessment code
    const timestampSuffix = Date.now().toString().slice(-6);
    const assessmentCode = `AS-${numFarmerId}-${timestampSuffix}`;
    const farmCode = `F-${numFarmerId}-${timestampSuffix}`;

    const locationName = [village, taluka, district, "Maharashtra"]
      .filter(Boolean)
      .join(", ") || "Maharashtra";

    const premiumAmount = premiumDetails?.recommendedPremium ?? premiumDetails?.finalSurgePremium ?? 0;

    // 3. Persist to farmerAssessments table
    const insertedAssessment = await db
      .insert(farmerAssessments)
      .values({
        assessmentCode,
        farmerId: numFarmerId,
        farmerName,
        farmerPhone,
        district: district || "",
        taluka: taluka || "",
        village: village || "",
        locationName,
        latitude: latitude ? String(latitude) : "0",
        longitude: longitude ? String(longitude) : "0",
        areaAcres: String(areaAcres || 1.0),
        irrigationType: irrigationType || "Rainfed",
        soilType: soilType || "Black Soil",
        farmImageUrl: farmImageUrl || null,
        soilImageUrl: soilImageUrl || null,
        weatherData: weather || null,
        recommendations: recommendations || null,
        selectedCrop: chosenCrop,
        selectedLanguage: language || "mr",
        cropGuidance: cropGuidance || null,
        premiumEstimate: String(premiumAmount),
        pricingDetails: premiumDetails || null,
        modelMetadata: modelMetadata || {
          engine: "AgriSurge Agronomic & Risk Engine",
          version: "v2.0",
          nutrientsTested: false,
        },
        status: "completed",
      })
      .returning();

    const savedRecord = insertedAssessment[0];

    // 4. Also insert into farms & weatherData for relational consistency
    try {
      const insertedFarm = await db
        .insert(farms)
        .values({
          farmCode,
          farmerId: numFarmerId,
          name: `${farmerName}'s Farm`,
          region: district || "Maharashtra",
          location: locationName,
          crop: chosenCrop.toUpperCase(),
          areaAcres: String(areaAcres || 1.0),
          latitude: latitude ? String(latitude) : "0",
          longitude: longitude ? String(longitude) : "0",
          soilType: soilType || null,
          irrigationType: irrigationType || null,
          boundaryImage: farmImageUrl || null,
        })
        .returning();

      if (weather && insertedFarm[0]?.id) {
        await db.insert(weatherDataTable).values({
          farmId: insertedFarm[0].id,
          temperatureC: String(weather.temperatureC ?? 0),
          rainfallMm: String(weather.rainfallMm ?? 0),
          humidityPct: String(weather.humidityPct ?? 0),
          windSpeedKph: String(weather.windSpeedKph ?? 0),
          source: weather.source || "Open-Meteo & IMD",
          status: "connected",
        });
      }
    } catch (relationalErr) {
      console.warn("[Assessment POST] Optional relational insertion warning:", relationalErr);
    }

    return NextResponse.json({
      success: true,
      assessmentId: savedRecord.assessmentCode,
      id: savedRecord.id,
      assessment: savedRecord,
      message: "Assessment saved successfully to database.",
    });
  } catch (err) {
    console.error("[Farmer Assessment API] Error persisting assessment:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to persist assessment in database.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/farmer/assessment?farmerId=...&id=...
 * Retrieves persisted assessments for a farmer.
 */
export async function GET(req: NextRequest) {
  const farmerId = req.nextUrl.searchParams.get("farmerId");
  const assessmentId = req.nextUrl.searchParams.get("id");
  const code = req.nextUrl.searchParams.get("code");

  if (!farmerId && !assessmentId && !code) {
    return NextResponse.json({ error: "farmerId or assessment id is required", success: false }, { status: 400 });
  }

  try {
    const db = getDb();

    // 1. Query specific assessment by ID or Code
    if (assessmentId || code) {
      const conditions = [];
      if (assessmentId && !isNaN(Number(assessmentId))) {
        conditions.push(eq(farmerAssessments.id, Number(assessmentId)));
      } else if (assessmentId) {
        conditions.push(eq(farmerAssessments.assessmentCode, assessmentId));
      }
      if (code) {
        conditions.push(eq(farmerAssessments.assessmentCode, code));
      }
      if (farmerId && !isNaN(Number(farmerId))) {
        conditions.push(eq(farmerAssessments.farmerId, Number(farmerId)));
      }

      const records = await db
        .select()
        .from(farmerAssessments)
        .where(and(...conditions))
        .limit(1);

      if (records.length === 0) {
        return NextResponse.json({ error: "Assessment not found", success: false }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        assessment: records[0],
      });
    }

    // 2. Query all assessments for farmer
    const records = await db
      .select()
      .from(farmerAssessments)
      .where(eq(farmerAssessments.farmerId, Number(farmerId)))
      .orderBy(desc(farmerAssessments.createdAt));

    return NextResponse.json({
      success: true,
      assessments: records,
    });
  } catch (err) {
    console.error("[Farmer Assessment GET] Error querying database:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to retrieve assessments from database.",
      },
      { status: 500 }
    );
  }
}
