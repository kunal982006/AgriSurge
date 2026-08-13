export type MapTypeId = "default" | "satellite" | "terrain";

export interface TileProvider {
  id: MapTypeId;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
}

const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const TILE_PROVIDERS: Record<MapTypeId, TileProvider> = {
  default: {
    id: "default",
    name: "Default",
    url: googleKey
      ? `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleKey}`
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: googleKey
      ? '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 20,
  },
  satellite: {
    id: "satellite",
    name: "Satellite",
    // Google Satellite Hybrid (lyrs=y) if API key provided, otherwise Esri World Imagery
    url: googleKey
      ? `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${googleKey}`
      : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: googleKey
      ? '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
      : "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 20,
  },
  terrain: {
    id: "terrain",
    name: "Terrain",
    // Google Terrain (lyrs=p) if API key provided, otherwise OpenTopoMap
    url: googleKey
      ? `https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&key=${googleKey}`
      : "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: googleKey
      ? '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
      : 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 20,
  }
};
