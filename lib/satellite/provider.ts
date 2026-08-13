import { NdviReading, SatelliteProvider } from "./types";
import { sentinelProvider } from "./sentinelProvider";

const activeProvider: SatelliteProvider = sentinelProvider;

export async function getNdvi(lat: number, lng: number): Promise<NdviReading> {
  try {
    return await activeProvider.getNdvi(lat, lng);
  } catch {
    return {
      ndvi: null,
      observationDate: null,
      cloudCoveragePct: null,
      status: "error",
      source: activeProvider.name,
    };
  }
}
