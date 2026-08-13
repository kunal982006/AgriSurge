import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

// NOTE: this project is designed around IBM Plex Sans / IBM Plex Mono
// (see app/globals.css --font-sans / --font-mono). We load them via
// next/font/google in normal development; that requires network access to
// fonts.googleapis.com. If your environment can reach Google Fonts, restore:
//
//   import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
//   const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400","500","600","700"] });
//   const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400","500","600"] });
//
// and add `${plexSans.variable} ${plexMono.variable}` back to the <html> className below.

export const metadata: Metadata = {
  title: "AgriSurge — Agricultural Risk & Underwriting Platform",
  description: "AI-assisted agricultural risk assessment and dynamic insurance pricing platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
