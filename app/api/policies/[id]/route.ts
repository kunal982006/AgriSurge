import { NextRequest, NextResponse } from "next/server";
import { getUnderwritingRecordById } from "@/lib/underwriting/underwritingStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await getUnderwritingRecordById(id);

    if (!record) {
      return NextResponse.json({ error: `Underwriting policy ${id} not found.` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (err) {
    console.error("Failed to fetch policy detail:", err);
    return NextResponse.json({ error: "Failed to fetch underwriting record." }, { status: 500 });
  }
}
