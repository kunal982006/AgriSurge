"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, AlertCircle, HelpCircle } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { FarmLocation } from "@/lib/geocoding/types";
import turfArea from "@turf/area";
import turfCentroid from "@turf/centroid";
import { toJpeg } from "html-to-image";

interface VillageItem {
  code: string;
  nameEnglish: string;
  nameLocal: string;
}

export function LocationStep({
  onSelect,
}: {
  onSelect: (parcel: FarmLocation | null) => void;
}) {
  const [parcel, setParcel] = useState<FarmLocation | null>(null);

  // Hierarchical lists & states
  const [districts, setDistricts] = useState<string[]>([]);
  const [talukas, setTalukas] = useState<string[]>([]);
  const [villages, setVillages] = useState<VillageItem[]>([]);

  // Selected values
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTaluka, setSelectedTaluka] = useState("");
  const [selectedVillage, setSelectedVillage] = useState<VillageItem | null>(null);

  // Village search/input states
  const [villageSearchVal, setVillageSearchVal] = useState("");
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const [fetchingVillages, setFetchingVillages] = useState(false);

  // Geocoding / status states
  const [geocoding, setGeocoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Land validation states
  const [validatingLand, setValidatingLand] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationSuccessMessage, setValidationSuccessMessage] = useState<string | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.7515, 75.7139]); // Centered on Maharashtra
  const [mapZoom, setMapZoom] = useState(7);
  const [drawClearTrigger, setDrawClearTrigger] = useState(0);

  const villageRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fetch districts on mount
  useEffect(() => {
    async function fetchDistricts() {
      try {
        const res = await fetch("/api/locations?type=districts");
        if (res.ok) {
          const data = await res.json();
          setDistricts(data.districts || []);
        }
      } catch (err) {
        console.error("Error loading districts:", err);
        setErrorMsg("Failed to load districts from dataset.");
      }
    }
    fetchDistricts();
  }, []);

  // Fetch talukas when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setTalukas([]);
      return;
    }
    async function fetchTalukas() {
      try {
        const res = await fetch(`/api/locations?type=talukas&district=${encodeURIComponent(selectedDistrict)}`);
        if (res.ok) {
          const data = await res.json();
          setTalukas(data.talukas || []);
        }
      } catch (err) {
        console.error("Error loading talukas:", err);
      }
    }
    fetchTalukas();
  }, [selectedDistrict]);

  // Fetch/filter villages as user types
  useEffect(() => {
    if (!selectedDistrict || !selectedTaluka) {
      setVillages([]);
      return;
    }

    const timer = setTimeout(async () => {
      setFetchingVillages(true);
      try {
        const res = await fetch(
          `/api/locations?type=villages&district=${encodeURIComponent(selectedDistrict)}&taluka=${encodeURIComponent(
            selectedTaluka
          )}&query=${encodeURIComponent(villageSearchVal)}`
        );
        if (res.ok) {
          const data = await res.json();
          setVillages(data.villages || []);
        }
      } catch (err) {
        console.error("Error fetching villages:", err);
      } finally {
        setFetchingVillages(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedDistrict, selectedTaluka, villageSearchVal]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (villageRef.current && !villageRef.current.contains(event.target as Node)) {
        setShowVillageDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    setSelectedTaluka("");
    setSelectedVillage(null);
    setVillageSearchVal("");
    setParcel(null);
    onSelect(null);
    setErrorMsg(null);
  };

  const handleTalukaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTaluka(val);
    setSelectedVillage(null);
    setVillageSearchVal("");
    setParcel(null);
    onSelect(null);
    setErrorMsg(null);
  };

  const handleVillageSelect = async (village: VillageItem) => {
    setSelectedVillage(village);
    setVillageSearchVal(`${village.nameEnglish} (${village.nameLocal})`);
    setShowVillageDropdown(false);
    setErrorMsg(null);
    setGeocoding(true);

    const query = `${village.nameEnglish}, ${selectedTaluka}, ${selectedDistrict}, Maharashtra, India`;

    try {
      const res = await fetch(`/api/locations?type=geocode&query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const result = await res.json();
        setMapCenter([result.latitude, result.longitude]);
        setMapZoom(result.isFallback ? 13 : 15); // zoom out slightly if fallback to see taluka area

        const newLocation: FarmLocation = {
          latitude: result.latitude,
          longitude: result.longitude,
          displayName: `${village.nameEnglish}, ${selectedTaluka}, ${selectedDistrict}`,
          country: "India",
          state: "Maharashtra",
          district: selectedDistrict,
          taluka: selectedTaluka,
          village: village.nameEnglish,
          villageLatitude: result.latitude,
          villageLongitude: result.longitude,
        };

        setParcel(newLocation);
        onSelect(newLocation);

        if (result.isFallback) {
          setErrorMsg(null);
        }
      } else {
        setErrorMsg(null);
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      setErrorMsg(null);
    } finally {
      setGeocoding(false);
    }
  };

  const validateFarmLand = async (feature: GeoJSON.Feature<GeoJSON.Polygon>, currentParcel: FarmLocation) => {
    setValidatingLand(true);
    setValidationMessage(null);
    setValidationSuccessMessage(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/locations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geoJson: feature }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setValidationMessage("Generating farm evidence image...");
          let capturedImage: string | undefined = undefined;
          
          if (mapContainerRef.current) {
            try {
              // Hide Leaflet controls (zoom, drawing tools, attribution) for a clean satellite evidence image
              const controls = mapContainerRef.current.querySelectorAll('.leaflet-control-container, .leaflet-top, .leaflet-bottom') as NodeListOf<HTMLElement>;
              const typeSelector = mapContainerRef.current.parentElement?.querySelectorAll('button, div.z-\\[1001\\]') as NodeListOf<HTMLElement>;
              
              controls.forEach(c => { c.style.display = 'none'; });
              typeSelector.forEach(c => { c.style.opacity = '0'; });

              // Wait slightly for DOM to apply styles
              await new Promise(r => setTimeout(r, 100));

              capturedImage = await toJpeg(mapContainerRef.current, { quality: 0.8, pixelRatio: 2 });

              // Restore UI
              controls.forEach(c => { c.style.display = ''; });
              typeSelector.forEach(c => { c.style.opacity = '1'; });
            } catch (captureErr) {
              console.error("Failed to capture map image:", captureErr);
            }
          }

          if (!capturedImage) {
            throw new Error("Failed to capture map interface.");
          }

          const validated = {
            ...currentParcel,
            isValid: true,
            validationStatus: data.reason || ("VALID" as const),
            boundaryImage: capturedImage,
          };
          setParcel(validated);
          onSelect(validated);
          setValidationSuccessMessage("Farm boundary ready");
          setValidationMessage(null);
        } else {
          const invalidated = {
            ...currentParcel,
            isValid: false,
            validationStatus: "INVALID" as const,
            validationReason: data.reason,
          };
          setParcel(invalidated);
          onSelect(invalidated);
          setValidationMessage(data.error || "Please select a proper agricultural land/farm area.");
          setValidationSuccessMessage(null);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        const invalidated = {
          ...currentParcel,
          isValid: false,
          validationStatus: "INVALID" as const,
        };
        setParcel(invalidated);
        onSelect(invalidated);
        setValidationMessage(errorData.error || "Failed to generate farm boundary image. Please try again.");
        setValidationSuccessMessage(null);
      }
    } catch (err) {
      console.error("Land validation request failed:", err);
      const invalidated = {
        ...currentParcel,
        isValid: false,
        validationStatus: "INVALID" as const,
      };
      setParcel(invalidated);
      onSelect(invalidated);
      setValidationMessage("Failed to connect to validation service. Please check your internet connection.");
      setValidationSuccessMessage(null);
    } finally {
      setValidatingLand(false);
    }
  };

  const clearPolygon = () => {
    setDrawClearTrigger((prev) => prev + 1);
    setValidationMessage(null);
    setValidationSuccessMessage(null);
    if (parcel) {
      const updated = { ...parcel };
      delete updated.geoJson;
      delete updated.areaAcres;
      delete updated.areaHectares;
      delete updated.areaSqMeters;
      delete updated.isValid;
      delete updated.validationReason;
      // Revert farm coordinates to village coordinates when cleared
      updated.latitude = updated.villageLatitude || updated.latitude;
      updated.longitude = updated.villageLongitude || updated.longitude;
      setParcel(updated);
      onSelect(updated);
    }
  };

  const handlePolygonChange = (geoJson: GeoJSON.FeatureCollection<GeoJSON.Polygon> | null) => {
    if (!geoJson || geoJson.features.length === 0) {
      setValidationMessage(null);
      setValidationSuccessMessage(null);
      if (parcel) {
        const updated = { ...parcel };
        delete updated.geoJson;
        delete updated.areaAcres;
        delete updated.areaHectares;
        delete updated.areaSqMeters;
        delete updated.isValid;
        delete updated.validationReason;
        updated.latitude = updated.villageLatitude || updated.latitude;
        updated.longitude = updated.villageLongitude || updated.longitude;
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

    if (parcel) {
      const updatedParcel: FarmLocation = {
        ...parcel,
        latitude: centroidLat,
        longitude: centroidLng,
        geoJson: feature,
        areaSqMeters: sqMeters,
        areaHectares: hectares,
        areaAcres: acres,
        isValid: false, // Default to false until validated
      };
      setParcel(updatedParcel);
      onSelect(updatedParcel); // initially block Continue
      validateFarmLand(feature, updatedParcel);
    }
  };

  const markers = parcel?.villageLatitude && parcel?.villageLongitude
    ? [{ id: "village-center", position: [parcel.villageLatitude, parcel.villageLongitude] as [number, number] }]
    : [];

  const boundaryPoints = parcel?.geoJson ? parcel.geoJson.geometry.coordinates[0].length - 1 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Country & State */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">Country</label>
            <select disabled className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-muted)] opacity-70">
              <option>India</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">State</label>
            <select disabled className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-muted)] opacity-70">
              <option>Maharashtra</option>
            </select>
          </div>
        </div>

        {/* District & Taluka Selectors */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">District</label>
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
            >
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">Taluka / Sub-district</label>
            <select
              value={selectedTaluka}
              onChange={handleTalukaChange}
              disabled={!selectedDistrict}
              className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none disabled:opacity-50"
            >
              <option value="">Select Taluka</option>
              {talukas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Village Autocomplete Selector */}
      <div ref={villageRef} className="relative flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">Village</label>
        <div className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5">
          <Search size={13} className="text-[var(--color-text-dim)]" />
          <input
            value={villageSearchVal}
            onChange={(e) => {
              setVillageSearchVal(e.target.value);
              setShowVillageDropdown(true);
            }}
            onFocus={() => setShowVillageDropdown(true)}
            placeholder={selectedTaluka ? "Type to search village..." : "Select district & taluka first"}
            disabled={!selectedTaluka}
            className="w-full bg-transparent text-[12.5px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showVillageDropdown && selectedTaluka && (
          <div className="absolute top-[62px] left-0 right-0 z-50 max-h-48 overflow-y-auto rounded-[6px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-lg">
            {fetchingVillages ? (
              <div className="px-3 py-2 text-[12px] text-[var(--color-text-dim)]">Loading villages...</div>
            ) : villages.length > 0 ? (
              villages.map((v) => (
                <button
                  key={v.code}
                  onClick={() => handleVillageSelect(v)}
                  className="w-full px-3 py-2 text-left text-[12.5px] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors border-b border-[var(--color-border)]/50 last:border-b-0"
                >
                  <div className="font-medium">{v.nameEnglish}</div>
                  <div className="text-[11px] text-[var(--color-text-dim)]">{v.nameLocal}</div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-[12px] text-[var(--color-text-dim)]">No villages found</div>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-red)] bg-[var(--color-red-dim)]/10 px-2.5 py-1.5 rounded-[4px]">
          <AlertCircle size={13} />
          <span>{errorMsg}</span>
        </div>
      )}

      {geocoding && (
        <div className="text-[12px] text-[var(--color-text-muted)] italic">
          Locating village center on map...
        </div>
      )}

      {parcel && (
        <div className="flex items-start gap-2 text-[12px] text-[var(--color-emerald)] bg-[var(--color-emerald-dim)]/10 px-3 py-2.5 rounded-[6px] border border-[var(--color-emerald)]/20">
          <HelpCircle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Village Located: {parcel.village}</p>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-text-muted)] leading-relaxed">
              We have marked the center of {parcel.village}. Now, please use the polygon tools on the top right of the map to trace the boundaries of your actual farm land.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-[12px] font-medium">
          {validatingLand && (
            <span className="text-[var(--color-text-dim)] animate-pulse">Verifying selected land...</span>
          )}
          {!validatingLand && validationSuccessMessage && (
            <span className="text-[var(--color-emerald)]">✓ {validationSuccessMessage}</span>
          )}
          {!validatingLand && validationMessage && (
            <span
              className={
                parcel?.validationStatus === "VALIDATION_UNAVAILABLE"
                  ? "text-[var(--color-amber)]"
                  : "text-[var(--color-red)]"
              }
            >
              {parcel?.validationStatus === "VALIDATION_UNAVAILABLE" ? "⚠ " : "✗ "}
              {validationMessage}
            </span>
          )}
          {!validatingLand && !validationSuccessMessage && !validationMessage && (
            <span className="text-[var(--color-text-muted)]">
              {parcel?.geoJson ? "Farm boundary captured" : parcel ? "Village located — please draw farm boundary" : "Please select district, taluka, and village"}
            </span>
          )}
        </div>
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
      <div ref={mapContainerRef} className="h-[380px] overflow-hidden rounded-[8px] border border-[var(--color-border)] relative z-0">
        <MapView 
          center={mapCenter} 
          zoom={mapZoom} 
          enableDrawing={!!parcel} 
          markers={markers}
          onPolygonChange={handlePolygonChange}
          drawClearTrigger={drawClearTrigger}
        />
      </div>

      {/* Info Panels */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2.5 flex flex-col justify-between">
          <p className="text-[10.5px] uppercase tracking-wide text-[var(--color-text-dim)]">Farm Area</p>
          <div className="mt-1">
            {parcel?.areaAcres ? (
              <>
                <p className="tnum text-[15px] text-[var(--color-text)] font-semibold">{parcel.areaAcres.toFixed(2)} acres</p>
                <p className="tnum mt-0.5 text-[12px] text-[var(--color-text-dim)]">{parcel.areaHectares?.toFixed(2)} hectares</p>
              </>
            ) : (
              <p className="tnum mt-0.5 text-[13px] text-[var(--color-text)] font-medium text-[var(--color-text-dim)]">Draw polygon on map</p>
            )}
          </div>
        </div>
        <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2.5 flex flex-col justify-between">
          <p className="text-[10.5px] uppercase tracking-wide text-[var(--color-text-dim)]">Farm Center Coordinates</p>
          <div className="mt-1">
            {parcel ? (
              <>
                <p className="tnum text-[15px] text-[var(--color-text)]">{parcel.latitude.toFixed(5)}, {parcel.longitude.toFixed(5)}</p>
                {boundaryPoints > 0 ? (
                  <p className="mt-0.5 text-[12px] text-[var(--color-text-dim)]">Boundary: {boundaryPoints} points</p>
                ) : (
                  <p className="mt-0.5 text-[12px] text-[var(--color-text-dim)]">Village Center (Farm not selected)</p>
                )}
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
