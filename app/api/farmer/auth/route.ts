import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { farmers } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

interface FarmerCredential {
  phone: string;
  password: string;
  id?: number;
  name?: string;
}

const CREDS_FILE_PATH = path.join(process.cwd(), "data", "farmer_credentials.json");

function getStoredFarmerCredentials(): FarmerCredential[] {
  try {
    if (fs.existsSync(CREDS_FILE_PATH)) {
      const raw = fs.readFileSync(CREDS_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading farmer_credentials.json:", err);
  }
  return [];
}

function saveFarmerCredentials(list: FarmerCredential[]): void {
  try {
    const dir = path.dirname(CREDS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CREDS_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing farmer_credentials.json:", err);
  }
}

// POST /api/farmer/auth — register or login a farmer with phone and password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "login", name, phone, password } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanPassword = (password || "").trim();

    if (normalizedPhone.length < 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number." }, { status: 400 });
    }

    if (!cleanPassword) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const credsList = getStoredFarmerCredentials();

    if (action === "register") {
      if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: "Name is required for registration." }, { status: 400 });
      }

      if (cleanPassword.length < 4) {
        return NextResponse.json({ error: "Password must be at least 4 characters long." }, { status: 400 });
      }

      // Check if phone already registered
      const existingCred = credsList.find((c) => c.phone === normalizedPhone);
      if (existingCred) {
        return NextResponse.json({
          error: "An account with this phone number already exists. Please login instead.",
        }, { status: 400 });
      }

      try {
        const db = getDb();

        // Check if farmer already in DB
        const existingFarmer = await db
          .select()
          .from(farmers)
          .where(eq(farmers.phone, normalizedPhone))
          .limit(1);

        let farmerData;
        if (existingFarmer.length > 0) {
          farmerData = existingFarmer[0];
        } else {
          const inserted = await db
            .insert(farmers)
            .values({ name: name.trim(), phone: normalizedPhone, region: "Maharashtra" })
            .returning();
          farmerData = inserted[0];
        }

        // Store credential
        credsList.push({
          phone: normalizedPhone,
          password: cleanPassword,
          id: farmerData.id,
          name: farmerData.name,
        });
        saveFarmerCredentials(credsList);

        return NextResponse.json({
          success: true,
          farmer: farmerData,
          isNew: true,
        });
      } catch (dbErr) {
        console.warn("[Farmer Auth API] DB unavailable, creating local demo profile:", dbErr);
        const demoFarmer = {
          id: Math.floor(Math.random() * 9000) + 1000,
          name: name.trim(),
          phone: normalizedPhone,
          region: "Maharashtra",
        };

        credsList.push({
          phone: normalizedPhone,
          password: cleanPassword,
          id: demoFarmer.id,
          name: demoFarmer.name,
        });
        saveFarmerCredentials(credsList);

        return NextResponse.json({
          success: true,
          farmer: demoFarmer,
          isNew: true,
          mode: "demo",
        });
      }
    }

    // Login action
    const matchedCred = credsList.find((c) => c.phone === normalizedPhone);

    // If password doesn't match registered credential
    if (matchedCred && matchedCred.password !== cleanPassword) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Try finding farmer in DB
    try {
      const db = getDb();
      const existing = await db
        .select()
        .from(farmers)
        .where(eq(farmers.phone, normalizedPhone))
        .limit(1);

      if (existing.length > 0) {
        // If farmer existed in DB without recorded credentials, save now
        if (!matchedCred) {
          credsList.push({
            phone: normalizedPhone,
            password: cleanPassword,
            id: existing[0].id,
            name: existing[0].name,
          });
          saveFarmerCredentials(credsList);
        }

        return NextResponse.json({
          success: true,
          farmer: existing[0],
          isNew: false,
        });
      }

      // If registered locally in credsList but not yet in DB
      if (matchedCred) {
        const [inserted] = await db
          .insert(farmers)
          .values({
            name: matchedCred.name || "Farmer",
            phone: normalizedPhone,
            region: "Maharashtra",
          })
          .returning();

        return NextResponse.json({
          success: true,
          farmer: inserted,
          isNew: false,
        });
      }

      // Not found
      return NextResponse.json({
        error: "This phone number is not registered. Please register first.",
      }, { status: 404 });
    } catch (dbErr) {
      console.warn("[Farmer Auth API] DB error during login:", dbErr);
      if (matchedCred) {
        return NextResponse.json({
          success: true,
          farmer: {
            id: matchedCred.id || 1001,
            name: matchedCred.name || "Ramesh Patil",
            phone: normalizedPhone,
            region: "Maharashtra",
          },
          isNew: false,
          mode: "demo",
        });
      }

      return NextResponse.json({
        error: "This phone number is not registered. Please register first.",
      }, { status: 404 });
    }
  } catch (err) {
    console.error("[Farmer Auth API] Error:", err);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}

// GET — look up a farmer by phone
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone parameter required" }, { status: 400 });
  }

  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

  try {
    const credsList = getStoredFarmerCredentials();
    const hasCreds = credsList.some((c) => c.phone === normalizedPhone);

    try {
      const db = getDb();
      const result = await db
        .select()
        .from(farmers)
        .where(eq(farmers.phone, normalizedPhone))
        .limit(1);

      if (result.length > 0) {
        return NextResponse.json({ farmer: result[0], found: true, hasPassword: hasCreds });
      }

      if (hasCreds) {
        const c = credsList.find((x) => x.phone === normalizedPhone)!;
        return NextResponse.json({
          farmer: { id: c.id || 1001, name: c.name || "Farmer", phone: normalizedPhone, region: "Maharashtra" },
          found: true,
          hasPassword: true,
        });
      }

      return NextResponse.json({ farmer: null, found: false });
    } catch (dbErr) {
      console.warn("[Farmer Auth GET] DB error or unavailable:", dbErr);
      if (hasCreds) {
        const c = credsList.find((x) => x.phone === normalizedPhone)!;
        return NextResponse.json({
          farmer: { id: c.id || 1001, name: c.name || "Farmer", phone: normalizedPhone, region: "Maharashtra" },
          found: true,
          mode: "demo",
        });
      }
      return NextResponse.json({ farmer: null, found: false });
    }
  } catch (err) {
    console.error("[Farmer Auth GET] Error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
