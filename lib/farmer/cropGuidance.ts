/**
 * AgriSurge Farmer Module — Crop Guidance Engine
 * Structured, professional agricultural guidance for crops.
 * All emojis have been removed in favor of consistent Lucide icons.
 */

export type GuidanceSection = {
  mr: string;
  hi: string;
  en: string;
};

export type CropGuidance = {
  whySuitable: GuidanceSection;
  waterManagement: GuidanceSection;
  fertilizerTiming: GuidanceSection;
  growthStageCare: GuidanceSection;
  weatherPrecautions: GuidanceSection;
  keyRisks: GuidanceSection;
  nextSteps: GuidanceSection;
};

export const CROP_GUIDANCE: Record<string, CropGuidance> = {
  rice: {
    whySuitable: {
      mr: "भात पिकासाठी भरपूर उष्णता व आर्द्रता आवश्यक असते. उपलब्ध हवामान डेटानुसार तापमान व पाऊस भाताच्या वाढीसाठी अनुकूल आहेत. योग्य जलव्यवस्थापनासह हे पीक चांगला उतारा देते.",
      hi: "धान की फसल के लिए पर्याप्त तापमान और नमी की आवश्यकता होती है। उपलब्ध मौसम आंकड़ों के अनुसार तापमान और वर्षा धान के विकास के अनुकूल हैं।",
      en: "Rice requires high warmth and moisture. Based on current weather data, temperature and humidity conditions are favorable for vegetative and reproductive stages.",
    },
    waterManagement: {
      mr: "लावणीनंतर पहिल्या ३ आठवड्यांत शेतात सुमारे ३ ते ५ सेमी पाणी ठेवावे. फुटवे फुटताना आणि फुलोऱ्याच्या वेळी पाण्याचा ताण पडू देऊ नये. कापणीच्या १२-१५ दिवस आधी पाणी बंद करावे.",
      hi: "रोपाई के बाद पहले 3 हफ्तों में खेत में 3-5 सेमी पानी बनाए रखें। कल्ले फूटने और फूल आने के समय पानी की कमी न होने दें। कटाई से 15 दिन पूर्व पानी रोकें।",
      en: "Maintain 3-5 cm standing water during the first 3 weeks post-transplanting. Avoid water deficit during active tillering and flowering. Cease irrigation 12-15 days prior to harvest.",
    },
    fertilizerTiming: {
      mr: "पेरणी / लावणी वेळी नत्र (नायट्रोजन) चा १/३ भाग, संपूर्ण स्फुरद (फॉस्फरस) आणि पालाश (पोटॅश) बेसल डोस म्हणून द्यावा. नत्राचा दुसरा हप्ता फुटवे फुटताना (३० दिवसांनी) आणि तिसरा हप्ता फुलोऱ्यापूर्वी द्यावा.",
      hi: "रोपाई के समय नाइट्रोजन का 1/3 भाग, संपूर्ण फास्फोरस व पोटाश बेसल डोज के रूप में दें। दूसरा भाग कल्ले फूटने पर (30 दिन) और तीसरा भाग बालियां निकलने से पूर्व दें।",
      en: "Apply 1/3rd nitrogen along with full phosphate and potash as a basal dressing at transplanting. Apply the second nitrogen split at tillering (30 days) and final split at panicle initiation.",
    },
    growthStageCare: {
      mr: "रोपवाटिका (२१ दिवस), लावणी व फुटवे (३०-४५ दिवस), फुलोरा (६०-७५ दिवस) आणि दाणे भरणे (८०-१०५ दिवस). फुलोऱ्याच्या टप्प्यात कीटकनाशकांची फवारणी सकाळी लवकर किंवा संध्याकाळी करावी.",
      hi: "नर्सरी (21 दिन), रोपाई व कल्ले (30-45 दिन), फूल व बालियां (60-75 दिन) और दाना भराव (80-105 दिन)। फूल के समय कीटनाशक छिड़काव सुबह या शाम करें।",
      en: "Key stages: Nursery (21 days), Tillering (30-45 days), Panicle emergence (60-75 days), and Grain filling (80-105 days). Avoid chemical sprays during peak morning pollination.",
    },
    weatherPrecautions: {
      mr: "अतिवृष्टी किंवा ढगाळ हवामानात पानांवरील करपा व खोडकिडा वाढण्याची शक्यता असते. शेतातून अतिरिक्त पाण्याचा तात्काळ निचरा करावा.",
      hi: "अत्यधिक वर्षा या बादलों के मौसम में झुलसा रोग और तना छेदक का प्रकोप बढ़ सकता है। खेत से अतिरिक्त पानी की तत्काल निकासी सुनिश्चित करें।",
      en: "Cloudy and waterlogged conditions elevate risk of blast disease and stem borer. Ensure active drainage channels are clear ahead of heavy rain spells.",
    },
    keyRisks: {
      mr: "पानाचा करपा (Blast), खोडकिडा आणि फुलोऱ्यातील अचानक दुष्काळ हे मुख्य जोखीम घटक आहेत. नियमित शेत पाहणी करून नियंत्रण करावे.",
      hi: "झुलसा रोग (Blast), तना छेदक और फूल के समय सूखा मुख्य जोखिम हैं। नियमित निगरानी द्वारा नियंत्रण करें।",
      en: "Blast disease, stem borer, and moisture deficit during anthesis represent the primary production risks.",
    },
    nextSteps: {
      mr: "स्थानिक कृषी संशोधन केंद्राने प्रमाणित केलेले सुधारित वाण निवडावे. बियाण्यास थायरम किंवा ट्रायकोडर्माची बीजप्रक्रिया करूनच पेरणी करावी.",
      hi: "स्थानीय कृषि अनुसंधान केंद्र द्वारा प्रमाणित बीज चुनें। बोने से पहले कवकनाशी (ट्राइकोडर्मा) से बीज उपचार अनिवार्य रूप से करें।",
      en: "Procure certified seed varieties recommended by the state agricultural university. Treat seeds with Trichoderma viride before nursery sowing.",
    },
  },
  maize: {
    whySuitable: {
      mr: "मका पीक उष्ण आणि मध्यम आर्द्रतेच्या हवामानात उत्कृष्ट वाढते. कमी पाणी उपलब्ध असतानाही हे पीक चांगला नफा मिळवून देते. काळी आणि पोयटा माती यासाठी अनुकूल आहे.",
      hi: "मक्का गर्म और मध्यम आर्द्रता वाले मौसम में तेजी से बढ़ता है। कम पानी में भी यह फसल अच्छी पैदावार देती है। काली और दोमट मिट्टी इसके लिए सर्वोत्तम है।",
      en: "Maize thrives in warm climates with moderate relative humidity. It offers high economic return and high water-use efficiency on well-drained soils.",
    },
    waterManagement: {
      mr: "मक्याला पाण्याचा चांगला निचरा होणारी जमीन हवी. गुडघाभर उंची, तुरा येणे (Tasseling) आणि दाणे भरणे (Grain Filling) हे पाण्याचे अत्यंत संवेदनशील टप्पे आहेत.",
      hi: "मक्के के लिए जल-निकासी अनिवार्य है। घुटने तक की ऊंचाई, नर मंजरी (Tasseling) और दाना भराव के समय सिंचाई बेहद महत्वपूर्ण है।",
      en: "Maize requires excellent field drainage. Critical irrigation stages are knee-high stage, tasseling, and grain filling. Avoid prolonged standing water.",
    },
    fertilizerTiming: {
      mr: "पेरणीवेळी अर्धे नत्र, संपूर्ण स्फुरद व पालाश द्यावे. उर्वरित नत्र पेरणीनंतर ३० दिवसांनी (गुडघाभर उंचीवर) मातीची भर देताना द्यावे.",
      hi: "बुवाई के समय आधा नाइट्रोजन, पूरा फास्फोरस और पोटाश दें। शेष नाइट्रोजन बुवाई के 30 दिन बाद मिट्टी चढ़ाते समय दें।",
      en: "Apply 50% nitrogen with full recommended phosphorus and potash at sowing. Top-dress the remaining 50% nitrogen at knee-high stage (30 days) along with earthing up.",
    },
    growthStageCare: {
      mr: "उगवण (५-७ दिवस), वाढीचा काळ (२०-४० दिवस), तुरा व कणसे लागणे (५०-६५ दिवस), परिपक्वता (८५-१०० दिवस). कणसे भरताना पक्षांपासून संरक्षण करावे.",
      hi: "अंकुरण (5-7 दिन), वानस्पतिक वृद्धि (20-40 दिन), मंजरी व भुट्टा (50-65 दिन), परिपक्वता (85-100 दिन)। भुट्टे भरने के समय पक्षियों से सुरक्षा करें।",
      en: "Stages: Germination (5-7 days), Vegetative (20-40 days), Tasseling & Silking (50-65 days), Maturity (85-100 days). Monitor for corn borers during silking.",
    },
    weatherPrecautions: {
      mr: "सतत ढगाळ हवामान असल्यास लष्करी अळीचा (Fall Armyworm) प्रादुर्भाव वाढू शकतो. वादळी वाऱ्यापासून पिकाचे रक्षण करण्यासाठी झाडांना मातीची भर द्यावी.",
      hi: "बादल छाए रहने पर फॉल आर्मीवर्म कीट का खतरा बढ़ जाता है। तेज हवा से बचाव के लिए पौधों की जड़ों में मिट्टी चढ़ाएं।",
      en: "Overcast weather accelerates Fall Armyworm pest activity. Earthing up prevents lodging during sudden wind gusts.",
    },
    keyRisks: {
      mr: "अमेरिकन लष्करी अळी (Fall Armyworm) आणि कणसातील दाणे भरताना पाण्याचा ताण हे सर्वात मोठे धोके आहेत.",
      hi: "फॉल आर्मीवर्म कीट और दाना भराव के समय जल संकट सबसे बड़े जोखिम हैं।",
      en: "Fall Armyworm damage and drought stress during the silking stage constitute the highest agronomic risks.",
    },
    nextSteps: {
      mr: "उत्पादक संकरित वाण (Hybrid) निवडा. फेरोमोन ट्रॅप लावून किडींचे सुरुवातीपासूनच निरीक्षण करा.",
      hi: "उच्च उपज वाली संकर किस्म चुनें। फेरोमोन ट्रैप लगाकर शुरू से ही कीटों की निगरानी करें।",
      en: "Select high-yielding certified hybrid seeds. Install pheromone traps at 5 per acre for early pest surveillance.",
    },
  },
  cotton: {
    whySuitable: {
      mr: "कापूस हे महाराष्ट्रातील प्रमुख नगदी पीक आहे. खोल काळी रेगूर माती आणि उष्ण हवामान कापूस लागवडीसाठी आदर्श मानले जाते. ठिबक सिंचनावर उत्पादन दुप्पट मिळते.",
      hi: "कपास महाराष्ट्र की प्रमुख नकदी फसल है। गहरी काली मिट्टी और गर्म मौसम कपास के लिए आदर्श है। ड्रिप सिंचाई पर पैदावार बहुत अच्छी मिलती है।",
      en: "Cotton is a premier commercial fiber crop. Deep black clay-loam soils and warm sunshine provide optimal vegetative growth and boll maturation conditions.",
    },
    waterManagement: {
      mr: "कापसाला ठिबक सिंचन अत्यंत फायदेशीर ठरते. पाते लागणे, फुले येणे आणि बोंडे भरणे या काळात पाण्याचा नियमित पुरवठा करावा. शेतात पाणी साचणार नाही याची काळजी घ्यावी.",
      hi: "कपास के लिए ड्रिप सिंचाई सर्वोत्तम है। कली बनना, फूल आना और बॉल भराव के समय नियमित नमी बनाए रखें। जलभराव से बचें।",
      en: "Drip irrigation optimizes water efficiency. Maintain consistent moisture during square formation, flowering, and boll development. Ensure zero standing water.",
    },
    fertilizerTiming: {
      mr: "पेरणीवेळी बेसल डोस द्यावा. नत्राची मात्रा ३ ते ४ हप्त्यांमध्ये (पेरणी, ३० दिवस, ६० दिवस आणि ७५ दिवस) विभागून द्यावी. पाते गळ रोखण्यासाठी बोरॉन व मॅग्नेशियम सल्फेटची फवारणी करावी.",
      hi: "बुवाई पर आधार खाद दें। नाइट्रोजन 3 से 4 बार में (बुवाई, 30, 60 और 75 दिन) दें। कली झड़ने से रोकने के लिए बोरॉन का छिड़काव करें।",
      en: "Apply basal NPK at sowing. Split nitrogen across 4 doses (sowing, 30, 60, and 75 days). Foliar spray of 1% magnesium sulphate and 0.2% boron prevents square drop.",
    },
    growthStageCare: {
      mr: "वाढ (३०-५० दिवस), पाते व फुले (५०-८० दिवस), बोंडे भरणे (८०-१२० दिवस), बोंडे फुटणे (१२०-१६० दिवस). नियमित शेंडे खुडणी करावी.",
      hi: "वृद्धि (30-50 दिन), फूल (50-80 दिन), बॉल विकास (80-120 दिन), चुनाई (120-160 दिन)। सही समय पर शाखाओं की छंटाई करें।",
      en: "Phenology: Vegetative (30-50 days), Squaring & Flowering (50-80 days), Boll development (80-120 days), Boll opening (120-160 days).",
    },
    weatherPrecautions: {
      mr: "बोंडे फुटण्याच्या काळात पाऊस पडल्यास कापसाची प्रत घसरते. पाऊस उघडल्यावर त्वरित बोंडे तोडून कोरड्या जागी साठवावीत.",
      hi: "बॉल खिलने के समय बारिश होने पर रुई की गुणवत्ता प्रभावित होती है। मौसम साफ होते ही चुनाई करें।",
      en: "Rain during boll bursting degrades lint quality. Pick open bolls promptly once field dries and store in well-ventilated sheds.",
    },
    keyRisks: {
      mr: "गुलाबी बोंडअळी (Pink Bollworm), रसशोषक किडी (मावा, तुडतुडे) आणि आकस्मिक मर रोग हे मुख्य धोके आहेत.",
      hi: "गुलाबी सुंडी (Pink Bollworm), रस चूसक कीट और पैराविल्ट मुख्य जोखिम हैं।",
      en: "Pink bollworm infestation, sucking pests (aphids, jassids), and parawilt under prolonged waterlogging pose significant threats.",
    },
    nextSteps: {
      mr: "मान्यताप्राप्त बीटी वाणांची निवड करा. एकरी ५ कामगंध सापळे (Pheromone Traps) लावून गुलाबी बोंडअळीचे निरीक्षण सुरू ठेवा.",
      hi: "प्रमाणित बीटी किस्म चुनें। प्रति एकड़ 5 फेरोमोन ट्रैप लगाकर गुलाबी सुंडी की निगरानी रखें।",
      en: "Procure government-certified Bt cotton seeds. Deploy pheromone traps at 45 days for pink bollworm flight tracking.",
    },
  },
  chickpea: {
    whySuitable: {
      mr: "हरभरा (चना) हे रब्बी हंगामातील कोरडवाहू व बागायती दोन्हीसाठी अत्यंत उपयुक्त कडधान्य आहे. थंड व कोरडे हवामान दाण्यांच्या चोख भरणीसाठी पोषक ठरते.",
      hi: "चना रबी सीजन की प्रमुख दलहनी फसल है। ठंडा और शुष्क मौसम दानों के सही भराव के लिए अत्यंत लाभकारी होता है।",
      en: "Chickpea is a resilient winter pulse crop adapted to residual soil moisture, thriving under cool nights and mild dry daytime conditions.",
    },
    waterManagement: {
      mr: "हरभऱ्याला जास्त पाण्याची गरज नसते. अतिपाण्याने मर रोग वाढतो. फुलोरा सुरू होण्यापूर्वी एक आणि घाटे भरताना दुसरे सिंचन पुरेसे असते.",
      hi: "चने को अधिक पानी की आवश्यकता नहीं होती। अधिक सिंचाई से उकठा रोग बढ़ता है। फूल आने से पहले एक और फली भराव पर दूसरी सिंचाई पर्याप्त है।",
      en: "Chickpea requires minimal irrigation. Over-irrigation provokes Fusarium wilt. One irrigation pre-flowering and one at early pod filling are optimal.",
    },
    fertilizerTiming: {
      mr: "पेरणीवेळी DAP किंवा २०:२०:०:१३ हे खत बेसल डोस म्हणून द्यावे. मुळांवर नत्रयुक्त गाठी तयार होत असल्याने उभ्या पिकात नत्र खताची आवश्यकता नसते.",
      hi: "बुवाई पर DAP या 20:20:0:13 आधार खाद के रूप में दें। जड़ों में ग्रंथियां नाइट्रोजन बनाती हैं, अतः खड़ी फसल में अतिरिक्त यूरिया न दें।",
      en: "Apply DAP or complex 20:20:0:13 at sowing. Being a nodulating legume, chickpea fixes atmospheric nitrogen and requires no top-dressed urea.",
    },
    growthStageCare: {
      mr: "उगवण (७-१० दिवस), फांद्या फुटणे (२५-३५ दिवस), फुलोरा (४५-६० दिवस), घाटे भरणे (६०-८० दिवस). वाढीच्या काळात शेंडे खुडल्यास फांद्या जास्त फुटतात.",
      hi: "अंकुरण (7-10 दिन), शाखाएं (25-35 दिन), फूल (45-60 दिन), फली (60-80 दिन)। 30 दिन पर ऊपरी सिरे तोड़ने से शाखाएं अधिक निकलती हैं।",
      en: "Phenology: Emergence (7-10 days), Branching (25-35 days), Flowering (45-60 days), Pod filling (60-80 days). Nipping terminal buds at 30 days boosts branch count.",
    },
    weatherPrecautions: {
      mr: "ढगाळ हवामान राहिल्यास घाटे अळीचा प्रादुर्भाव वाढतो. अशा वेळी त्वरित कामगंध सापळे आणि जैविक कीटकनाशकांचा वापर करावा.",
      hi: "बादल छाए रहने पर फली छेदक सुंडी का हमला बढ़ सकता है। जैविक कीटनाशक (NPV/नीम तेल) का प्रयोग करें।",
      en: "Overcast skies trigger Helicoverpa armigera pod borer outbreaks. Use neem-based formulations and pheromone traps.",
    },
    keyRisks: {
      mr: "मर रोग (Fusarium Wilt) आणि घाटे अळी (Pod Borer) हे हरभऱ्याचे प्रमुख शत्रू आहेत. पाण्याचा निचरा योग्य ठेवावा.",
      hi: "उकठा रोग (Fusarium Wilt) और फली छेदक मुख्य खतरे हैं। जलभराव से बचें।",
      en: "Fusarium wilt and pod borer are primary limiting factors. Proper crop rotation and drainage reduce incidence.",
    },
    nextSteps: {
      mr: "विजय, दिग्विजय किंवा जाकी ९२१८ यासारखे मर-रोग प्रतिकारक वाण निवडा. ट्रायकोडर्मा व रायझोबियम जीवाणू संवर्धकाची बीजप्रक्रिया करा.",
      hi: "विजय, दिग्विजय या जाकी 9218 जैसी उकठा प्रतिरोधी किस्में चुनें। राइजोबियम से बीज उपचार करें।",
      en: "Choose wilt-resistant varieties such as Vijay, Digvijay, or JAKI-9218. Inoculate seeds with Rhizobium and PSB cultures.",
    },
  },
  pigeonpeas: {
    whySuitable: {
      mr: "तूर (अरहर) हे अत्यंत काटक आणि दुष्काळ सहन करणारे कडधान्य पीक आहे. खोल मुळांमुळे जमिनीतील खालच्या थरातील ओलावा शोषून घेते. खरीप हंगामासाठी सर्वोत्तम आंतरपीक आहे.",
      hi: "अरहर सूखा सहन करने वाली अत्यंत मजबूत दलहनी फसल है। गहरी जड़ों के कारण यह नीचे की नमी सोखती है। खरीफ के लिए सर्वोत्तम फसल है।",
      en: "Pigeonpea is an exceptionally drought-tolerant deep-rooted legume, highly suited to rainfed black and red soils across Maharashtra.",
    },
    waterManagement: {
      mr: "तुरीला सुरुवातीला जास्त पाणी लागत नाही. पावसाचा खंड पडल्यास फुलोऱ्याच्या वेळी आणि शेंगा भरताना संरक्षक पाणी देणे फायदेशीर ठरते.",
      hi: "अरहर को शुरुआत में कम पानी चाहिए। बारिश में लंबा सूखा पड़ने पर फूल और फली के समय एक सिंचाई जीवनदायी सिद्ध होती है।",
      en: "Primarily rainfed. In case of extended dry spells, protective irrigation during branching and pod development significantly protects yields.",
    },
    fertilizerTiming: {
      mr: "पेरणीवेळी २५ किलो नत्र, ५० किलो स्फुरद प्रति हेक्टर बेसल डोस म्हणून द्यावे. फुलोऱ्याच्या वेळी २% डीएपी किंवा १९:१९:१९ ची फवारणी करावी.",
      hi: "बुवाई के समय 25 किग्रा नाइट्रोजन, 50 किग्रा फास्फोरस प्रति हेक्टेयर दें। फूल आने पर 2% DAP या 19:19:19 का छिड़काव करें।",
      en: "Apply 25 kg N and 50 kg P2O5 per hectare at sowing. Foliar spray of 2% DAP or 19:19:19 during flowering improves pod setting.",
    },
    growthStageCare: {
      mr: "वाढ (३०-६० दिवस), फांद्यांचा विस्तार (६०-९० दिवस), फुलोरा (१००-१२० दिवस), शेंगा भरणे (१३०-१६० दिवस). लागवड योग्य अंतरावर करावी.",
      hi: "वानस्पतिक वृद्धि (30-60 दिन), शाखा विस्तार (60-90 दिन), फूल (100-120 दिन), फली (130-160 दिन)। उचित दूरी पर बुवाई करें।",
      en: "Long duration: Vegetative (30-60 days), Branching (60-90 days), Flowering (100-120 days), Pod maturity (130-160 days).",
    },
    weatherPrecautions: {
      mr: "फुलोऱ्याच्या काळात ढगाळ वातावरण किंवा अवकाळी पाऊस झाल्यास फुले गळतात. अशा वेळी बोरॉन व प्लॅनोफिक्सची फवारणी फायदेशीर ठरते.",
      hi: "फूल के समय बादल या बेमौसम बारिश से फूल झड़ते हैं। बोरॉन और ग्रोथ प्रमोटर का छिड़काव करें।",
      en: "Cloudiness during anthesis causes heavy flower drop. Apply micronutrient foliar sprays to enhance retention.",
    },
    keyRisks: {
      mr: "शेंगा पोखरणारी अळी, पिसारी पतंग आणि वांझ रोग (Sterility Mosaic). रोगमुक्त बियाणे वापरणे आवश्यक आहे.",
      hi: "फली छेदक कीट, प्लूम मोथ और बांझपन रोग (Sterility Mosaic) मुख्य खतरे हैं।",
      en: "Pod borer complex, pod fly, and sterility mosaic virus transmit significant yield volatility.",
    },
    nextSteps: {
      mr: "बीडीएन-७११, गोदावरी किंवा मारुती वाण निवडा. सोयाबीन किंवा कापसामध्ये आंतरपीक (Intercrop) म्हणून लागवड करा.",
      hi: "BDN-711 या गोदावरी किस्म चुनें। सोयाबीन या कपास के साथ अंतरवर्तीय फसल के रूप में लगाएं।",
      en: "Select BDN-711, BSMR-736, or Godavari varieties. Plant as an intercrop with soybean (1:2 or 1:4 ratio) for balanced risk coverage.",
    },
  },
  wheat: {
    whySuitable: {
      mr: "गहू हे रब्बी हंगामातील प्रमुख अन्नधान्य पीक आहे. थंड हवामान आणि सिंचनाची सोय असणाऱ्या शेतांमध्ये उत्कृष्ट उत्पादन मिळते.",
      hi: "गेहूं रबी सीजन का प्रमुख अनाज है। ठंडा मौसम और सुनिश्चित सिंचाई उपलब्ध होने पर उत्तम पैदावार मिलती है।",
      en: "Wheat is the staple winter cereal requiring sustained cool temperatures during vegetative and early reproductive stages.",
    },
    waterManagement: {
      mr: "गव्हाला मुकुट मुळे फुटणे (CRI टप्पा - २१ दिवस), फुटवे फुटणे (४० दिवस), कांडी भरणे (६० दिवस), फुलोरा (८० दिवस) आणि दाणे भरणे (९५ दिवस) या ५ ते ६ पाळ्यांची आवश्यकता असते.",
      hi: "गेहूं को क्राउन रूट (21 दिन), कल्ले (40 दिन), गांठ बनना (60 दिन), फूल (80 दिन) और दाना भराव (95 दिन) पर 5-6 सिंचाइयों की आवश्यकता होती है।",
      en: "Irrigate at 5 critical stages: Crown Root Initiation (21 days), Tillering (40-45 days), Jointing (60-65 days), Flowering (80-85 days), and Milking (95-100 days).",
    },
    fertilizerTiming: {
      mr: "पेरणीवेळी अर्धे नत्र, संपूर्ण स्फुरद व पालाश द्यावे. उर्वरित नत्र पेरणीनंतर २१ दिवसांनी पहिल्या पाण्याच्या वेळी द्यावे.",
      hi: "बुवाई पर आधा नाइट्रोजन, संपूर्ण फास्फोरस व पोटाश दें। शेष आधा नाइट्रोजन पहली सिंचाई (21 दिन) पर दें।",
      en: "Apply half nitrogen with full phosphorus and potash at sowing. Top-dress remaining nitrogen at first irrigation (21 days).",
    },
    growthStageCare: {
      mr: "मुकुट मुळे (२१ दिवस), फुटवे (३०-४५ दिवस), लोंबी बाहेर पडणे (७०-८० दिवस), परिपक्वता (१००-१२० दिवस). दाणे भरताना तापमानात अचानक वाढ होऊ देऊ नये.",
      hi: "क्राउन रूट (21 दिन), कल्ले (30-45 दिन), बालियां निकलना (70-80 दिन), परिपक्वता (100-120 दिन)।",
      en: "Monitor during terminal grain-filling stage; high ambient heat causes premature shriveling.",
    },
    weatherPrecautions: {
      mr: "फेब्रुवारी-मार्चमध्ये अचानक तापमान वाढल्यास दाणे बारीक राहतात (Terminal Heat). अशा वेळी हलके सिंचन करावे.",
      hi: "फरवरी-मार्च में अचानक तापमान बढ़ने से दाना सिकुड़ सकता है। समय पर हल्की सिंचाई करें।",
      en: "Terminal heat in late February causes forced maturity. A light evening irrigation buffers rootzone temperatures.",
    },
    keyRisks: {
      mr: "तांबेरा रोग (Rust), मावा आणि उशिरा पेरणीमुळे उत्पादनात होणारी घट हे मुख्य जोखीम घटक आहेत.",
      hi: "गेरुआ रोग (Rust), माहू और देर से बुवाई मुख्य खतरे हैं।",
      en: "Rust infections and heat stress from late sowing represent principal vulnerabilities.",
    },
    nextSteps: {
      mr: "नेत्रावती, समाधान किंवा त्र्यंबक हे स्थानिक अनुकूल वाण निवडा. नोव्हेंबरच्या पहिल्या पंधरवड्यात पेरणी पूर्ण करा.",
      hi: "समाधान या त्र्यंबक जैसी किस्में चुनें। 15 नवंबर तक बुवाई पूरी करें।",
      en: "Select heat-tolerant varieties like Netravati, Samadhan, or HD-2967. Complete sowing by mid-November.",
    },
  },
  soyabean: {
    whySuitable: {
      mr: "सोयाबीन हे खरीप हंगामातील जलद येणारे (९०-१०० दिवस) नगदी तेलबिया पीक आहे. काळ्या व मध्यम जमिनीत उत्तम पोषण मूल्ये पुरवते.",
      hi: "सोयाबीन खरीफ सीजन की 90-100 दिन में पकने वाली नकदी तिलहनी फसल है। मध्यम से भारी काली मिट्टी में अच्छी उपज देती है।",
      en: "Soybean is a vital short-duration oilseed and protein cash crop highly adapted to Maharashtra's monsoon belt.",
    },
    waterManagement: {
      mr: "सोयाबीनला सुरुवातीला जास्त पाणी नको. फुलोऱ्याच्या आणि शेंगा भरण्याच्या काळात पावसाचा खंड पडल्यास तुषार सिंचनाने पाणी द्यावे.",
      hi: "शुरुआत में कम पानी चाहिए। फूल और फली बनने के समय सूखा पड़ने पर फव्वारा सिंचाई से पानी दें।",
      en: "Avoid water stagnation during emergence. Provide sprinkler irrigation if dry spells hit during flowering or pod filling.",
    },
    fertilizerTiming: {
      mr: "पेरणीवेळी ३० किलो नत्र, ६० किलो स्फुरद, ३० किलो पालाश आणि २० किलो गंधक (सल्फर) बेसल डोस म्हणून द्यावे.",
      hi: "बुवाई पर 30 किग्रा नाइट्रोजन, 60 किग्रा फास्फोरस, 30 किग्रा पोटाश और 20 किग्रा सल्फर दें।",
      en: "Apply 30 kg N, 60 kg P2O5, 30 kg K2O, and 20 kg Sulphur per hectare as a basal application.",
    },
    growthStageCare: {
      mr: "उगवण (४-६ दिवस), वाढ (१५-३५ दिवस), फुलोरा (४०-५५ दिवस), शेंगा भरणे (६०-८० दिवस), परिपक्वता (९०-१०० दिवस).",
      hi: "अंकुरण (4-6 दिन), वानस्पतिक (15-35 दिन), फूल (40-55 दिन), फली भराव (60-80 दिन), परिपक्वता (90-100 दिन)।",
      en: "Key phases: Vegetative (15-35 days), Flowering (40-55 days), Pod fill (60-80 days), Maturity (90-100 days).",
    },
    weatherPrecautions: {
      mr: "काढणीच्या वेळी पाऊस झाल्यास बियाण्याची उगवण क्षमता घटते. शेंगा पिवळ्या-तपकिरी होताच त्वरित काढणी करावी.",
      hi: "कटाई के समय वर्षा से बीज की अंकुरण क्षमता घटती है। फलियां सूखते ही तुरंत कटाई करें।",
      en: "Heavy rain at maturity impairs seed vigor. Harvest promptly when 95% of pods turn golden-brown.",
    },
    keyRisks: {
      mr: "खोडकिडा (Stem Fly), पाने खाणारी अळी (Spodoptera) आणि अतिवृष्टीमुळे पाणी साचणे.",
      hi: "तना मक्खी (Stem Fly), पत्ती खाने वाली इल्ली और जलभराव मुख्य जोखिम हैं।",
      en: "Stem fly in seedling stage and Spodoptera leaf-eating caterpillar are chief pest threats.",
    },
    nextSteps: {
      mr: "फुले संगम (KDS-726), जेएस-३३५ किंवा जेएस-९३०५ वाण निवडा. रायझोबियम व पीएसबी जीवाणू संवर्धकाची प्रक्रिया करा.",
      hi: "फुले संगम (KDS-726) या JS-335 चुनें। राइजोबियम से बीज उपचार अवश्य करें।",
      en: "Procure Phule Sangam (KDS-726) or JS-335 certified seeds. Seed treatment with Rhizobium is mandatory.",
    },
  },
};

export function getFallbackGuidance(cropEn: string, lang: "mr" | "hi" | "en"): string {
  const texts = {
    mr: `${cropEn} या पिकाच्या वैज्ञानिक लागवडीसाठी शेतातील हवामान परिस्थिती (तापमान, आर्द्रता आणि पाऊस) अनुकूल आहे. योग्य सिंचन आणि प्रमाणित बियाण्यांचा वापर करून दर्जेदार उत्पादन घेता येते. अधिक सखोल माहितीसाठी स्थानिक कृषी विज्ञान केंद्र (KVK) शी संपर्क साधावा.`,
    hi: `${cropEn} की वैज्ञानिक खेती के लिए वर्तमान पर्यावरणीय परिस्थितियां (तापमान, आर्द्रता व वर्षा) अनुकूल हैं। उचित जल प्रबंधन और प्रमाणित बीजों के प्रयोग से अच्छी पैदावार प्राप्त की जा सकती है। अधिक जानकारी के लिए स्थानीय कृषि विज्ञान केंद्र से संपर्क करें।`,
    en: `Environmental conditions (temperature, humidity, and rainfall) are favorable for sustainable cultivation of ${cropEn}. Following balanced nutrient scheduling and certified seed norms will maximize farm productivity. Consult your local Krishi Vigyan Kendra (KVK) for localized package of practices.`,
  };
  return texts[lang];
}
