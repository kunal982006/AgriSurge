export interface IoTTelemetry {
  deviceName: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  soilRaw?: number;
  timestamp: number;
}

// Global store to hold the latest telemetry across hot reloads in Next.js
declare global {
  // eslint-disable-next-line no-var
  var __agriSurgeLatestTelemetry: IoTTelemetry | undefined;
}

export function saveTelemetry(data: {
  deviceName?: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  soilRaw?: number;
}): IoTTelemetry {
  const telemetry: IoTTelemetry = {
    deviceName: data.deviceName || "AgriSurge ESP32 Node-01",
    temperature: Number(data.temperature),
    humidity: Number(data.humidity),
    soilMoisture: Number(data.soilMoisture),
    soilRaw: data.soilRaw ? Number(data.soilRaw) : undefined,
    timestamp: Date.now(),
  };

  global.__agriSurgeLatestTelemetry = telemetry;
  return telemetry;
}

export function getLatestTelemetry(): { telemetry: IoTTelemetry | null; isOnline: boolean } {
  const telemetry = global.__agriSurgeLatestTelemetry;
  if (!telemetry) {
    return { telemetry: null, isOnline: false };
  }

  // Active if received within the last 15 seconds
  const isOnline = Date.now() - telemetry.timestamp < 15000;
  return { telemetry, isOnline };
}
