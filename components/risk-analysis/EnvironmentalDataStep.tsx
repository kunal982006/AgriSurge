"use client";

import { useEffect, useState } from "react";
import { CloudRain, Droplets, Satellite, Thermometer, Wind } from "lucide-react";
import { CurrentWeather } from "@/lib/weather/types";
import { NdviReading } from "@/lib/satellite/types";

function SourceTag({ status, label }: { status: "live" | "not_configured" | "error"; label: string }) {
  const styles =
    status === "live"
      ? "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]"
      : status === "error"
      ? "bg-[var(--color-red-dim)] text-[var(--color-red)]"
      : "border border-[var(--color-border-strong)] text-[var(--color-text-dim)]";
  return <span className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium ${styles}`}>{label}</span>;
}

function EnvCard({
  icon: Icon,
  label,
  value,
  status,
  sourceLabel,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  status: "live" | "not_configured" | "error";
  sourceLabel: string;
}) {
  return (
    <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-3">
      <div className="flex items-center justify-between">
        <Icon size={14} strokeWidth={1.8} />
        <SourceTag status={status} label={sourceLabel} />
      </div>
      <p className="tnum mt-2 text-[17px] text-[var(--color-text)]">{value}</p>
      <p className="text-[11px] text-[var(--color-text-dim)]">{label}</p>
    </div>
  );
}

export function EnvironmentalDataStep({
  lat,
  lng,
  onData,
}: {
  lat: number | null;
  lng: number | null;
  onData: (data: {
    weather: CurrentWeather | null;
    ndvi: NdviReading | null;
    soilMoisturePct: number | null;
  }) => void;
}) {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [ndvi, setNdvi] = useState<NdviReading | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat === null || lng === null) return;
    const timer = setTimeout(() => setLoading(true), 0);
    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((data) => {
        setWeather(data.weather);
        const mockNdvi: NdviReading = {
          ndvi: null,
          observationDate: null,
          cloudCoveragePct: null,
          status: "not_configured",
          source: "Sentinel Hub",
        };
        setNdvi(mockNdvi);
        onData({ weather: data.weather, ndvi: mockNdvi, soilMoisturePct: null });
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
        onData({ weather: errWeather, ndvi: null, soilMoisturePct: null });
      })
      .finally(() => setLoading(false));
    return () => clearTimeout(timer);
  }, [lat, lng]); // Use primitive dependencies to prevent infinite re-renders

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
    <div className="flex flex-col gap-3">
      {loading && (
        <p className="animate-pulse-soft text-[12px] text-[var(--color-text-muted)]">
          Fetching current weather conditions…
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <EnvCard
          icon={Thermometer}
          label="Temperature"
          value={weather ? `${weather.temperatureC.toFixed(1)}°C` : "—"}
          status={weather?.status ?? "not_configured"}
          sourceLabel={weather?.status === "live" ? "LIVE" : weather?.status === "error" ? "ERROR" : "—"}
        />
        <EnvCard
          icon={CloudRain}
          label="Rainfall (24h)"
          value={weather ? `${weather.rainfallMm24h.toFixed(1)} mm` : "—"}
          status={weather?.status ?? "not_configured"}
          sourceLabel={weather?.status === "live" ? "LIVE" : weather?.status === "error" ? "ERROR" : "—"}
        />
        <EnvCard
          icon={Wind}
          label="Wind speed"
          value={weather ? `${weather.windSpeedKph.toFixed(0)} km/h` : "—"}
          status={weather?.status ?? "not_configured"}
          sourceLabel={weather?.status === "live" ? "LIVE" : weather?.status === "error" ? "ERROR" : "—"}
        />
        <EnvCard
          icon={Droplets}
          label="Humidity"
          value={weather ? `${weather.humidityPct.toFixed(0)}%` : "—"}
          status={weather?.status ?? "not_configured"}
          sourceLabel={weather?.status === "live" ? "LIVE" : weather?.status === "error" ? "ERROR" : "—"}
        />
        <EnvCard
          icon={Droplets}
          label="Soil moisture"
          value="Not available"
          status="not_configured"
          sourceLabel="—"
        />
        <EnvCard
          icon={Satellite}
          label="NDVI (vegetation index)"
          value={ndvi?.ndvi != null ? ndvi.ndvi.toFixed(2) : "Not available"}
          status={ndvi?.status ?? "not_configured"}
          sourceLabel="Satellite"
        />
      </div>
      <p className="text-[11.5px] text-[var(--color-text-dim)]">
        Soil moisture and satellite NDVI require provider credentials (SATELLITE_CLIENT_ID /
        SATELLITE_CLIENT_SECRET). Risk assessment will proceed using available fields.
      </p>
    </div>
  );
}
