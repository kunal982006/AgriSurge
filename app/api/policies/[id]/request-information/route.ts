import { NextRequest, NextResponse } from "next/server";
import { updateUnderwritingDecision } from "@/lib/underwriting/underwritingStore";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.informationRequest || !body.informationRequest.trim()) {
      return NextResponse.json(
        { error: "Information requested text is required." },
        { status: 400 }
      );
    }

    const updated = await updateUnderwritingDecision({
      id,
      status: "NEEDS_INFORMATION",
      actor: body.actor || "Senior Underwriter",
      decisionReason: "Additional information required",
      informationRequest: body.informationRequest.trim(),
      underwriterNotes: body.underwriterNotes || "",
    });

    return NextResponse.json({
      success: true,
      record: updated,
    });
  } catch (err) {
    console.error("Failed to request info for policy:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to request information." },
      { status: 500 }
    );
  }
}
