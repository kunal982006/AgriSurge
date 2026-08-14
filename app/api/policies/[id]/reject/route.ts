import { NextRequest, NextResponse } from "next/server";
import { updateUnderwritingDecision } from "@/lib/underwriting/underwritingStore";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.rejectionReason || !body.rejectionReason.trim()) {
      return NextResponse.json(
        { error: "A rejection reason is required." },
        { status: 400 }
      );
    }

    const updated = await updateUnderwritingDecision({
      id,
      status: "REJECTED",
      actor: body.actor || "Senior Underwriter",
      decisionReason: body.decisionReason || "Risk exceeds underwriting appetite",
      rejectionReason: body.rejectionReason.trim(),
      underwriterNotes: body.underwriterNotes || "",
    });

    return NextResponse.json({
      success: true,
      record: updated,
    });
  } catch (err) {
    console.error("Failed to reject policy:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reject application." },
      { status: 500 }
    );
  }
}
