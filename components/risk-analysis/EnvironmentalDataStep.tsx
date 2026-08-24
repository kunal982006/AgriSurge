"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CloudRain,
  Compass,
  Droplets,
  Info,
  MapPin,
  RefreshCw,
  Sprout,
  Sun,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { CurrentWeather, ForecastDay, HistoricalImdReading } from "@/lib/weather/types";
import { NdviReading } from "@/lib/satellite/types";
import { FarmLocation } from "@/lib/geocoding/types";
import { FarmDetails } from "./FarmDetailsStep";

function SourceBadge({
  type,
  label,
}: {
  type: "live" | "historical" | "forecast" | "satellite" | "not_configured" | "error";
  label?: string;
}) {
  const styles = {
    live: "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)] border border-[var(--color-emerald)]/30",
    historical: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    forecast: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    satellite: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
    not_configured: "bg-neutral-800 text-neutral-400 border border-neutral-700",
    error: "bg-[var(--color-red-dim)] text-[var(--color-red)] border border-[var(--color-red)]/30",
  }[type];

  const defaultLabels = {
    live: "LIVE",
    historical: "HISTORICAL (IMD)",
    forecast: "FORECAST",
    satellite: "SATELLITE",
    not_configured: "NOT CONFIGURED",
    error: "ERROR",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ${styles}`}>
      {type === "live" && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-emerald)] animate-pulse" />}
      {label || defaultLabels[type]}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  badgeType,
  badgeLabel,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  badgeType: "live" | "historical" | "forecast" | "satellite" | "not_configured" | "error";
  badgeLabel?: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 shadow-sm transition-colors hover:border-[var(--color-border-strong)]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[var(--color-text-dim)]">
            <Icon size={14} className="shrink-0" />
            <span className="text-[11.5px] font-medium text-[var(--color-text-muted)]">{label}</span>
          </div>
          <SourceBadge type={badgeType} label={badgeLabel} />
        </div>
        <p className="tnum mt-2 text-[17px] font-semibold text-[var(--color-text)]">{value}</p>
      </div>
      {subtext && <p className="mt-1 text-[10.5px] text-[var(--color-text-dim)]">{subtext}</p>}
    </div>
  );
}

export function EnvironmentalDataStep({
  lat,
  lng,
  farmDetails,
  farmLocation,
  onData,
}: {
  lat: number | null;
  lng: number | null;
  farmDetails?: FarmDetails;
  farmLocation?: FarmLocation | null;
  onData: (data: {
    weather: CurrentWeather | null;
    ndvi: NdviReading | null;
    soilMoisturePct: number | null;
    historicalImd?: HistoricalImdReading | null;
    v2Features?: Record<string, number | null> | null;
  }) => void;
}) {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [historicalImd, setHistoricalImd] = useState<HistoricalImdReading | null>(null);
  const [ndvi, setNdvi] = useState<NdviReading | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [loadingImd, setLoadingImd] = useState(false);

  const crop = farmDetails?.crop || "RICE";
  const season = farmDetails?.growthStage?.toLowerCase().includes("rabi")
    ? "Rabi"
    : farmDetails?.crop === "Sugarcane"
    ? "Annual"
    : "Kharif";

  useEffect(() => {
    if (lat === null || lng === null) return;

    setLoadingLive(true);
    setLoadingImd(true);

    // 1. Live & Forecast Weather fetch
    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((data) => {
        const currentWeather: CurrentWeather = data.weather;
        setWeather(currentWeather);
      })
      .catch(() => {
        const errWeather: CurrentWeather = {
          temperatureC: 0,
          rainfallMm24h: 0,
          humidityPct: 0,
          windSpeedKph: 0,
          status: "error",
          source: "Open-Meteo",
          observedAt: new Date().toISOString(),
        };
        setWeather(errWeather);
      })
      .finally(() => setLoadingLive(false));

    // 2. Server-side Historical IMD NetCDF Grid lookup
    fetch(`/api/weather/historical?lat=${lat}&lng=${lng}&crop=${encodeURIComponent(crop)}&season=${encodeURIComponent(season)}`)
      .then((r) => r.json())
      .then((imdData: HistoricalImdReading) => {
        setHistoricalImd(imdData);
      })
      .catch(() => {
        setHistoricalImd({
          available: false,
          error: "Historical rainfall data temporarily unavailable for this location",
        });
      })
      .finally(() => setLoadingImd(false));

    // 3. Static/Not Configured Satellite NDVI & Soil Moisture
    const notConfiguredNdvi: NdviReading = {
      ndvi: null,
      observationDate: null,
      cloudCoveragePct: null,
      status: "not_configured",
      source: "Sentinel-2 / Copernicus",
    };
    setNdvi(notConfiguredNdvi);
  }, [lat, lng, crop, season]);

  // Pass ready features to parent workflow
  useEffect(() => {
    if (weather || historicalImd) {
      onData({
        weather,
        ndvi,
        soilMoisturePct: null,
        historicalImd,
        v2Features: historicalImd?.v2_features ?? null,
      });
    }
  }, [weather, historicalImd, ndvi, onData]);

  if (lat === null || lng === null) {
    return (
      <div className="rounded-[6px] border border-dashed border-[var(--color-border-strong)] px-4 py-8 text-center">
        <p className="text-[12.5px] text-[var(--color-text-muted)]">
          Select a farm location in Step 1 to load environmental data.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-[var(--color-text)]">
      {/* SECTION 5: FARM ENVIRONMENT SUMMARY (Read-Only State from Steps 1 & 2) */}
      {farmDetails && farmLocation && (
        <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 p-3.5">
          <div className="mb-2 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <div className="flex items-center gap-2">
              <Sprout size={15} className="text-[var(--color-emerald)]" />
              <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
                Farm Environment Profile
              </h3>
            </div>
            <SourceBadge type="live" label="STEP 1 & 2 DATA" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11.5px] sm:grid-cols-4">
            <div>
              <span className="text-[var(--color-text-dim)]">Farm / Farmer:</span>
              <p className="font-medium text-[var(--color-text)] truncate">{farmDetails.farmName} ({farmDetails.farmerName})</p>
            </div>
            <div>
              <span className="text-[var(--color-text-dim)]">Crop & Variety:</span>
              <p className="font-medium text-[var(--color-text)] truncate">
                {farmDetails.crop} — {farmDetails.cropVariety === "Other" ? farmDetails.customCropVariety : farmDetails.cropVariety}
              </p>
            </div>
            <div>
              <span className="text-[var(--color-text-dim)]">Location:</span>
              <p className="font-medium text-[var(--color-text)] truncate">
                {farmLocation.village || farmLocation.district || "Maharashtra"}, {farmLocation.district}
              </p>
            </div>
            <div>
              <span className="text-[var(--color-text-dim)]">Coordinates / Area:</span>
              <p className="font-medium text-[var(--color-text)] tnum">
                {lat.toFixed(4)}°N, {lng.toFixed(4)}°E ({farmLocation.areaAcres ? `${farmLocation.areaAcres.toFixed(1)} acres` : "—"})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: CURRENT CONDITIONS */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-[var(--color-emerald)]" />
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
              Current Conditions
            </h3>
          </div>
          {weather?.observedAt && (
            <span className="text-[10.5px] text-[var(--color-text-dim)]">
              Observed: {new Date(weather.observedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {loadingLive ? (
          <div className="flex items-center gap-2 rounded-[6px] border border-[var(--color-border)] p-4 text-[12px] text-[var(--color-text-muted)]">
            <RefreshCw size={14} className="animate-spin text-[var(--color-emerald)]" />
            <span>Fetching live weather stream from Open-Meteo…</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <MetricCard
              icon={Thermometer}
              label="Temperature"
              value={weather ? `${weather.temperatureC.toFixed(1)} °C` : "Data unavailable"}
              subtext="Live air temperature"
              badgeType={weather?.status === "live" ? "live" : "error"}
              badgeLabel={weather?.status === "live" ? "LIVE" : "UNAVAILABLE"}
            />
            <MetricCard
              icon={CloudRain}
              label="Rainfall (24h)"
              value={weather ? `${weather.rainfallMm24h.toFixed(1)} mm` : "Data unavailable"}
              subtext="Accumulated last 24h"
              badgeType={weather?.status === "live" ? "live" : "error"}
              badgeLabel={weather?.status === "live" ? "LIVE" : "UNAVAILABLE"}
            />
            <MetricCard
              icon={Wind}
              label="Wind Speed"
              value={weather ? `${weather.windSpeedKph.toFixed(0)} km/h` : "Data unavailable"}
              subtext="Current surface wind"
              badgeType={weather?.status === "live" ? "live" : "error"}
              badgeLabel={weather?.status === "live" ? "LIVE" : "UNAVAILABLE"}
            />
            <MetricCard
              icon={Droplets}
              label="Humidity"
              value={weather ? `${weather.humidityPct.toFixed(0)}%` : "Data unavailable"}
              subtext="Relative humidity"
              badgeType={weather?.status === "live" ? "live" : "error"}
              badgeLabel={weather?.status === "live" ? "LIVE" : "UNAVAILABLE"}
            />
          </div>
        )}
      </div>

      {/* SECTION 2 & 3: HISTORICAL WEATHER EXPOSURE (IMD NetCDF Grid) */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-blue-400" />
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
              Historical Weather Exposure (IMD 0.25° Grid)
            </h3>
          </div>
          {historicalImd?.available && (
            <SourceBadge type="historical" label={`IMD (${historicalImd.yearsAvailable})`} />
          )}
        </div>

        {loadingImd ? (
          <div className="flex items-center gap-2 rounded-[6px] border border-[var(--color-border)] p-4 text-[12px] text-[var(--color-text-muted)]">
            <RefreshCw size={14} className="animate-spin text-blue-400" />
            <span>Querying nearest IMD 0.25° grid cell server-side…</span>
          </div>
        ) : historicalImd?.available ? (
          <div className="flex flex-col gap-3">
            {/* Grid cell metadata notice */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-[11px] text-blue-300">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="shrink-0 text-blue-400" />
                <span>
                  Nearest IMD Grid Cell: <strong>{historicalImd.gridLat}°N, {historicalImd.gridLon}°E</strong> (
                  {historicalImd.distanceKm} km from farm)
                </span>
              </div>
              <span>Reference Year: {historicalImd.referenceYear}</span>
            </div>

            {/* CROP-SEASON HIGHLIGHT (Section 3) */}
            <div className="rounded-[6px] border border-blue-500/30 bg-[var(--color-surface-raised)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-blue-400">
                  {crop} — Season Exposure ({historicalImd.season} / {historicalImd.seasonMonthsLabel})
                </span>
                <SourceBadge type="historical" label="CROP MATCH" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11.5px] sm:grid-cols-4">
                <div className="rounded-[4px] bg-[var(--color-surface)] p-2">
                  <span className="text-[var(--color-text-dim)]">Seasonal Rainfall:</span>
                  <p className="tnum mt-0.5 text-[14px] font-semibold text-[var(--color-text)]">
                    {historicalImd.seasonalRainfallMm?.toFixed(1)} mm
                  </p>
                </div>
                <div className="rounded-[4px] bg-[var(--color-surface)] p-2">
                  <span className="text-[var(--color-text-dim)]">Pre-Harvest 90d Rain:</span>
                  <p className="tnum mt-0.5 text-[14px] font-semibold text-[var(--color-text)]">
                    {historicalImd.rf90dPreharvestMm != null ? `${historicalImd.rf90dPreharvestMm.toFixed(1)} mm` : "Not available"}
                  </p>
                </div>
                <div className="rounded-[4px] bg-[var(--color-surface)] p-2">
                  <span className="text-[var(--color-text-dim)]">Pre-Harvest 30d Rain:</span>
                  <p className="tnum mt-0.5 text-[14px] font-semibold text-[var(--color-text)]">
                    {historicalImd.rf30dPreharvestMm != null ? `${historicalImd.rf30dPreharvestMm.toFixed(1)} mm` : "Not available"}
                  </p>
                </div>
                <div className="rounded-[4px] bg-[var(--color-surface)] p-2">
                  <span className="text-[var(--color-text-dim)]">Pre-Harvest 7d Rain:</span>
                  <p className="tnum mt-0.5 text-[14px] font-semibold text-[var(--color-text)]">
                    {historicalImd.rf7dPreharvestMm != null ? `${historicalImd.rf7dPreharvestMm.toFixed(1)} mm` : "Not available"}
                  </p>
                </div>
              </div>
            </div>

            {/* FULL IMD METRICS GRID */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              <MetricCard
                icon={CloudRain}
                label="Annual Rainfall"
                value={`${historicalImd.annualRainfallMm?.toFixed(1)} mm`}
                subtext="Total year sum"
                badgeType="historical"
              />
              <MetricCard
                icon={Sun}
                label="Rainy Days (≥2.5mm)"
                value={`${historicalImd.rainyDays} days`}
                subtext={`Dry days: ${historicalImd.dryDays} days`}
                badgeType="historical"
              />
              <MetricCard
                icon={Zap}
                label="Max Daily Rain"
                value={`${historicalImd.maxDailyRainfallMm?.toFixed(1)} mm`}
                subtext="Peak single-day intensity"
                badgeType="historical"
              />
              <MetricCard
                icon={Compass}
                label="Max Consec. Rainy"
                value={`${historicalImd.maxConsecutiveRainyDays} days`}
                subtext={`Max dry run: ${historicalImd.maxConsecutiveDryDays} days`}
                badgeType="historical"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-[6px] border border-amber-500/30 bg-amber-500/5 p-4 text-[12px] text-amber-300">
            <p className="font-semibold">Historical Rainfall Data Temporarily Unavailable</p>
            <p className="mt-1 text-[11px] text-amber-400/80">
              {historicalImd?.error || "Could not retrieve nearest IMD grid cell data for the specified coordinates."}
            </p>
          </div>
        )}
      </div>

      {/* DATA TRANSPARENCY FOOTER */}
      <div className="flex items-center gap-2 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-2.5 text-[11px] text-[var(--color-text-dim)]">
        <Info size={14} className="shrink-0 text-[var(--color-emerald)]" />
        <span>
          Live conditions are sourced from Open-Meteo. Historical seasonal exposure data is derived from IMD observed rainfall records for the nearest grid point to your farm location.
        </span>
      </div>
    </div>
  );
}
