export type SatelliteSourceStatus = "live" | "not_configured" | "error";

export type NdviReading = {
  ndvi: number | null;
  observationDate: string | null;
  cloudCoveragePct: number | null;
  status: SatelliteSourceStatus;
  source: string;
};

export type SatelliteProvider = {
  name: string;
  getNdvi(lat: number, lng: number): Promise<NdviReading>;
};
