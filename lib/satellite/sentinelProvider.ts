import { SatelliteProvider } from "./types";

// Sentinel Hub (or equivalent) NDVI provider.
// Requires SATELLITE_CLIENT_ID / SATELLITE_CLIENT_SECRET. Until those are
// configured, getNdvi() returns a `not_configured` reading rather than
// fabricating a value — the UI is responsible for showing that state clearly.
export const sentinelProvider: SatelliteProvider = {
  name: "Sentinel Hub",
  async getNdvi() {
    const clientId = process.env.SATELLITE_CLIENT_ID;
    const clientSecret = process.env.SATELLITE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        ndvi: null,
        observationDate: null,
        cloudCoveragePct: null,
        status: "not_configured",
        source: "Sentinel Hub",
      };
    }

    // TODO: implement OAuth token exchange + Statistical API / Process API
    // request against Sentinel Hub once credentials are provided.
    throw new Error("Sentinel Hub integration not yet implemented.");
  },
};
