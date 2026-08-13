"use client";

import dynamic from "next/dynamic";
import { type MapInnerProps } from "./MapInner";

// Dynamically import the real Leaflet component, disabling server-side rendering
// because Leaflet depends heavily on the browser `window` object.
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:16px_16px]">
      <div className="rounded-[6px] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-3 py-2 text-center">
        <p className="text-[12px] font-medium text-[var(--color-text-muted)]">Loading Map...</p>
      </div>
    </div>
  ),
});

export function MapView(props: MapInnerProps) {
  return <MapInner {...props} />;
}
