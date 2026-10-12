import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { farmers } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/farmer/auth — register or login a farmer by phone number
// GET  /api/farmer/auth?phone=... — find a farmer by phone
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone } = body;

    if (!phone || !name) {
      return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

    try {
      const db = getDb();

      // Check if farmer already exists by phone
      const existing = await db
        .select()
        .from(farmers)
        .where(eq(farmers.phone, normalizedPhone))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ farmer: existing[0], isNew: false });
      }

      // Register new farmer
      const inserted = await db
        .insert(farmers)
        .values({ name: name.trim(), phone: normalizedPhone, region: "Maharashtra" })
        .returning();

      return NextResponse.json({ farmer: inserted[0], isNew: true });
    } catch (dbErr) {
      console.warn("[Farmer Auth API] DB error or unavailable, falling back to demo session:", dbErr);
      return NextResponse.json({
        farmer: {
          id: Math.floor(Math.random() * 9000) + 1000,
          name: name.trim(),
          phone: normalizedPhone,
          region: "Maharashtra",
        },
        isNew: true,
        mode: "demo",
      });
    }
  } catch (err) {
    console.error("[Farmer Auth API] Error:", err);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}

// GET — look up a farmer by phone to pre-fill login
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone parameter required" }, { status: 400 });
  }

  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

  try {
    try {
      const db = getDb();
      const result = await db
        .select()
        .from(farmers)
        .where(eq(farmers.phone, normalizedPhone))
        .limit(1);

      if (result.length > 0) {
        return NextResponse.json({ farmer: result[0], found: true });
      }
      return NextResponse.json({ farmer: null, found: false });
    } catch (dbErr) {
      console.warn("[Farmer Auth GET] DB error or unavailable:", dbErr);
      // In demo mode without DB, permit login for recognized test phones or return demo profile
      return NextResponse.json({
        farmer: {
          id: 1001,
          name: "Ramesh Patil",
          phone: normalizedPhone,
          region: "Maharashtra",
        },
        found: true,
        mode: "demo",
      });
    }
  } catch (err) {
    console.error("[Farmer Auth GET] Error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
