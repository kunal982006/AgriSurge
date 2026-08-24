import { NextRequest, NextResponse } from "next/server";
import { getAllUnderwritingRecords } from "@/lib/underwriting/underwritingStore";
import { buildOverviewAnalytics } from "@/lib/analytics/overviewAnalytics";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region") || "ALL";
    const crop = searchParams.get("crop") || "ALL";
    const status = searchParams.get("status") || "ALL";

    const records = await getAllUnderwritingRecords();

    const payload = buildOverviewAnalytics(records, {
      region: region !== "ALL" ? region : undefined,
      crop: crop !== "ALL" ? crop : undefined,
      status: status !== "ALL" ? status : undefined,
    });

    return NextResponse.json({
      success: true,
      ...payload,
    });
  } catch (err) {
    console.error("[/api/overview] Error generating overview intelligence:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to load overview intelligence at this time.",
      },
      { status: 500 }
    );
  }
}
