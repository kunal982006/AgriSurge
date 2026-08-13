import { GeocodingProvider } from "./provider";
import { GeocodingResult } from "./types";

export class NominatimProvider implements GeocodingProvider {
  async search(query: string): Promise<GeocodingResult[]> {
    if (!query.trim()) return [];
    
    // Add country codes or other params to make it more specific if needed
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=5`;
    
    const response = await fetch(url, {
      headers: {
        // Nominatim requires a valid user agent
        "User-Agent": "AgriSurge/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name,
    }));
  }

  async reverse(lat: number, lon: number): Promise<GeocodingResult | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AgriSurge/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Reverse geocoding request failed");
    }

    const data = await response.json();
    if (data.error) return null;

    return {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      displayName: data.display_name,
    };
  }
}

export const geocodingProvider = new NominatimProvider();
