import { NextRequest, NextResponse } from "next/server";
import { askGeminiFarmerAssistant, isGeminiAvailable } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, context = {}, history = [] } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "Question is required." },
        { status: 400 }
      );
    }

    if (!isGeminiAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured.",
        },
        { status: 503 }
      );
    }

    const answer = await askGeminiFarmerAssistant(
      question.trim(),
      context,
      history
    );

    return NextResponse.json({
      success: true,
      answer,
      model: "gemini-3.8-flash",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[API /api/ai/chat] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process chat query" },
      { status: 500 }
    );
  }
}
