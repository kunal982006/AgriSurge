import { NextResponse } from "next/server";
import { getLatestTelemetry } from "@/lib/iot/iotStore";

export async function GET() {
  const { telemetry, isOnline } = getLatestTelemetry();

  if (isOnline && telemetry) {
    // Soil moisture estimation / calibration for soil health parameters
    // Normalizing N-P-K & pH based on sensor moisture and ambient environment
    const moistureFactor = telemetry.soilMoisture / 100;
    const estNitrogen = Math.round(70 + moistureFactor * 30);
    const estPhosphorus = Math.round(35 + moistureFactor * 20);
    const estPotassium = Math.round(38 + moistureFactor * 15);
    const estSoilPH = Number((6.2 + (moistureFactor * 0.8)).toFixed(1));
    const estRainfall = Math.round(150 + moistureFactor * 100);

    return NextResponse.json({
      connected: true,
      message: "Active AgriSurge IoT hardware device detected and streaming live data.",
      sensorData: {
        temperature: telemetry.temperature,
        humidity: telemetry.humidity,
        soilMoisture: telemetry.soilMoisture,
        nitrogen: estNitrogen,
        phosphorus: estPhosphorus,
        potassium: estPotassium,
        soilPH: estSoilPH,
        rainfall: estRainfall,
        deviceName: telemetry.deviceName || "AgriSurge ESP32 Node-01",
        lastSynced: new Date(telemetry.timestamp).toLocaleTimeString(),
      },
    });
  }

  return NextResponse.json({
    connected: false,
    message: "No active AgriSurge IoT hardware device broadcasting on local network.",
  });
}
