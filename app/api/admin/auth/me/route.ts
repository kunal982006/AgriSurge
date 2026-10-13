import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    authenticated: true,
    admin,
  });
}
