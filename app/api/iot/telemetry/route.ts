import { NextRequest, NextResponse } from "next/server";
import { saveTelemetry, getLatestTelemetry } from "@/lib/iot/iotStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceName, temperature, humidity, soilMoisture, soilRaw } = body;

    if (temperature === undefined || humidity === undefined || soilMoisture === undefined) {
      return NextResponse.json(
        { error: "Missing required telemetry fields (temperature, humidity, soilMoisture)" },
        { status: 400 }
      );
    }

    const saved = saveTelemetry({
      deviceName,
      temperature,
      humidity,
      soilMoisture,
      soilRaw,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Telemetry received successfully",
        telemetry: saved,
      },
      {
        headers: {
          "Connection": "close",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Failed to process telemetry", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { telemetry, isOnline } = getLatestTelemetry();
  return NextResponse.json(
    {
      online: isOnline,
      telemetry,
    },
    {
      headers: {
        "Connection": "close",
        "Cache-Control": "no-store",
      },
    }
  );
}
