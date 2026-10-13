import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";

const SECRET_KEY = process.env.ADMIN_JWT_SECRET || "agrisurge_admin_secret_key_2026_super_secure";
export const ADMIN_COOKIE_NAME = "agrisurge_admin_token";

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, originalHash] = combinedHash.split(":");
    if (!salt || !originalHash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(testHash, "hex"), Buffer.from(originalHash, "hex"));
  } catch {
    return false;
  }
}

export function signToken(payload: { id: number; username: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { id: number; username: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    if (payload.role !== "admin") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function ensureDefaultAdmin(): Promise<void> {
  try {
    const db = getDb();
    const existing = await db.select().from(admins).where(eq(admins.username, "admin")).limit(1);
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "Ronit@2006";
    if (existing.length === 0) {
      await db.insert(admins).values({
        username: "admin",
        name: "AgriSurge Chief Administrator",
        email: "admin@agrisurge.io",
        passwordHash: hashPassword(defaultPassword),
        role: "admin",
      });
      console.log("[Admin Auth] Initialized default platform administrator account ('admin')");
    }
  } catch (err) {
    console.error("[Admin Auth] Error ensuring default admin:", err);
  }
}


export async function getAdminFromRequest(req: NextRequest): Promise<AdminUser | null> {
  // Check cookie or Authorization bearer header
  const token =
    req.cookies.get(ADMIN_COOKIE_NAME)?.value ||
    req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;

  try {
    const db = getDb();
    const [user] = await db
      .select({
        id: admins.id,
        username: admins.username,
        name: admins.name,
        email: admins.email,
        role: admins.role,
      })
      .from(admins)
      .where(eq(admins.id, decoded.id))
      .limit(1);

    return user || null;
  } catch {
    return null;
  }
}

export async function requireAdminAuth(req: NextRequest): Promise<{ admin: AdminUser } | NextResponse> {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin privileges required." },
      { status: 401 }
    );
  }
  return { admin };
}
