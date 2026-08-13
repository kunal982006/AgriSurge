export type FarmLocation = {
  latitude: number;
  longitude: number;
  displayName?: string;
  geoJson?: GeoJSON.Feature<GeoJSON.Polygon>;
  areaSqMeters?: number;
  areaHectares?: number;
  areaAcres?: number;
};

export type GeocodingResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};
