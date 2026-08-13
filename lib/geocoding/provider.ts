import { GeocodingResult } from "./types";

export interface GeocodingProvider {
  search(query: string): Promise<GeocodingResult[]>;
  reverse(lat: number, lon: number): Promise<GeocodingResult | null>;
}
