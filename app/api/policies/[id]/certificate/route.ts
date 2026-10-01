import { NextRequest, NextResponse } from "next/server";
import { getUnderwritingRecordById, saveUnderwritingRecord } from "@/lib/underwriting/underwritingStore";
import fs from "fs";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { certificatePdf } = await req.json();

    if (!certificatePdf) {
      return NextResponse.json({ error: "No PDF provided." }, { status: 400 });
    }

    const record = await getUnderwritingRecordById(id);
    if (!record) {
      return NextResponse.json({ error: "Policy not found." }, { status: 404 });
    }

    // Save PDF to public/certificates directory
    const base64Data = certificatePdf.replace(/^data:application\/pdf;filename=generated\.pdf;base64,/, "").replace(/^data:application\/pdf;base64,/, "").replace(/^data:image\/jpeg;base64,/, "").replace(/^data:.*;base64,/, "");
    
    // Actually jsPDF output('datauristring') produces a data URI starting with data:application/pdf;filename=generated.pdf;base64,
    const buffer = Buffer.from(base64Data, "base64");
    
    const certificatesDir = path.join(process.cwd(), "public", "certificates");
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    const fileName = `certificate_${id}.pdf`;
    const filePath = path.join(certificatesDir, fileName);
    
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/certificates/${fileName}`;

    // Update the record with the certificate URL
    const updatedRecord = {
      ...record,
      certificatePdf: publicUrl
    };

    await saveUnderwritingRecord(updatedRecord);

    return NextResponse.json({
      success: true,
      record: updatedRecord,
      certificateUrl: publicUrl
    });
  } catch (err) {
    console.error("Failed to save certificate:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save certificate." },
      { status: 500 }
    );
  }
}
