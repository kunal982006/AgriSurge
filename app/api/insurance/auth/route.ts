import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDb } from "@/db";
import { insuranceAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface InsuranceAccount {
  phone: string;
  password: string;
  name: string;
  role: string;
  organization: string;
  isDefault?: boolean;
  createdAt: string;
}

const DEFAULT_PHONE = "8767476106";
const DEFAULT_PASSWORD = "password123";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "insurance_users.json");

function getStoredInsurers(): InsuranceAccount[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading insurance_users.json:", err);
  }
  return [];
}

function saveInsurers(list: InsuranceAccount[]): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing insurance_users.json:", err);
  }
}

// POST /api/insurance/auth — { action: "login" | "register", phone, password, name, organization }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, password, name, organization } = body;

    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    const cleanPassword = (password || "").trim();

    if (!cleanPhone || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: "Phone number and password are required." },
        { status: 400 }
      );
    }

    const insurers = getStoredInsurers();

    if (action === "register") {
      if (cleanPhone === DEFAULT_PHONE) {
        return NextResponse.json(
          {
            success: false,
            error: "This phone number is reserved for the primary underwriter account. Please log in directly.",
          },
          { status: 400 }
        );
      }

      const existing = insurers.find((i) => i.phone === cleanPhone);
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this phone number already exists. Please log in.",
          },
          { status: 400 }
        );
      }

      if (cleanPassword.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: "Password must be at least 6 characters long.",
          },
          { status: 400 }
        );
      }

      const newAccount: InsuranceAccount = {
        phone: cleanPhone,
        password: cleanPassword,
        name: (name || "").trim() || "Underwriter Officer",
        role: "Underwriter",
        organization: (organization || "").trim() || "Agricultural Insurance Co.",
        isDefault: false,
        createdAt: new Date().toISOString(),
      };

      // Persist to Neon DB
      try {
        const db = getDb();
        await db.insert(insuranceAccounts).values({
          phone: newAccount.phone,
          name: newAccount.name,
          role: newAccount.role,
          organization: newAccount.organization,
          isDefault: false,
          password: cleanPassword,
        });
      } catch (dbErr) {
        console.warn("[Insurance Auth] DB insert warning:", dbErr);
      }

      insurers.push(newAccount);
      saveInsurers(insurers);

      return NextResponse.json({
        success: true,
        isNew: true,
        user: {
          phone: newAccount.phone,
          name: newAccount.name,
          role: newAccount.role,
          organization: newAccount.organization,
          isDefault: false,
        },
      });
    }

    // Login action
    if (cleanPhone === DEFAULT_PHONE) {
      if (cleanPassword !== DEFAULT_PASSWORD) {
        return NextResponse.json(
          { success: false, error: "Invalid password for insurance account." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        isNew: false,
        user: {
          phone: DEFAULT_PHONE,
          name: "Ronit A.",
          role: "Underwriting Manager",
          organization: "Deccan Mutual",
          isDefault: true,
        },
      });
    }

    // Check custom registered insurers
    const matched = insurers.find((i) => i.phone === cleanPhone);
    if (!matched) {
      return NextResponse.json(
        {
          success: false,
          error: "No account found with this phone number. Please register first.",
        },
        { status: 404 }
      );
    }

    if (matched.password !== cleanPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid password for this account." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      isNew: false,
      user: {
        phone: matched.phone,
        name: matched.name,
        role: matched.role,
        organization: matched.organization,
        isDefault: false,
      },
    });
  } catch (err: any) {
    console.error("[Insurance Auth API] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
