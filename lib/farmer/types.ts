import { ShortTermForecast, HistoricalImdReading } from "@/lib/weather/types";

export type Language = "mr" | "hi" | "en";

export type FarmerProfile = {
  id?: number;
  name: string;
  phone: string;
  district: string;
  taluka: string;
  village: string;
  language: Language;
  createdAt?: string;
};

export type AssessmentStep =
  | "details"
  | "location"
  | "photos"
  | "weather"
  | "soil"
  | "crops"
  | "guidance"
  | "premium";

export type FarmLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: "gps" | "manual";
};

export type FarmPhotos = {
  farmImageUrl?: string;
  soilImageUrl?: string;
  farmImageFile?: File;
  soilImageFile?: File;
};

export type WeatherData = {
  temperatureC: number;
  humidityPct: number;
  rainfallMm: number;
  windSpeedKph: number;
  status: "live" | "error";
  source: string;
  fetchedAt: string;
  forecast?: ShortTermForecast | null;
  historical?: HistoricalImdReading | null;
};

export type SoilInputs = {
  areaAcres: number;
  irrigationType: string;
  soilType: string;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  soilPH?: number;
};

export type CropRecommendation = {
  rank: number;
  cropKey: string;
  cropEn: string;
  cropMr: string;
  cropHi: string;
  confidencePct: string;
  suitabilityScore?: number;
  suitabilityTier?: "Excellent" | "Good" | "Moderate" | "Low";
  isInsuranceEligible: boolean;
  isSoilCompatible?: boolean;
  soilCompatibilityStatus?: "Soil Compatible" | "Compatibility Not Confirmed";
  suitabilityNote: string;
  temperatureContext?: string;
  humidityContext?: string;
  rainfallContext?: string;
  soilContext?: string;
  irrigationContext?: string;
  explanationMr?: string;
  explanationHi?: string;
  explanationEn?: string;
  waterRequirement?: string;
  growthDuration?: string;
};

export type AssessmentData = {
  farmer: FarmerProfile;
  location: FarmLocation | null;
  photos: FarmPhotos;
  weather: WeatherData | null;
  soilInputs: SoilInputs;
  recommendations: CropRecommendation[];
  selectedCrop: CropRecommendation | null;
  premiumINR: number | null;
  premiumDetails: Record<string, unknown> | null;
  assessmentId?: string;
  completedAt?: string;
};

// ── Crop Translations ──────────────────────────────────────────────────────
export const CROP_TRANSLATIONS: Record<string, { mr: string; hi: string }> = {
  rice:         { mr: "भात",         hi: "चावल" },
  maize:        { mr: "मका",          hi: "मक्का" },
  chickpea:     { mr: "हरभरा",        hi: "चना" },
  cotton:       { mr: "कापूस",        hi: "कपास" },
  pigeonpeas:   { mr: "तूर",          hi: "अरहर" },
  wheat:        { mr: "गहू",          hi: "गेहूं" },
  mango:        { mr: "आंबा",         hi: "आम" },
  banana:       { mr: "केळी",         hi: "केला" },
  apple:        { mr: "सफरचंद",       hi: "सेब" },
  grapes:       { mr: "द्राक्ष",     hi: "अंगूर" },
  orange:       { mr: "संत्रा",       hi: "संतरा" },
  papaya:       { mr: "पपई",         hi: "पपीता" },
  pomegranate:  { mr: "डाळिंब",      hi: "अनार" },
  watermelon:   { mr: "टरबूज",        hi: "तरबूज" },
  muskmelon:    { mr: "खरबूज",        hi: "खरबूजा" },
  coconut:      { mr: "नारळ",         hi: "नारियल" },
  blackgram:    { mr: "उडीद",         hi: "उड़द" },
  lentil:       { mr: "मसूर",         hi: "मसूर" },
  kidneybeans:  { mr: "राजमा",        hi: "राजमा" },
  mothbeans:    { mr: "मठ",           hi: "मोठ" },
  mungbean:     { mr: "मूग",          hi: "मूंग" },
  coffee:       { mr: "कॉफी",         hi: "कॉफी" },
  jute:         { mr: "ताग",          hi: "जूट" },
  sugarcane:    { mr: "ऊस",           hi: "गन्ना" },
  groundnut:    { mr: "भुईमूग",       hi: "मूंगफली" },
  soyabean:     { mr: "सोयाबीन",      hi: "सोयाबीन" },
};

// ── Insurance-Eligible Crops ──────────────────────────────────────────────
export const INSURANCE_ELIGIBLE_CROPS = new Set([
  "rice", "maize", "chickpea", "cotton", "pigeonpeas", "wheat", "groundnut", "soyabean", "sugarcane"
]);

// ── Bilingual UI Strings ──────────────────────────────────────────────────
export type UIStrings = {
  stepDetails: string;
  stepLocation: string;
  stepPhotos: string;
  stepWeather: string;
  stepSoil: string;
  stepCrops: string;
  stepGuidance: string;
  stepPremium: string;
  continueBtn: string;
  backBtn: string;
  nameLabel: string;
  namePlaceholder: string;
  districtLabel: string;
  talukaLabel: string;
  villageLabel: string;
  locationTitle: string;
  locationInstruction: string;
  locationBtn: string;
  photosTitle: string;
  farmPhotoLabel: string;
  soilPhotoLabel: string;
  weatherTitle: string;
  cropsTitle: string;
  selectCropBtn: string;
  guidanceTitle: string;
  listenBtn: string;
  premiumTitle: string;
  premiumDisclaimer: string;
  saveAssessmentBtn: string;
  soilInputsTitle: string;
  areaLabel: string;
  irrigationLabel: string;
  soilTypeLabel: string;
};

export const STRINGS: Record<Language, UIStrings> = {
  mr: {
    stepDetails: "माहिती",
    stepLocation: "लोकेशन",
    stepPhotos: "फोटो",
    stepWeather: "हवामान माहिती",
    stepSoil: "शेत व माती",
    stepCrops: "पीक शिफारस",
    stepGuidance: "मार्गदर्शन",
    stepPremium: "विमा प्रीमियम",
    continueBtn: "पुढे जा",
    backBtn: "मागे जा",
    nameLabel: "तुमचे नाव लिहा / Enter your name",
    namePlaceholder: "उदा. रामेश्वर पाटील",
    districtLabel: "जिल्हा निवडा / Select district",
    talukaLabel: "तालुका निवडा / Select taluka",
    villageLabel: "गाव निवडा / Select village",
    locationTitle: "शेताचे लोकेशन (GPS)",
    locationInstruction: "कृपया तुमच्या शेताजवळ जा आणि अचूक शेत समन्वय मिळवण्यासाठी लोकेशन सुरू करा.",
    locationBtn: "शेत लोकेशन सुरू करा / Turn On Farm Location",
    photosTitle: "शेताचे व मातीचे फोटो",
    farmPhotoLabel: "शेताचा फोटो / Farm Landscape Photo",
    soilPhotoLabel: "मातीचा फोटो / Soil Sample Photo",
    weatherTitle: "हवामान माहिती व पर्यावरण विश्लेषण",
    cropsTitle: "पीक शिफारसी (Top 5 शिफारसी)",
    selectCropBtn: "हे पीक निवडा / Select This Crop",
    guidanceTitle: "तपशीलवार पीक व्यवस्थापन व मार्गदर्शन",
    listenBtn: "सल्ला ऐका / Listen to Advisory",
    premiumTitle: "विमा प्रीमियम अंदाज",
    premiumDisclaimer: "हा अंदाज आहे, अधिकृत विमा कोटेशन नाही.",
    saveAssessmentBtn: "मूल्यांकन जतन करा",
    soilInputsTitle: "शेत व माती माहिती",
    areaLabel: "शेत क्षेत्र (एकर / Acres)",
    irrigationLabel: "सिंचन प्रकार / Irrigation Type",
    soilTypeLabel: "माती प्रकार / Soil Type",
  },
  hi: {
    stepDetails: "जानकारी",
    stepLocation: "स्थान",
    stepPhotos: "फोटो",
    stepWeather: "मौसम जानकारी",
    stepSoil: "खेत और मिट्टी",
    stepCrops: "फसल सिफारिश",
    stepGuidance: "मार्गदर्शन",
    stepPremium: "बीमा प्रीमियम",
    continueBtn: "आगे बढ़ें",
    backBtn: "वापस जाएं",
    nameLabel: "अपना नाम लिखें / Enter your name",
    namePlaceholder: "उदा. रमेश पाटील",
    districtLabel: "जिला चुनें / Select district",
    talukaLabel: "तहसील चुनें / Select taluka",
    villageLabel: "गाँव चुनें / Select village",
    locationTitle: "खेत का स्थान (GPS)",
    locationInstruction: "कृपया अपने खेत के पास जाएं और सटीक स्थान प्राप्त करने के लिए GPS चालू करें।",
    locationBtn: "खेत स्थान चालू करें / Turn On Farm Location",
    photosTitle: "खेत और मिट्टी की फोटो",
    farmPhotoLabel: "खेत की फोटो / Farm Landscape Photo",
    soilPhotoLabel: "मिट्टी की फोटो / Soil Sample Photo",
    weatherTitle: "मौसम जानकारी और पर्यावरण विश्लेषण",
    cropsTitle: "फसल सिफारिशें (Top 5 सिफारिशें)",
    selectCropBtn: "यह फसल चुनें / Select This Crop",
    guidanceTitle: "विस्तृत फसल प्रबंधन और मार्गदर्शन",
    listenBtn: "सलाह सुनें / Listen to Advisory",
    premiumTitle: "बीमा प्रीमियम अनुमान",
    premiumDisclaimer: "यह अनुमान है, आधिकारिक बीमा उद्धरण नहीं।",
    saveAssessmentBtn: "आकलन सहेजें",
    soilInputsTitle: "खेत और मिट्टी जानकारी",
    areaLabel: "खेत क्षेत्र (एकड़ / Acres)",
    irrigationLabel: "सिंचाई प्रकार / Irrigation Type",
    soilTypeLabel: "मिट्टी प्रकार / Soil Type",
  },
  en: {
    stepDetails: "Details",
    stepLocation: "Location",
    stepPhotos: "Photos",
    stepWeather: "Weather Information",
    stepSoil: "Farm & Soil",
    stepCrops: "Crop Advice",
    stepGuidance: "Crop Guidance",
    stepPremium: "Premium Estimate",
    continueBtn: "Continue",
    backBtn: "Back",
    nameLabel: "Enter your full name",
    namePlaceholder: "e.g. Rameshwar Patil",
    districtLabel: "Select district",
    talukaLabel: "Select taluka",
    villageLabel: "Select village",
    locationTitle: "Farm GPS Location",
    locationInstruction: "Please visit or stand on your farmland and enable location to capture exact GPS coordinates.",
    locationBtn: "Turn On Farm Location",
    photosTitle: "Farm & Soil Photographs",
    farmPhotoLabel: "Farm Landscape Photo",
    soilPhotoLabel: "Soil Sample Photo",
    weatherTitle: "Weather & Environmental Intelligence",
    cropsTitle: "Top 5 Crop Recommendations",
    selectCropBtn: "Select This Crop",
    guidanceTitle: "Comprehensive Crop Guidance",
    listenBtn: "Listen to Advisory",
    premiumTitle: "Estimated Insurance Premium",
    premiumDisclaimer: "This is an estimate, not an official insurer quote.",
    saveAssessmentBtn: "Save Assessment",
    soilInputsTitle: "Farm & Soil Information",
    areaLabel: "Farm Area (Acres)",
    irrigationLabel: "Irrigation Type",
    soilTypeLabel: "Soil Type",
  },
};
