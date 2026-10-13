import { NextRequest, NextResponse } from "next/server";
import { generateGeminiCropGuidance, isGeminiAvailable } from "@/lib/ai/gemini";
import { CROP_GUIDANCE, getFallbackGuidance } from "@/lib/farmer/cropGuidance";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cropName,
      cropKey,
      district,
      village,
      soilType,
      irrigationType,
      areaAcres,
      temperatureC,
      humidityPct,
      rainfallMm,
      preferredLanguage,
    } = body;

    if (!cropKey && !cropName) {
      return NextResponse.json(
        { success: false, error: "cropName or cropKey is required" },
        { status: 400 }
      );
    }

    const key = (cropKey || cropName || "").toLowerCase().trim();

    // 1. Try Gemini AI dynamic guidance if available
    if (isGeminiAvailable()) {
      try {
        const guidance = await generateGeminiCropGuidance({
          cropName: cropName || cropKey,
          cropKey: key,
          district,
          village,
          soilType,
          irrigationType,
          areaAcres: Number(areaAcres || 2),
          temperatureC: Number(temperatureC || 27),
          humidityPct: Number(humidityPct || 65),
          rainfallMm: Number(rainfallMm || 120),
          preferredLanguage: preferredLanguage || "mr",
        });

        return NextResponse.json({
          success: true,
          source: "gemini",
          model: "gemini-3.8-flash",
          guidance,
        });
      } catch (geminiErr: any) {
        console.warn("[API /api/ai/guidance] Gemini execution warning, falling back to static database:", geminiErr.message);
      }
    }

    // 2. Fallback to curated static guidance engine
    const staticGuidance = CROP_GUIDANCE[key] || null;

    if (staticGuidance) {
      return NextResponse.json({
        success: true,
        source: "static_curated",
        guidance: staticGuidance,
      });
    }

    // 3. Fallback generic text
    return NextResponse.json({
      success: true,
      source: "fallback",
      guidance: {
        whySuitable: {
          mr: getFallbackGuidance(cropName || key, "mr"),
          hi: getFallbackGuidance(cropName || key, "hi"),
          en: getFallbackGuidance(cropName || key, "en"),
        },
        waterManagement: {
          mr: "स्थानिक मातीच्या ओलाव्यानुसार वेळेवर सिंचन करावे.",
          hi: "मिट्टी की नमी के अनुसार समय पर सिंचाई करें।",
          en: "Irrigate timely based on soil moisture monitoring.",
        },
        fertilizerTiming: {
          mr: "माती परीक्षणानुसार संतुलित NPK खतांचा वापर करावा.",
          hi: "मिट्टी परीक्षण के अनुसार संतुलित उर्वरक दें।",
          en: "Apply balanced NPK nutrients based on local soil test recommendations.",
        },
        growthStageCare: {
          mr: "वाढ व फुलोऱ्याच्या टप्प्यात नियमित शेत पाहणी करावी.",
          hi: "विकास और फूल आने के समय नियमित निगरानी रखें।",
          en: "Inspect regularly during vegetative and flowering stages.",
        },
        weatherPrecautions: {
          mr: "अतिवृष्टी किंवा तापमान बदलांवर लक्ष ठेवून निचरा व्यवस्था ठेवावी.",
          hi: "अत्यधिक वर्षा या मौसम बदलाव पर जल निकासी सुनिश्चित करें।",
          en: "Ensure active field drainage and monitor temperature swings.",
        },
        keyRisks: {
          mr: "कीड-रोग आणि पाणी टंचाई हे प्रमुख जोखीम घटक आहेत.",
          hi: "कीट-रोग और जल संकट प्रमुख जोखिम हैं।",
          en: "Pest incidence and sudden moisture stress represent key risks.",
        },
        nextSteps: {
          mr: "प्रमाणित बियाणे वापरा आणि कृषी विस्तार अधिकाऱ्यांशी संपर्क ठेवा.",
          hi: "प्रमाणित बीज का उपयोग करें और कृषि अधिकारी से संपर्क रखें।",
          en: "Procure certified seeds and consult your local agricultural extension service.",
        },
      },
    });
  } catch (err: any) {
    console.error("[API /api/ai/guidance] Internal error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate guidance" },
      { status: 500 }
    );
  }
}
