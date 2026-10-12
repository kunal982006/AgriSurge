"use client";

import { useEffect, useRef, useState } from "react";

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const attemptPlay = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Autoplay deferred or restricted by browser:", err);
      }
    };

    if (video.readyState >= 2) {
      attemptPlay();
    } else {
      video.addEventListener("loadeddata", attemptPlay, { once: true });
      video.addEventListener("canplay", attemptPlay, { once: true });
    }

    const handlePlay = () => setIsPlaying(true);
    video.addEventListener("play", handlePlay);

    return () => {
      video.removeEventListener("play", handlePlay);
    };
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden select-none bg-[#07140d]">
      {/* Fallback agricultural background in case video fails */}
      <div
        className="absolute inset-0 bg-[#07140d]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 20%, rgba(20, 55, 35, 0.45) 0%, rgba(7, 20, 13, 0.95) 75%),
            linear-gradient(180deg, rgba(8, 24, 15, 0.85) 0%, rgba(5, 14, 9, 0.98) 100%)
          `,
        }}
      />

      {/* Uploaded background video (84624-585553977_medium.mp4) */}
      {!hasError && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setHasError(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            isPlaying ? "opacity-100" : "opacity-90"
          }`}
          style={{ objectFit: "cover" }}
        >
          <source src="/videos/84624-585553977_medium.mp4" type="video/mp4" />
          <source src="/assets/hero-background.mp4" type="video/mp4" />
        </video>
      )}

      {/* Reduced lightweight dark overlay so the farm video is clearly visible, bright and attractive */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, 
              rgba(4, 12, 8, 0.45) 0%, 
              rgba(5, 14, 9, 0.25) 30%, 
              rgba(5, 14, 9, 0.35) 70%, 
              rgba(4, 12, 8, 0.60) 100%
            )
          `,
        }}
      />
    </div>
  );
}
