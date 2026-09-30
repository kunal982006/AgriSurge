import { NextRequest, NextResponse } from "next/server";
import { updateUnderwritingDecision, getUnderwritingRecordById, saveUnderwritingRecord } from "@/lib/underwriting/underwritingStore";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // If a regenerated boundary image is provided, update it first
    if (body.boundaryImageBase64) {
      const record = await getUnderwritingRecordById(id);
      if (record) {
        record.boundaryImageBase64 = body.boundaryImageBase64;
        await saveUnderwritingRecord(record);
      }
    }

    const updated = await updateUnderwritingDecision({
      id,
      status: "APPROVED",
      actor: body.actor || "Senior Underwriter",
      decisionReason: body.decisionReason || "Acceptable risk appetite",
      underwriterNotes: body.underwriterNotes || "",
    });

    return NextResponse.json({
      success: true,
      record: updated,
    });
  } catch (err) {
    console.error("Failed to approve policy:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to approve underwriting application." },
      { status: 500 }
    );
  }
}
