"use client";

import { useState } from "react";
import { Search, MapPin, Upload } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { geocodingProvider } from "@/lib/geocoding/nominatimProvider";
import { FarmLocation } from "@/lib/geocoding/types";
import turfArea from "@turf/area";
import turfCentroid from "@turf/centroid";

export function LocationStep({
  onSelect,
}: {
  onSelect: (parcel: FarmLocation | null) => void;
}) {
  const [parcel, setParcel] = useState<FarmLocation | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Lat/Lng state
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [coordError, setCoordError] = useState<string | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.9975, 73.7898]); // Default to Nashik area
  const [mapZoom, setMapZoom] = useState(6);
  const [drawClearTrigger, setDrawClearTrigger] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearchError(null);
    try {
      const results = await geocodingProvider.search(searchQuery);
      if (results && results.length > 0) {
        const topResult = results[0];
        setMapCenter([topResult.latitude, topResult.longitude]);
        setMapZoom(13);
        const newLocation: FarmLocation = {
          latitude: topResult.latitude,
          longitude: topResult.longitude,
          displayName: topResult.displayName,
        };
        setParcel(newLocation);
        onSelect(newLocation);
        setLatInput(topResult.latitude.toString());
        setLngInput(topResult.longitude.toString());
      } else {
        setSearchError("No matching locations found.");
      }
    } catch {
      setSearchError("Unable to find this location. Try a village, district, or landmark.");
    } finally {
      setSearching(false);
    }
  };

  const handleLocateCoords = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    setCoordError(null);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setCoordError("Latitude must be between -90 and 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setCoordError("Longitude must be between -180 and 180.");
      return;
    }

    setMapCenter([lat, lng]);
    setMapZoom(15);
    const newLocation: FarmLocation = { latitude: lat, longitude: lng };
    setParcel(newLocation);
    onSelect(newLocation);
  };

  const clearPolygon = () => {
    setDrawClearTrigger((prev) => prev + 1); // trigger clear in map
    // Keep lat/lng if we had it, just clear the polygon/area
    if (parcel) {
      const updated = { ...parcel };
      delete updated.geoJson;
      delete updated.areaAcres;
      delete updated.areaHectares;
      delete updated.areaSqMeters;
      setParcel(updated);
      onSelect(updated);
    }
  };

  const handlePolygonChange = (geoJson: GeoJSON.FeatureCollection<GeoJSON.Polygon> | null) => {
    if (!geoJson || geoJson.features.length === 0) {
      if (parcel) {
        const updated = { ...parcel };
        delete updated.geoJson;
        delete updated.areaAcres;
        delete updated.areaHectares;
        delete updated.areaSqMeters;
        setParcel(updated);
        onSelect(updated);
      }
      return;
    }

    const feature = geoJson.features[0];
    const sqMeters = turfArea(feature);
    const hectares = sqMeters / 10000;
    const acres = sqMeters / 4046.8564224;

    const center = turfCentroid(feature);
    const centroidLng = center.geometry.coordinates[0];
    const centroidLat = center.geometry.coordinates[1];

    const updatedParcel: FarmLocation = {
      ...(parcel || {}),
      latitude: centroidLat,
      longitude: centroidLng,
      geoJson: feature,
      areaSqMeters: sqMeters,
      areaHectares: hectares,
      areaAcres: acres,
    };

    setLatInput(centroidLat.toFixed(5));
    setLngInput(centroidLng.toFixed(5));
    setParcel(updatedParcel);
    onSelect(updatedParcel);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\\n");
      // Basic parsing: expect header "farm_id,latitude,longitude"
      if (lines.length > 1) {
        const firstDataRow = lines[1].split(",");
        if (firstDataRow.length >= 3) {
          const lat = parseFloat(firstDataRow[1]);
          const lng = parseFloat(firstDataRow[2]);
          if (!isNaN(lat) && !isNaN(lng)) {
            setLatInput(lat.toString());
            setLngInput(lng.toString());
            setMapCenter([lat, lng]);
            setMapZoom(14);
            const newLocation: FarmLocation = { latitude: lat, longitude: lng };
            setParcel(newLocation);
            onSelect(newLocation);
          }
        }
      }
    };
    reader.readAsText(file);
  };

  const markers = parcel ? [{ id: "selected", position: [parcel.latitude, parcel.longitude] as [number, number] }] : [];
  
  const boundaryPoints = parcel?.geoJson ? parcel.geoJson.geometry.coordinates[0].length - 1 : 0; // -1 because first and last point are the same

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Option 1: Search */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">Search Location</label>
          <form onSubmit={handleSearch} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5">
              <Search size={13} className="text-[var(--color-text-dim)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search village, taluka, or district"
                className="w-full bg-transparent text-[12px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="rounded-[6px] border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] disabled:opacity-50"
            >
              {searching ? "Searching…" : "Search"}
            </button>
            {searchError && <p className="text-[11px] text-[var(--color-red)]">{searchError}</p>}
          </form>
        </div>

        {/* Option 2: Coordinates */}
        <div className="flex flex-col gap-2">
           <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">Enter Coordinates</label>
           <div className="flex items-start gap-2">
             <div className="flex flex-col gap-2 flex-1">
               <div className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5">
                 <input
                   value={latInput}
                   onChange={(e) => setLatInput(e.target.value)}
                   placeholder="Latitude (e.g. 19.9975)"
                   className="w-full bg-transparent text-[12px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
                 />
               </div>
               <div className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5">
                 <input
                   value={lngInput}
                   onChange={(e) => setLngInput(e.target.value)}
                   placeholder="Longitude (e.g. 73.7898)"
                   className="w-full bg-transparent text-[12px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
                 />
               </div>
             </div>
             <button
               onClick={handleLocateCoords}
               className="rounded-[6px] border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] h-[68px] flex items-center justify-center flex-col"
             >
               <MapPin size={14} className="mb-1" />
               Locate
             </button>
           </div>
           {coordError && <p className="text-[11px] text-[var(--color-red)]">{coordError}</p>}
        </div>
      </div>

      {/* CSV Import */}
      <div className="flex items-center justify-end">
        <label className="flex items-center gap-2 cursor-pointer rounded-[6px] border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] transition-colors">
          <Upload size={12} />
          Import Coordinates (CSV)
          <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--color-text-muted)] font-medium">
          {parcel?.geoJson ? "Farm boundary captured" : parcel ? "Location selected — draw farm boundary" : "Select a location above"}
        </p>
        {parcel?.geoJson && (
          <button
            onClick={clearPolygon}
            className="rounded-[6px] border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-red)] hover:text-[var(--color-red)]"
          >
            Clear Boundary
          </button>
        )}
      </div>

      {/* Map View */}
      <div className="h-[380px] overflow-hidden rounded-[8px] border border-[var(--color-border)] relative z-0">
        <MapView 
          center={mapCenter} 
          zoom={mapZoom} 
          enableDrawing={true} 
          markers={markers}
          onPolygonChange={handlePolygonChange}
          drawClearTrigger={drawClearTrigger}
        />
      </div>

      {/* Info Panels */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2.5 flex flex-col justify-between">
          <p className="text-[10.5px] uppercase tracking-wide text-[var(--color-text-dim)]">Selected Area</p>
          <div className="mt-1">
            {parcel?.areaAcres ? (
              <>
                <p className="tnum text-[15px] text-[var(--color-text)] font-semibold">{parcel.areaAcres.toFixed(2)} acres</p>
                <p className="tnum mt-0.5 text-[12px] text-[var(--color-text-dim)]">{parcel.areaHectares?.toFixed(2)} hectares</p>
              </>
            ) : (
              <p className="tnum mt-0.5 text-[13px] text-[var(--color-text)]">Draw a polygon on the map</p>
            )}
          </div>
        </div>
        <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2.5 flex flex-col justify-between">
          <p className="text-[10.5px] uppercase tracking-wide text-[var(--color-text-dim)]">Coordinates</p>
          <div className="mt-1">
            {parcel ? (
              <>
                <p className="tnum text-[15px] text-[var(--color-text)]">{parcel.latitude.toFixed(5)}, {parcel.longitude.toFixed(5)}</p>
                {boundaryPoints > 0 && <p className="mt-0.5 text-[12px] text-[var(--color-text-dim)]">Boundary: {boundaryPoints} points</p>}
              </>
            ) : (
              <p className="tnum mt-0.5 text-[15px] text-[var(--color-text)]">—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
