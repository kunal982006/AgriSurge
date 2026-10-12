import { NextResponse } from "next/server";

export type GuidanceSection = {
  id: string;
  title: string;
  content: string;
};

export type GuidanceResponse = {
  language: "mr" | "hi" | "en";
  cropKey: string;
  cropName: string;
  source: "gemini" | "knowledge_base";
  sections: GuidanceSection[];
  fullText: string;
};

const SECTION_METADATA: Record<
  "mr" | "hi" | "en",
  Array<{ id: string; title: string; prompt: string }>
> = {
  mr: [
    {
      id: "requirements",
      title: "पीक परिचय आणि मूलभूत वाढीच्या गरजा",
      prompt: "Crop introduction, agro-climatic suitability, and basic growing requirements",
    },
    {
      id: "land_preparation",
      title: "जमीन तयारी आणि पेरणी / लावणी पद्धत",
      prompt: "Land preparation, seed treatment, spacing, and sowing/transplanting method",
    },
    {
      id: "irrigation",
      title: "सिंचन आणि पाणी व्यवस्थापन",
      prompt: "Irrigation scheduling, water-saving methods, critical stages for moisture",
    },
    {
      id: "fertilizer",
      title: "खत आणि पोषण व्यवस्थापन (सेंद्रिय व रासायनिक)",
      prompt: "Fertilizer and nutrient management schedule (basal and split top-dressings)",
    },
    {
      id: "growth_stages",
      title: "पिकाची निगा आणि वाढीचे महत्त्वाचे टप्पे",
      prompt: "Crop care, intercultural weeding, and growth stage monitoring",
    },
    {
      id: "pest_disease",
      title: "कीड व रोग नियंत्रण आणि एकात्मिक संरक्षण",
      prompt: "Common pests/diseases identification and integrated pest management (IPM)",
    },
    {
      id: "weather_precautions",
      title: "हवामान विषयक दक्षता व जोखीम व्यवस्थापन",
      prompt: "Weather precautions based on observed temperature, rainfall, and humidity",
    },
    {
      id: "harvesting",
      title: "काढणी, साठवणूक आणि उत्पादन मार्गदर्शन",
      prompt: "Harvesting maturity signs, post-harvest drying, storage, and market handling",
    },
  ],
  hi: [
    {
      id: "requirements",
      title: "फसल परिचय एवं बुनियादी वृद्धि आवश्यकताएं",
      prompt: "Crop introduction, agro-climatic suitability, and basic growing requirements",
    },
    {
      id: "land_preparation",
      title: "खेत की तैयारी एवं बुवाई / रोपाई विधि",
      prompt: "Land preparation, seed treatment, spacing, and sowing/transplanting method",
    },
    {
      id: "irrigation",
      title: "सिंचाई एवं जल प्रबंधन",
      prompt: "Irrigation scheduling, water-saving methods, critical stages for moisture",
    },
    {
      id: "fertilizer",
      title: "उर्वरक एवं पोषण प्रबंधन",
      prompt: "Fertilizer and nutrient management schedule (basal and split top-dressings)",
    },
    {
      id: "growth_stages",
      title: "फसल देखभाल एवं विकास के प्रमुख चरण",
      prompt: "Crop care, intercultural weeding, and growth stage monitoring",
    },
    {
      id: "pest_disease",
      title: "कीट एवं रोग निगरानी तथा एकीकृत प्रबंधन",
      prompt: "Common pests/diseases identification and integrated pest management (IPM)",
    },
    {
      id: "weather_precautions",
      title: "मौसम संबंधी सावधानियां एवं जोखिम प्रबंधन",
      prompt: "Weather precautions based on observed temperature, rainfall, and humidity",
    },
    {
      id: "harvesting",
      title: "कटाई, गहाई, भंडारण एवं उपज मार्गदर्शन",
      prompt: "Harvesting maturity signs, post-harvest drying, storage, and market handling",
    },
  ],
  en: [
    {
      id: "requirements",
      title: "Crop Introduction & Growing Requirements",
      prompt: "Crop introduction, agro-climatic suitability, and basic growing requirements",
    },
    {
      id: "land_preparation",
      title: "Land Preparation, Seed Treatment & Sowing",
      prompt: "Land preparation, seed treatment, spacing, and sowing/transplanting method",
    },
    {
      id: "irrigation",
      title: "Irrigation & Water Management",
      prompt: "Irrigation scheduling, water-saving methods, critical stages for moisture",
    },
    {
      id: "fertilizer",
      title: "Fertilizer & Nutrient Management",
      prompt: "Fertilizer and nutrient management schedule (basal and split top-dressings)",
    },
    {
      id: "growth_stages",
      title: "Crop Care & Growth Stage Milestones",
      prompt: "Crop care, intercultural weeding, and growth stage monitoring",
    },
    {
      id: "pest_disease",
      title: "Pest & Disease Monitoring (IPM)",
      prompt: "Common pests/diseases identification and integrated pest management (IPM)",
    },
    {
      id: "weather_precautions",
      title: "Weather Precautions & Microclimate Advisory",
      prompt: "Weather precautions based on observed temperature, rainfall, and humidity",
    },
    {
      id: "harvesting",
      title: "Harvesting, Post-Harvest Storage & Yield Guidance",
      prompt: "Harvesting maturity signs, post-harvest drying, storage, and market handling",
    },
  ],
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      cropKey,
      cropNameEn,
      cropNameLocal,
      language = "mr",
      farmerDetails = {},
      weather = {},
      soil = {},
    } = body;

    const lang: "mr" | "hi" | "en" =
      language === "mr" || language === "hi" || language === "en" ? language : "mr";

    const cropName = cropNameLocal || cropNameEn || cropKey || "Crop";
    const apiKey = process.env.GEMINI_API_KEY?.trim() || "";

    // Build agronomic prompt context
    const districtText = farmerDetails.district
      ? `District: ${farmerDetails.district}${farmerDetails.village ? `, Village: ${farmerDetails.village}` : ""}`
      : "Region: Maharashtra, India";
    const soilText = `Soil Type: ${soil.soilType || "Standard Agricultural Soil"}, Farm Area: ${soil.areaAcres || 2} acres, Irrigation: ${soil.irrigationType || "Rainfed"}`;
    const weatherText = weather.temperatureC
      ? `Observed Microclimate: Temp ${weather.temperatureC}°C, Humidity ${weather.humidityPct}%, Rainfall ${weather.rainfallMm || 0}mm`
      : "Standard Seasonal Monsoon & Post-Monsoon Climate";

    const langInstructions = {
      mr: `IMPORTANT LANGUAGE REQUIREMENT: Write the entire response in natural, fluent, professional, yet easy-to-understand Marathi in Devanagari script. Do NOT return English or Hindi words unless standard technical names with Marathi explanation. Keep sentences clear for rural Maharashtrian farmers.`,
      hi: `IMPORTANT LANGUAGE REQUIREMENT: Write the entire response in natural, fluent, professional, yet easy-to-understand Hindi in Devanagari script. Do NOT return English or Marathi words. Keep sentences clear and practical for Indian farmers.`,
      en: `IMPORTANT LANGUAGE REQUIREMENT: Write the entire response in clear, simple, practical English accessible to farmers and extension workers.`,
    };

    const sectionSpecs = SECTION_METADATA[lang];
    const sectionListPrompt = sectionSpecs
      .map(
        (s, idx) =>
          `${idx + 1}. SECTION ID: "${s.id}"\n   Title: "${s.title}"\n   Focus: ${s.prompt}`
      )
      .join("\n\n");

    const systemPrompt = `You are AgriSurge's Senior Agricultural Scientist and Extension Specialist for India.
You provide accurate, practical, actionable, and verified crop guidance to farmers based on Agricultural University Packages of Practices (ICAR, MPKV Rahuri, PDKV Akola, VNMKV Parbhani).

AGRONOMIC RULES:
1. Never invent soil nutrient values, laboratory test numbers, or guaranteed crop yields.
2. If specific soil test readings (NPK/pH) are not provided, provide recommended standard basal/split nutrient management with clear notation that soil tests are recommended when feasible.
3. Tailor the water management and weather precautions directly to the farmer's irrigation type (${soil.irrigationType || "Rainfed"}) and recorded weather.
4. Keep all guidance highly practical, step-by-step, and safe (emphasize bio-agents like Trichoderma/Rhizobium and Integrated Pest Management).
5. Output strict JSON with NO markdown code-block wrapping if possible, or inside \`\`\`json \`\`\` tags.

${langInstructions[lang]}`;

    const userPrompt = `Generate comprehensive crop management guidance for:
Crop: ${cropName} (${cropNameEn || cropKey})
${districtText}
${soilText}
${weatherText}

Provide guidance organized into exactly these 8 sections:
${sectionListPrompt}

Return a valid JSON object matching this schema:
{
  "sections": [
    {
      "id": "requirements",
      "title": "${sectionSpecs[0].title}",
      "content": "Detailed practical text here..."
    },
    ...
  ]
}

Ensure all 8 sections are present with clear, practical, 2 to 3 sentence explanations in the target language (${lang.toUpperCase()}).`;

    let guidanceSections: GuidanceSection[] = [];
    let source: "gemini" | "knowledge_base" = "knowledge_base";

    if (apiKey) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.ok) {
          const geminiData = await response.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            try {
              // Clean up potential markdown formatting
              const cleanJson = rawText
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/, "")
                .replace(/```$/, "")
                .trim();
              const parsed = JSON.parse(cleanJson);
              if (Array.isArray(parsed.sections) && parsed.sections.length > 0) {
                guidanceSections = parsed.sections.map((sec: any, i: number) => ({
                  id: sec.id || sectionSpecs[i]?.id || `section_${i}`,
                  title: sec.title || sectionSpecs[i]?.title || `Section ${i + 1}`,
                  content: String(sec.content || "").trim(),
                }));
                source = "gemini";
              }
            } catch (pErr) {
              console.warn("[Crop Guidance Gemini] Failed to parse JSON response:", pErr);
            }
          }
        } else {
          const errBody = await response.text();
          console.warn(`[Crop Guidance Gemini] API returned status ${response.status}:`, errBody);
        }
      } catch (geminiErr) {
        console.warn("[Crop Guidance Gemini] Fetch error:", geminiErr);
      }
    }

    // Fallback if Gemini is not available or failed
    if (guidanceSections.length === 0) {
      guidanceSections = sectionSpecs.map((s) => ({
        id: s.id,
        title: s.title,
        content: getDefaultSectionContent(cropName, cropNameEn || cropKey, s.id, lang, soil),
      }));
      source = "knowledge_base";
    }

    const fullText = guidanceSections
      .map((s) => `${s.title}: ${s.content}`)
      .join(" ");

    const result: GuidanceResponse = {
      language: lang,
      cropKey: cropKey || "crop",
      cropName,
      source,
      sections: guidanceSections,
      fullText,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Crop Guidance API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate guidance" },
      { status: 500 }
    );
  }
}

function getDefaultSectionContent(
  cropName: string,
  cropEn: string,
  sectionId: string,
  lang: "mr" | "hi" | "en",
  soil: any
): string {
  const isRainfed = soil?.irrigationType === "Rainfed";

  if (lang === "mr") {
    switch (sectionId) {
      case "requirements":
        return `${cropName} हे पीक आपल्या स्थानिक माती आणि हवामान परिस्थितीसाठी अत्यंत अनुकूल आहे. चांगल्या उत्पादनासाठी योग्य निचरा असणारी जमीन आवश्यक आहे.`;
      case "land_preparation":
        return `जमिनीची १ ते २ वेळा खोल नांगरणी करून ढेकळे फोडून घ्यावीत. पेरणीपूर्वी बियाण्यास ट्रायकोडर्मा किंवा जैविक संवर्धकाची बीजप्रक्रिया अवश्य करावी.`;
      case "irrigation":
        return isRainfed
          ? `हे कोरडवाहू पीक असल्याने पावसाच्या पाण्यावर अवलंबून आहे. पावसाचा मोठा खंड पडल्यास संरक्षक पाणी किंवा तुषार सिंचनाचा वापर करावा.`
          : `पिकाच्या संवेदनशील टप्प्यांवर (फुलोरा व दाणे भरणे) वेळेवर सिंचन द्यावे. शेतात अतिरिक्त पाणी साचू न देता पाण्याचा निचरा योग्य ठेवावा.`;
      case "fertilizer":
        return `पेरणीच्या वेळी संतुलित बेसल डोस द्यावा. पिकाच्या वाढीच्या टप्प्यावर नत्राचा दुसरा हप्ता दिल्यास पिकाची जोमदार वाढ होते. शक्य असल्यास माती परीक्षणानुसार खत व्यवस्थापन करावे.`;
      case "growth_stages":
        return `उगवण, फुटवे फुटणे, फुलोरा आणि दाणे भरणे हे पिकाचे मुख्य टप्पे आहेत. पेरणीनंतर ३० दिवसांपर्यंत शेत तणमुक्त ठेवावे.`;
      case "pest_disease":
        return `पिकावर किडीचा प्रादुर्भाव टाळण्यासाठी एकात्मिक कीड व्यवस्थापन (IPM) पद्धतींचा अवलंब करावा. निंबोळी अर्क (५%) चा प्रतिबंधात्मक फवारणीसाठी वापर करावा.`;
      case "weather_precautions":
        return `ढगाळ किंवा अतिवृष्टीच्या काळात शेतात पाण्याचा निचरा चांगला राहील याची खात्री करा. अचानक हवामान बदलावर लक्ष ठेवा.`;
      case "harvesting":
        return `पीक योग्य प्रकारे पक्व झाल्यावर आणि दाण्यातील ओलावा योग्य पातळीवर आल्यावर कापणी करावी. काढणीनंतर पीक कोरड्या जागी सुरक्षित साठवावे.`;
      default:
        return `${cropName} लागवडीसाठी कृषी विद्यापीठाच्या पॅकेज ऑफ प्रॅक्टिसेसचे पालन करावे.`;
    }
  }

  if (lang === "hi") {
    switch (sectionId) {
      case "requirements":
        return `${cropName} की फसल स्थानीय मिट्टी और जलवायु परिस्थितियों के लिए अत्यधिक उपयुक्त है। अच्छी पैदावार के लिए समुचित जल निकासी वाली उपजाऊ भूमि आवश्यक है।`;
      case "land_preparation":
        return `खेत की 1-2 बार गहरी जुताई करके पाटा लगाएं। बोने से पहले बीजों का ट्राइकोडर्मा या अनुशंसित कवकनाशी से बीज उपचार अनिवार्य रूप से करें।`;
      case "irrigation":
        return isRainfed
          ? `यह वर्षा आधारित फसल है। यदि मानसून में लंबा सूखा अंतराल आए तो जीवनरक्षक सिंचाई या फव्वारा सिंचाई का उपयोग करें।`
          : `फसल के संवेदनशील चरणों (फूल आने और दाना भरने के समय) पर समय पर सिंचाई करें। खेत में जलभराव न होने दें।`;
      case "fertilizer":
        return `बुवाई के समय संतुलित बेसल डोज दें। वानस्पतिक वृद्धि के समय नाइट्रोजन की दूसरी खुराक दें। मिट्टी परीक्षण के आधार पर पोषक तत्व प्रबंधन सर्वोत्तम है।`;
      case "growth_stages":
        return `अंकुरण, कल्ले फूटना, फूल आना और दाना भराव मुख्य चरण हैं। बुवाई के प्रारंभिक 30 दिनों तक खेत को खरपतवार मुक्त रखें।`;
      case "pest_disease":
        return `कीटों की नियमित निगरानी करें और एकीकृत कीट प्रबंधन (IPM) अपनाएं। प्रारंभिक रोकथाम के लिए नीम तेल (5%) का छिड़काव उपयोगी है।`;
      case "weather_precautions":
        return `बादल छाए रहने या अत्यधिक वर्षा की स्थिति में खेत से अतिरिक्त जल निकासी सुनिश्चित करें। मौसम पूर्वानुमान पर नजर रखें।`;
      case "harvesting":
        return `फसल के पूर्ण परिपक्व होने और उचित नमी स्तर पर कटाई करें। कटाई के बाद उपज को सुखाकर सूखे व सुरक्षित स्थान पर भंडारित करें।`;
      default:
        return `${cropName} की खेती हेतु कृषि विश्वविद्यालय द्वारा अनुशंसित पैकेज ऑफ प्रैक्टिसेज का पालन करें।`;
    }
  }

  // English
  switch (sectionId) {
    case "requirements":
      return `${cropName} is well-suited to the regional agro-climatic conditions. Well-drained soils with balanced organic matter support optimal vegetative vigor.`;
    case "land_preparation":
      return `Prepare a fine tilth with deep ploughing followed by harrowing. Perform seed treatment with certified bio-agents (e.g., Trichoderma/Rhizobium) prior to sowing.`;
    case "irrigation":
      return isRainfed
        ? `Cultivated primarily under rainfed conditions. Provide protective or micro-sprinkler irrigation if prolonged dry spells occur during critical flowering.`
        : `Irrigate at critical phenological intervals (tillering/flowering and grain filling). Avoid water stagnation to protect root rhizosphere.`;
    case "fertilizer":
      return `Apply balanced basal nitrogen, phosphorus, and potassium at sowing. Supplement top-dressed nitrogen splits during active vegetative expansion. Soil testing is strongly advised.`;
    case "growth_stages":
      return `Key developmental phases include seedling emergence, vegetative branching, flowering/anthesis, and seed maturation. Maintain weed-free conditions during the first 30 days.`;
    case "pest_disease":
      return `Implement Integrated Pest Management (IPM) protocols. Scout weekly and apply preventative botanical bio-pesticides (5% neem seed kernel extract) at initial incidence.`;
    case "weather_precautions":
      return `Maintain clear drainage channels ahead of heavy rainfall spells to avert root rot. Monitor microclimate alerts regularly.`;
    case "harvesting":
      return `Harvest at physiological maturity when pods or panicles reach recommended moisture levels. Dry produce thoroughly in shaded storage before bagging.`;
    default:
      return `Follow the standard Package of Practices prescribed by state agricultural universities for ${cropEn}.`;
  }
}
