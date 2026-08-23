import { NextResponse } from "next/server";

export async function GET() {
  // Check if an IoT node hardware server is reachable or connected
  // By default, if no hardware device is connected to the system, return connected: false
  return NextResponse.json({
    connected: false,
    message: "No AgriSurge IoT hardware device detected on network or local port.",
  });
}
