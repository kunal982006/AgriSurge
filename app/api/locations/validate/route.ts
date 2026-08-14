import { NextRequest, NextResponse } from "next/server";
import turfArea from "@turf/area";

const BUILDING_OVERLAP_THRESHOLD = process.env.BUILDING_OVERLAP_THRESHOLD
  ? parseFloat(process.env.BUILDING_OVERLAP_THRESHOLD)
  : 0.15; // 15% threshold

function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point; // longitude, latitude
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { geoJson } = body;

    if (!geoJson || geoJson.type !== "Feature" || geoJson.geometry?.type !== "Polygon") {
      return NextResponse.json({ valid: false, reason: "INVALID_POLYGON", error: "Please select a valid farm boundary." }, { status: 400 });
    }

    const ring = geoJson.geometry.coordinates[0];
    if (ring.length < 4) {
      return NextResponse.json({ valid: false, reason: "INVALID_POLYGON", error: "Please select a valid closed farm boundary." }, { status: 400 });
    }

    // 1. Calculate farm area
    const totalFarmArea = turfArea(geoJson);
    if (totalFarmArea <= 0) {
      return NextResponse.json({ valid: false, reason: "TOO_SMALL", error: "Farm area must be greater than zero." }, { status: 400 });
    }

    // 2. Calculate bounding box of farm polygon
    let south = 90, north = -90, west = 180, east = -180;
    const polygonPoints: [number, number][] = []; // [lng, lat]

    for (const p of ring) {
      const [lng, lat] = p;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json({ valid: false, reason: "INVALID_POLYGON", error: "Invalid coordinate values." }, { status: 400 });
      }
      if (lat < south) south = lat;
      if (lat > north) north = lat;
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      polygonPoints.push([lng, lat]);
    }

    // Add padding to bbox (approx 10m)
    const padding = 0.0001;
    south -= padding;
    north += padding;
    west -= padding;
    east += padding;

    // 3. Query Overpass API for buildings inside the bbox
    const overpassQuery = `[out:json][timeout:15];way[building](${south},${west},${north},${east});out geom;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    const response = await fetch(overpassUrl, {
      headers: {
        "User-Agent": "AgriSurge/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    let overlappingBuildingArea = 0;
    let buildingOverlapDetected = false;

    for (const element of elements) {
      if (element.type === "way" && element.geometry) {
        const geom = element.geometry;
        const buildingPoints: [number, number][] = geom.map((g: { lat: number; lon: number }) => [g.lon, g.lat]);

        // Check if building overlaps the farm polygon
        // A simple heuristic: if any node of the building is inside the farm polygon
        const overlaps = buildingPoints.some((p) => isPointInPolygon(p, polygonPoints));

        if (overlaps) {
          buildingOverlapDetected = true;
          // Format as GeoJSON Polygon to calculate area
          const firstPoint = buildingPoints[0];
          // Ensure closed polygon
          if (buildingPoints[buildingPoints.length - 1][0] !== firstPoint[0] || buildingPoints[buildingPoints.length - 1][1] !== firstPoint[1]) {
            buildingPoints.push(firstPoint);
          }

          const buildingGeoJson = {
            type: "Feature" as const,
            geometry: {
              type: "Polygon" as const,
              coordinates: [buildingPoints],
            },
            properties: {},
          };

          const buildingArea = turfArea(buildingGeoJson);
          overlappingBuildingArea += buildingArea;
        }
      }
    }

    const overlapPct = overlappingBuildingArea / totalFarmArea;

    if (buildingOverlapDetected && overlapPct > BUILDING_OVERLAP_THRESHOLD) {
      return NextResponse.json({
        valid: false,
        reason: "BUILDING_OVERLAP",
        buildingOverlap: true,
        overlapPercentage: overlapPct,
        error: "The selected area appears to contain a building or developed/urban area. Please select the actual agricultural land.",
      });
    }

    return NextResponse.json({
      valid: true,
      reason: "VALID",
      buildingOverlap: false,
    });
  } catch (error) {
    console.error("Land validation error:", error);
    // Graceful error fallback for network/service unavailability
    return NextResponse.json({
      valid: true,
      reason: "VALIDATION_UNAVAILABLE",
      error: "Land verification service is temporarily unavailable. The selected boundary can still be reviewed using satellite imagery.",
    });
  }
}
