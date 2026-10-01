export type FarmLocation = {
  latitude: number;
  longitude: number;
  displayName?: string;
  geoJson?: GeoJSON.Feature<GeoJSON.Polygon>;
  areaSqMeters?: number;
  areaHectares?: number;
  areaAcres?: number;
  country?: string;
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  villageLatitude?: number;
  villageLongitude?: number;
  isValid?: boolean;
  validationReason?: string;
  validationStatus?: "VALID" | "INVALID" | "VALIDATION_UNAVAILABLE";
  boundaryImage?: string;
};

export type GeocodingResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};
