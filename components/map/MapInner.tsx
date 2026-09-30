"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, FeatureGroup, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { MapTypeId, TILE_PROVIDERS } from "@/lib/map/tileProviders";
import { Layers, X, Map as MapIcon, Mountain, Satellite as SatelliteIcon } from "lucide-react";

// Fix for default Leaflet marker icons in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const goldIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const getRiskIcon = (riskLevel: string) => {
  if (riskLevel === "low") return greenIcon;
  if (riskLevel === "moderate") return goldIcon;
  if (riskLevel === "high") return redIcon;
  return new L.Icon.Default();
};

export type MapInnerProps = {
  center?: [number, number];
  zoom?: number;
  className?: string;
  markers?: Array<{
    id: string;
    position: [number, number];
    riskLevel?: "low" | "moderate" | "high";
    popupContent?: React.ReactNode;
  }>;
  enableDrawing?: boolean;
  onPolygonChange?: (geoJson: GeoJSON.FeatureCollection<GeoJSON.Polygon> | null) => void;
  drawClearTrigger?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  polygon?: any;
};

// Component to handle map center updates
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function MapInner({
  center = [19.5, 76.5],
  zoom = 5.6,
  className = "",
  markers = [],
  enableDrawing = false,
  onPolygonChange,
  drawClearTrigger = 0,
  polygon,
}: MapInnerProps) {
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const [mapType, setMapType] = useState<MapTypeId>("satellite");
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  
  const currentProvider = TILE_PROVIDERS[mapType];

  const prevDrawClearTrigger = useRef(drawClearTrigger);
  useEffect(() => {
    if (drawClearTrigger > prevDrawClearTrigger.current && featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      onPolygonChange?.(null);
      prevDrawClearTrigger.current = drawClearTrigger;
    }
  }, [drawClearTrigger, onPolygonChange]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreated = (e: any) => {
    // Only allow one polygon
    if (featureGroupRef.current) {
      const layers = featureGroupRef.current.getLayers();
      layers.forEach((layer) => {
        if (layer !== e.layer) {
          featureGroupRef.current?.removeLayer(layer);
        }
      });
    }
    updatePolygonData();
  };

  const updatePolygonData = () => {
    if (!featureGroupRef.current || !onPolygonChange) return;
    
    const layers = featureGroupRef.current.getLayers();
    if (layers.length === 0) {
      onPolygonChange(null);
      return;
    }
    
    const geoJson = featureGroupRef.current.toGeoJSON() as GeoJSON.FeatureCollection<GeoJSON.Polygon>;
    if (geoJson.features.length > 0) {
      onPolygonChange(geoJson);
    } else {
      onPolygonChange(null);
    }
  };

  return (
    <div className={`relative h-full w-full ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
        attributionControl={true}
      >
        <TileLayer
          key={currentProvider.id}
          attribution={currentProvider.attribution}
          url={currentProvider.url}
          maxZoom={currentProvider.maxZoom}
        />
        
        <MapUpdater center={center} zoom={zoom} />

        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={marker.position}
            icon={marker.riskLevel ? getRiskIcon(marker.riskLevel) : new L.Icon.Default()}
          >
            {marker.popupContent && (
              <Popup>{marker.popupContent}</Popup>
            )}
          </Marker>
        ))}

        {polygon && (
          <GeoJSON 
            data={polygon} 
            style={{ color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.25 }} 
          />
        )}

        {enableDrawing && (
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={updatePolygonData}
              onDeleted={updatePolygonData}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
                polygon: {
                  allowIntersection: false,
                  showArea: true,
                  shapeOptions: {
                    color: '#3b82f6',
                    weight: 3,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.25
                  }
                },
              }}
            />
          </FeatureGroup>
        )}
      </MapContainer>

      {/* Map Type Selector Button */}
      <button
        onClick={() => setShowTypeSelector(true)}
        className="absolute bottom-5 right-5 z-[1000] flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border-strong)] bg-[var(--color-surface)]/90 px-2.5 py-1.5 text-[12px] text-[var(--color-text)] shadow-md backdrop-blur-sm hover:bg-[var(--color-surface-raised)]"
      >
        <Layers size={14} /> Map Type
      </button>

      {/* Map Type Selector Panel */}
      {showTypeSelector && (
        <div className="absolute bottom-14 right-5 z-[1001] w-48 overflow-hidden rounded-[8px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">Map Type</span>
            <button onClick={() => setShowTypeSelector(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-col p-1">
            <button
              onClick={() => { setMapType("default"); setShowTypeSelector(false); }}
              className={`flex items-center justify-between rounded-[4px] px-3 py-2.5 text-left text-[12.5px] transition-colors ${
                mapType === "default" ? "bg-[var(--color-emerald-dim)]/30 text-[var(--color-emerald)]" : "text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <MapIcon size={14} className={mapType === "default" ? "text-[var(--color-emerald)]" : "text-[var(--color-text-muted)]"} />
                <span>Default</span>
              </div>
              {mapType === "default" && <span className="text-[10px]">✓</span>}
            </button>
            <button
              onClick={() => { setMapType("satellite"); setShowTypeSelector(false); }}
              className={`flex items-center justify-between rounded-[4px] px-3 py-2.5 text-left text-[12.5px] transition-colors ${
                mapType === "satellite" ? "bg-[var(--color-emerald-dim)]/30 text-[var(--color-emerald)]" : "text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <SatelliteIcon size={14} className={mapType === "satellite" ? "text-[var(--color-emerald)]" : "text-[var(--color-text-muted)]"} />
                <span>Satellite</span>
              </div>
              {mapType === "satellite" && <span className="text-[10px]">✓</span>}
            </button>
            <button
              onClick={() => { setMapType("terrain"); setShowTypeSelector(false); }}
              className={`flex items-center justify-between rounded-[4px] px-3 py-2.5 text-left text-[12.5px] transition-colors ${
                mapType === "terrain" ? "bg-[var(--color-emerald-dim)]/30 text-[var(--color-emerald)]" : "text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Mountain size={14} className={mapType === "terrain" ? "text-[var(--color-emerald)]" : "text-[var(--color-text-muted)]"} />
                <span>Terrain</span>
              </div>
              {mapType === "terrain" && <span className="text-[10px]">✓</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
