import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ADMIN_COOKIE_NAME, signToken, verifyPassword, ensureDefaultAdmin } from "@/lib/admin/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();

    await ensureDefaultAdmin();

    const db = getDb();
    const [adminRecord] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, cleanUsername))
      .limit(1);

    if (!adminRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(cleanPassword, adminRecord.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    // Update last login
    await db
      .update(admins)
      .set({ lastLoginAt: new Date() })
      .where(eq(admins.id, adminRecord.id));

    const token = signToken({
      id: adminRecord.id,
      username: adminRecord.username,
      role: adminRecord.role,
    });

    const res = NextResponse.json({
      success: true,
      admin: {
        id: adminRecord.id,
        username: adminRecord.username,
        name: adminRecord.name,
        email: adminRecord.email,
        role: adminRecord.role,
      },
    });

    // Set secure HTTP-only cookie
    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err: any) {
    console.error("[Admin Auth API] Login error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
