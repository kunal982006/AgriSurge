"use client";

import { useState } from "react";
import {
  Droplets,
  Thermometer,
  Sun,
  Wind,
  FlaskConical,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Edit3,
  WifiOff,
  Zap,
  CloudRain,
  Activity,
  Layers,
} from "lucide-react";

export interface SensorData {
  nitrogen: number | string;
  phosphorus: number | string;
  potassium: number | string;
  temperature: number | string;
  humidity: number | string;
  soilPH: number | string;
  rainfall: number | string;
  source: "manual" | "iot";
  deviceStatus?: "idle" | "searching" | "connecting" | "detected" | "reading" | "connected" | "failed";
  deviceName?: string;
  lastSynced?: string;
}

export const DEFAULT_SENSOR_DATA: SensorData = {
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  temperature: "",
  humidity: "",
  soilPH: "",
  rainfall: "",
  source: "manual",
  deviceStatus: "idle",
  deviceName: "AgriSurge Sensor Node",
  lastSynced: undefined,
};

interface SensorSoilDataStepProps {
  data: SensorData;
  onChange: (updated: SensorData) => void;
}

const FIELD_CLASS =
  "w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-emerald)] focus:outline-none transition-all";

export function SensorSoilDataStep({ data, onChange }: SensorSoilDataStepProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setSource = (source: "manual" | "iot") => {
    if (source === "iot" && data.deviceStatus === undefined) {
      onChange({ ...data, source, deviceStatus: "idle" });
    } else {
      onChange({ ...data, source });
    }
  };

  const handleFieldChange = (key: keyof SensorData, value: string | number) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  // IoT device connection flow simulation & hardware probe
  const startIoTScan = async (forceSimulatedSuccess = false) => {
    onChange({
      ...data,
      source: "iot",
      deviceStatus: "searching",
    });

    await new Promise((r) => setTimeout(r, 800));

    onChange({
      ...data,
      source: "iot",
      deviceStatus: "connecting",
    });

    await new Promise((r) => setTimeout(r, 900));

    let realDeviceDetected = false;
    let hardwareValues: Partial<SensorData> | null = null;

    if (forceSimulatedSuccess) {
      realDeviceDetected = true;
      hardwareValues = {
        nitrogen: 90,
        phosphorus: 42,
        potassium: 43,
        temperature: 25.5,
        humidity: 80,
        soilPH: 6.5,
        rainfall: 200,
        deviceName: "AgriSurge Demo Hardware #8421",
      };
    } else {
      try {
        const res = await fetch("/api/iot/detect", { method: "GET" }).catch(() => null);
        if (res && res.ok) {
          const body = await res.json();
          if (body.connected) {
            realDeviceDetected = true;
            hardwareValues = body.sensorData;
          }
        }
      } catch {
        realDeviceDetected = false;
      }
    }

    if (!realDeviceDetected) {
      onChange({
        ...data,
        source: "iot",
        deviceStatus: "failed",
      });
      return;
    }

    onChange({
      ...data,
      source: "iot",
      deviceStatus: "detected",
    });

    await new Promise((r) => setTimeout(r, 600));

    onChange({
      ...data,
      source: "iot",
      deviceStatus: "reading",
    });

    await new Promise((r) => setTimeout(r, 600));

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    onChange({
      nitrogen: hardwareValues?.nitrogen ?? 90,
      phosphorus: hardwareValues?.phosphorus ?? 42,
      potassium: hardwareValues?.potassium ?? 43,
      temperature: hardwareValues?.temperature ?? 25.5,
      humidity: hardwareValues?.humidity ?? 80,
      soilPH: hardwareValues?.soilPH ?? 6.5,
      rainfall: hardwareValues?.rainfall ?? 200,
      source: "iot",
      deviceStatus: "connected",
      deviceName: hardwareValues?.deviceName || "AgriSurge Sensor Node",
      lastSynced: `Just now (${timeStr})`,
    });
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await startIoTScan(data.deviceName?.includes("Demo") ?? true);
    setIsRefreshing(false);
  };

  const isIotConnected = data.source === "iot" && data.deviceStatus === "connected";
  const isIotLoading =
    data.source === "iot" &&
    ["searching", "connecting", "detected", "reading"].includes(data.deviceStatus || "");

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-emerald-dim)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-emerald)]">
            Step 1 — Sensor & Soil Data
          </span>
          <span className="text-[11px] text-[var(--color-text-dim)]">Initial Assessment Input</span>
        </div>
        <h2 className="mt-2 text-[17px] font-semibold text-[var(--color-text)]">
          Sensor & Soil Parameters
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
          Provide soil and environmental readings manually or connect an AgriSurge IoT device.
        </p>
      </div>

      {/* Input Method Selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setSource("manual")}
          className={`flex items-center gap-3 rounded-[8px] border px-4 py-3 text-left transition-all ${
            data.source === "manual"
              ? "border-[var(--color-emerald)] bg-[var(--color-surface-raised)] shadow-sm"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              data.source === "manual"
                ? "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]"
                : "bg-[var(--color-surface-raised)] text-[var(--color-text-dim)]"
            }`}
          >
            <Edit3 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text)]">
              <span>Enter Manually</span>
            </div>
            <p className="text-[11.5px] text-[var(--color-text-muted)]">
              Input soil NPK & environmental values manually
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSource("iot")}
          className={`flex items-center gap-3 rounded-[8px] border px-4 py-3 text-left transition-all ${
            data.source === "iot"
              ? "border-[var(--color-emerald)] bg-[var(--color-surface-raised)] shadow-sm"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              data.source === "iot"
                ? "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]"
                : "bg-[var(--color-surface-raised)] text-[var(--color-text-dim)]"
            }`}
          >
            <Radio size={18} className={isIotLoading ? "animate-pulse" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text)]">
              <span>Detect with IoT Device</span>
              <span className="rounded bg-[var(--color-emerald-dim)] px-1.5 py-0.2 text-[9.5px] font-medium uppercase text-[var(--color-emerald)]">
                Smart Node
              </span>
            </div>
            <p className="text-[11.5px] text-[var(--color-text-muted)]">
              Sync telemetry automatically from AgriSurge IoT Hardware
            </p>
          </div>
        </button>
      </div>

      {/* IoT Device Detection Controller */}
      {data.source === "iot" && (
        <div className="rounded-[8px] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 transition-all">
          {/* State: Idle / Initial */}
          {(data.deviceStatus === "idle" || !data.deviceStatus) && (
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-emerald)]">
                  <Cpu size={20} />
                </div>
                <div>
                  <h4 className="text-[13px] font-medium text-[var(--color-text)]">
                    Ready to detect AgriSurge IoT device
                  </h4>
                  <p className="text-[11.5px] text-[var(--color-text-muted)]">
                    Ensure your AgriSurge IoT Node is powered on and within range.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => startIoTScan(false)}
                  className="flex items-center gap-2 rounded-[6px] bg-[var(--color-emerald)] px-3.5 py-2 text-[12.5px] font-medium text-[#0c1210] transition-transform hover:opacity-90 active:scale-[0.98]"
                >
                  <Zap size={14} />
                  Detect Device
                </button>
                <button
                  type="button"
                  title="Simulate successful detection for demo"
                  onClick={() => startIoTScan(true)}
                  className="rounded-[6px] border border-[var(--color-border)] px-2.5 py-2 text-[11px] text-[var(--color-text-dim)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-muted)]"
                >
                  Demo Mode
                </button>
              </div>
            </div>
          )}

          {/* State: Scanning / Connecting / Reading */}
          {isIotLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-3 text-center">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-emerald)] opacity-25" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-emerald)] shadow-md">
                  <Radio size={20} className="animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text)]">
                  {data.deviceStatus === "searching" && "Searching for device..."}
                  {data.deviceStatus === "connecting" && "Connecting to AgriSurge Sensor Node..."}
                  {data.deviceStatus === "detected" && "Device Detected"}
                  {data.deviceStatus === "reading" && "Reading sensor values..."}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[var(--color-text-muted)]">
                  Retrieving soil NPK & environmental parameters.
                </p>
              </div>
            </div>
          )}

          {/* State: Connected */}
          {isIotConnected && (
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-emerald-dim)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-emerald)]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-emerald)]" />
                      LIVE SENSOR DATA DETECTED
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11.5px] text-[var(--color-text-muted)]">
                    <span>
                      Device: <strong className="text-[var(--color-text)]">{data.deviceName || "AgriSurge Sensor Node"}</strong>
                    </span>
                    <span>
                      Status: <strong className="text-[var(--color-emerald)]">Connected</strong>
                    </span>
                    {data.lastSynced && (
                      <span>
                        Last Synced: <strong className="text-[var(--color-text)]">{data.lastSynced}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] disabled:opacity-50"
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[var(--color-emerald)]" : ""} />
                <span>{isRefreshing ? "Refreshing..." : "↻ Refresh Sensor Data"}</span>
              </button>
            </div>
          )}

          {/* State: Device Not Detected */}
          {data.deviceStatus === "failed" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-red-dim)] text-[var(--color-red)]">
                  <WifiOff size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-red-dim)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-red)]">
                      <AlertTriangle size={12} />
                      Device Not Detected
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] font-medium text-[var(--color-text)]">
                    No physical AgriSurge IoT hardware was found.
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--color-text-muted)]">
                    Please ensure your ESP32 or AgriSurge Sensor Node is powered on, or enter your real sensor readings manually below.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] pt-3">
                <button
                  type="button"
                  onClick={() => startIoTScan(true)}
                  className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
                >
                  <Zap size={13} className="text-[var(--color-emerald)]" />
                  Load Demo Data
                </button>
                <button
                  type="button"
                  onClick={() => setSource("manual")}
                  className="flex items-center gap-1.5 rounded-[6px] bg-[var(--color-emerald)] px-3.5 py-1.5 text-[12px] font-medium text-[#0c1210] transition-all hover:opacity-90"
                >
                  <Edit3 size={13} />
                  Enter Real Data Manually
                </button>
                <button
                  type="button"
                  onClick={() => startIoTScan(false)}
                  className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                >
                  <RefreshCw size={13} />
                  Retry Detection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7 Parameters Display Layout */}
      <div className="flex flex-col gap-5">
        {/* SECTION 1: SOIL NUTRIENTS (N, P, K) */}
        <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
            <Activity size={16} className="text-[var(--color-emerald)]" />
            <h3 className="text-[13px] font-semibold tracking-wide text-[var(--color-text)] uppercase">
              Soil Nutrients (NPK)
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* 1. Nitrogen (N) */}
            <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 focus-within:border-[var(--color-emerald)]">
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-[12px] font-medium text-[var(--color-text)] flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-emerald-dim)] text-[10px] font-bold text-[var(--color-emerald)]">
                    N
                  </span>
                  <span>Nitrogen (N)</span>
                </label>
                <span className="text-[10px] text-[var(--color-text-dim)]">mg/kg</span>
              </div>
              <div className="relative mt-1 flex items-center">
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  disabled={data.source === "iot" && !isIotConnected}
                  className={FIELD_CLASS}
                  value={data.nitrogen}
                  onChange={(e) => handleFieldChange("nitrogen", e.target.value)}
                  placeholder="e.g. 90"
                />
                <span className="absolute right-3 text-[11px] text-[var(--color-text-muted)]">mg/kg</span>
              </div>
            </div>

            {/* 2. Phosphorus (P) */}
            <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 focus-within:border-[var(--color-emerald)]">
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-[12px] font-medium text-[var(--color-text)] flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-amber-dim)] text-[10px] font-bold text-[var(--color-amber)]">
                    P
                  </span>
                  <span>Phosphorus (P)</span>
                </label>
                <span className="text-[10px] text-[var(--color-text-dim)]">mg/kg</span>
              </div>
              <div className="relative mt-1 flex items-center">
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  disabled={data.source === "iot" && !isIotConnected}
                  className={FIELD_CLASS}
                  value={data.phosphorus}
                  onChange={(e) => handleFieldChange("phosphorus", e.target.value)}
                  placeholder="e.g. 42"
                />
                <span className="absolute right-3 text-[11px] text-[var(--color-text-muted)]">mg/kg</span>
              </div>
            </div>

            {/* 3. Potassium (K) */}
            <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 focus-within:border-[var(--color-emerald)]">
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-[12px] font-medium text-[var(--color-text)] flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-emerald-dim)] text-[10px] font-bold text-[var(--color-accent)]">
                    K
                  </span>
                  <span>Potassium (K)</span>
                </label>
                <span className="text-[10px] text-[var(--color-text-dim)]">mg/kg</span>
              </div>
              <div className="relative mt-1 flex items-center">
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  disabled={data.source === "iot" && !isIotConnected}
                  className={FIELD_CLASS}
                  value={data.potassium}
                  onChange={(e) => handleFieldChange("potassium", e.target.value)}
                  placeholder="e.g. 43"
                />
                <span className="absolute right-3 text-[11px] text-[var(--color-text-muted)]">mg/kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ENVIRONMENTAL CONDITIONS */}
        <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
            <Sun size={16} className="text-[var(--color-amber)]" />
            <h3 className="text-[13px] font-semibold tracking-wide text-[var(--color-text)] uppercase">
              Environmental Conditions
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* 4. Temperature */}
            <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 focus-within:border-[var(--color-emerald)]">
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-[12px] font-medium text-[var(--color-text)] flex items-center gap-1.5">
                  <Thermometer size={14} className="text-[var(--color-amber)]" />
                  <span>Temperature</span>
                </label>
                <span className="text-[10px] text-[var(--color-text-dim)]">°C</span>
              </div>
              <div className="relative mt-1 flex items-center">
                <input
                  type="number"
                  min="-10"
                  max="60"
                  step="0.1"
                  disabled={data.source === "iot" && !isIotConnected}
                  className={FIELD_CLASS}
                  value={data.temperature}
                  onChange={(e) => handleFieldChange("temperature", e.target.value)}
                  placeholder="e.g. 25.5"
                />
                <span className="absolute right-3 text-[11px] text-[var(--color-text-muted)]">°C</span>
              </div>
            </div>

            {/* 5. Humidity */}
            <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 focus-within:border-[var(--color-emerald)]">
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-[12px] font-medium text-[var(--color-text)] flex items-center gap-1.5">
                  <Wind size={14} className="text-[var(--color-emerald)]" />
                  <span>Humidity</span>
                </label>
                <span className="text-[10px] text-[var(--color-text-dim)]">%</span>
              </div>
              <div className="relative mt-1 flex items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  disabled={data.source === "iot" && !isIotConnected}
                  className={FIELD_CLASS}
                  value={data.humidity}
                  onChange={(e) => handleFieldChange("humidity", e.target.value)}
                  placeholder="e.g. 80"
                />
                <span className="absolute right-3 text-[11px] text-[var(--color-text-muted)]">%</span>
              </div>
            </div>

            {/* 6. Rainfall */}
            <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 focus-within:border-[var(--color-emerald)]">
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-[12px] font-medium text-[var(--color-text)] flex items-center gap-1.5">
                  <CloudRain size={14} className="text-[var(--color-emerald)]" />
                  <span>Rainfall</span>
                </label>
                <span className="text-[10px] text-[var(--color-text-dim)]">mm</span>
              </div>
              <div className="relative mt-1 flex items-center">
                <input
                  type="number"
                  min="0"
                  max="5000"
                  step="1"
                  disabled={data.source === "iot" && !isIotConnected}
                  className={FIELD_CLASS}
                  value={data.rainfall}
                  onChange={(e) => handleFieldChange("rainfall", e.target.value)}
                  placeholder="e.g. 200"
                />
                <span className="absolute right-3 text-[11px] text-[var(--color-text-muted)]">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: SOIL CONDITION */}
        <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
            <Layers size={16} className="text-[var(--color-accent)]" />
            <h3 className="text-[13px] font-semibold tracking-wide text-[var(--color-text)] uppercase">
              Soil Condition
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* 7. Soil pH */}
            <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 focus-within:border-[var(--color-emerald)]">
              <div className="flex items-center justify-between pb-1.5">
                <label className="text-[12px] font-medium text-[var(--color-text)] flex items-center gap-1.5">
                  <FlaskConical size={14} className="text-[var(--color-accent)]" />
                  <span>Soil pH Level</span>
                </label>
                <span className="text-[10px] text-[var(--color-text-dim)]">pH (0–14)</span>
              </div>
              <div className="relative mt-1 flex items-center">
                <input
                  type="number"
                  min="0"
                  max="14"
                  step="0.1"
                  disabled={data.source === "iot" && !isIotConnected}
                  className={FIELD_CLASS}
                  value={data.soilPH}
                  onChange={(e) => handleFieldChange("soilPH", e.target.value)}
                  placeholder="e.g. 6.5"
                />
                <span className="absolute right-3 text-[11px] text-[var(--color-text-muted)]">pH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
