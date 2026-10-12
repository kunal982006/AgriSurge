import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { farmerAssessments } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing assessment id", success: false }, { status: 400 });
    }

    const db = getDb();
    const isNum = !isNaN(Number(id));

    const records = await db
      .select()
      .from(farmerAssessments)
      .where(
        isNum
          ? or(eq(farmerAssessments.id, Number(id)), eq(farmerAssessments.assessmentCode, id))
          : eq(farmerAssessments.assessmentCode, id)
      )
      .limit(1);

    if (records.length === 0) {
      return NextResponse.json({ error: "Assessment not found", success: false }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assessment: records[0],
    });
  } catch (err) {
    console.error("[Farmer Assessment GET by ID] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to fetch assessment",
      },
      { status: 500 }
    );
  }
}
