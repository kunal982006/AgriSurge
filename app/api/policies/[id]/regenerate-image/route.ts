import { NextRequest, NextResponse } from "next/server";
import { getUnderwritingRecordById, saveUnderwritingRecord } from "@/lib/underwriting/underwritingStore";

function encodePolyline(coordinates: [number, number][]): string {
  let result = '';
  let prevLat = 0;
  let prevLng = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const lat = Math.round(coordinates[i][1] * 1e5);
    const lng = Math.round(coordinates[i][0] * 1e5);

    const dLat = lat - prevLat;
    const dLng = lng - prevLng;

    prevLat = lat;
    prevLng = lng;

    let encodedLat = (dLat << 1) ^ (dLat >> 31);
    let encodedLng = (dLng << 1) ^ (dLng >> 31);

    while (encodedLat >= 0x20) {
      result += String.fromCharCode((0x20 | (encodedLat & 0x1f)) + 63);
      encodedLat >>= 5;
    }
    result += String.fromCharCode(encodedLat + 63);

    while (encodedLng >= 0x20) {
      result += String.fromCharCode((0x20 | (encodedLng & 0x1f)) + 63);
      encodedLng >>= 5;
    }
    result += String.fromCharCode(encodedLng + 63);
  }
  return result;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await getUnderwritingRecordById(id);

    if (!record) {
      return NextResponse.json({ error: "Policy not found." }, { status: 404 });
    }

    if (record.boundaryImageBase64) {
      return NextResponse.json({ success: true, message: "Image already exists." });
    }

    const geoJson = record.geoJson;
    if (!geoJson || geoJson.type !== "Feature" || geoJson.geometry?.type !== "Polygon") {
      return NextResponse.json({ error: "No valid polygon data found for this policy." }, { status: 400 });
    }

    const ring = geoJson.geometry.coordinates[0];
    if (!ring || ring.length < 4) {
      return NextResponse.json({ error: "Polygon coordinates are incomplete." }, { status: 400 });
    }

    const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!googleKey) {
      return NextResponse.json({ error: "Missing Google Maps API Key." }, { status: 500 });
    }

    const encodedRing = encodePolyline(ring);
    const pathStr = `color:0x3b82f6ff|weight:3|fillcolor:0x3b82f644|enc:${encodedRing}`;
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=800x400&maptype=satellite&path=${encodeURIComponent(pathStr)}&key=${googleKey}`;
    
    const imgRes = await fetch(staticMapUrl);
    if (!imgRes.ok) {
      const errorText = await imgRes.text();
      return NextResponse.json({ error: `Google Maps API error: ${errorText}` }, { status: 500 });
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const boundaryImage = `data:image/png;base64,${buffer.toString("base64")}`;

    record.boundaryImageBase64 = boundaryImage;
    await saveUnderwritingRecord(record);

    return NextResponse.json({
      success: true,
      message: "Farm boundary image regenerated successfully.",
      record
    });

  } catch (err) {
    console.error("Failed to regenerate image:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
