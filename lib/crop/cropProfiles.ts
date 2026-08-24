/**
 * AgriSurge Crop Profile Engine
 *
 * Defines agronomic preference ranges for each crop in the Crop Recommendation model.
 * These ranges are provisional and structured to be replaced with validated agronomic datasets.
 *
 * Feature ranges are matched to the training distribution of Crop_recommendation.csv:
 * N: 0–140, P: 5–145, K: 5–205, Temp: 8.8–43.7°C, Humidity: 14.3–100%, pH: 3.5–9.9, Rainfall: 20–298.6mm
 */

export type SuitabilityLevel = "optimal" | "moderate" | "caution" | "risk";
export type SuitabilityTier = "Excellent" | "Good" | "Moderate" | "High Risk";

export interface RangeSpec {
  /** Hard minimum — anything below is "risk" */
  min: number;
  /** Optimal lower bound */
  optLow: number;
  /** Optimal upper bound */
  optHigh: number;
  /** Hard maximum — anything above is "risk" */
  max: number;
  /** Unit label for display */
  unit: string;
}

export interface CropProfile {
  /** Display name (capitalized) */
  name: string;
  /** Raw key matching ML model class */
  key: string;
  /** AgriSurge crop category for auto-populating the form */
  category: string;
  /** One-line description shown in UI */
  description: string;
  /** Agronomic emoji icon */
  emoji: string;
  /** Preferred soil types */
  suitableSoils: string[];
  /** Preferred irrigation methods */
  suitableIrrigation: string[];
  /** Agronomic ranges for all 7 sensor parameters */
  ranges: {
    temperature: RangeSpec;
    humidity: RangeSpec;
    rainfall: RangeSpec;
    ph: RangeSpec;
    nitrogen: RangeSpec;
    phosphorus: RangeSpec;
    potassium: RangeSpec;
  };
  /** Growth-stage sensitivity notes (informational) */
  stageSensitivity?: Partial<Record<string, string>>;
}

const CROP_PROFILES: CropProfile[] = [
  {
    name: "Rice",
    key: "rice",
    category: "Cereals",
    description: "Paddy crop requiring high moisture and warm temperatures.",
    emoji: "🌾",
    suitableSoils: ["Clay", "Loamy", "Alluvial"],
    suitableIrrigation: ["Canal", "Drip", "Sprinkler", "Borewell"],
    ranges: {
      temperature: { min: 20, optLow: 23, optHigh: 32, max: 38, unit: "°C" },
      humidity:    { min: 60, optLow: 70, optHigh: 90, max: 100, unit: "%" },
      rainfall:    { min: 100, optLow: 150, optHigh: 250, max: 300, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 40, optLow: 60, optHigh: 100, max: 130, unit: "mg/kg" },
      phosphorus:  { min: 20, optLow: 30, optHigh: 60, max: 90, unit: "mg/kg" },
      potassium:   { min: 20, optLow: 30, optHigh: 50, max: 80, unit: "mg/kg" },
    },
    stageSensitivity: {
      Flowering: "Highly sensitive to water stress and temperature extremes during flowering.",
      Maturity: "Requires dry conditions at maturity for grain quality.",
    },
  },
  {
    name: "Maize",
    key: "maize",
    category: "Cereals",
    description: "Versatile cereal with moderate water needs and warm growing conditions.",
    emoji: "🌽",
    suitableSoils: ["Loamy", "Sandy Loam", "Alluvial", "Red Soil"],
    suitableIrrigation: ["Rainfed", "Drip", "Sprinkler", "Canal"],
    ranges: {
      temperature: { min: 15, optLow: 20, optHigh: 30, max: 38, unit: "°C" },
      humidity:    { min: 50, optLow: 60, optHigh: 80, max: 90, unit: "%" },
      rainfall:    { min: 50, optLow: 80, optHigh: 180, max: 250, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 50, optLow: 70, optHigh: 110, max: 140, unit: "mg/kg" },
      phosphorus:  { min: 30, optLow: 40, optHigh: 70, max: 100, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 20, optHigh: 50, max: 80, unit: "mg/kg" },
    },
  },
  {
    name: "Wheat",
    key: "wheat",
    category: "Cereals",
    description: "Cool-season cereal crop sensitive to heat during grain filling.",
    emoji: "🌾",
    suitableSoils: ["Loamy", "Clay", "Alluvial", "Black Soil"],
    suitableIrrigation: ["Canal", "Sprinkler", "Drip", "Borewell"],
    ranges: {
      temperature: { min: 8, optLow: 12, optHigh: 22, max: 30, unit: "°C" },
      humidity:    { min: 30, optLow: 40, optHigh: 65, max: 80, unit: "%" },
      rainfall:    { min: 30, optLow: 50, optHigh: 120, max: 180, unit: "mm" },
      ph:          { min: 6.0, optLow: 6.5, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 60, optLow: 80, optHigh: 120, max: 140, unit: "mg/kg" },
      phosphorus:  { min: 30, optLow: 50, optHigh: 80, max: 120, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 25, optHigh: 60, max: 100, unit: "mg/kg" },
    },
  },
  {
    name: "Chickpea",
    key: "chickpea",
    category: "Pulses",
    description: "Drought-tolerant pulse crop preferring cool, dry conditions.",
    emoji: "🫘",
    suitableSoils: ["Sandy Loam", "Loamy", "Black Soil", "Red Soil"],
    suitableIrrigation: ["Rainfed", "Drip"],
    ranges: {
      temperature: { min: 15, optLow: 18, optHigh: 26, max: 33, unit: "°C" },
      humidity:    { min: 20, optLow: 30, optHigh: 55, max: 70, unit: "%" },
      rainfall:    { min: 30, optLow: 45, optHigh: 110, max: 160, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.5, max: 8.5, unit: "" },
      nitrogen:    { min: 20, optLow: 35, optHigh: 70, max: 100, unit: "mg/kg" },
      phosphorus:  { min: 40, optLow: 55, optHigh: 90, max: 120, unit: "mg/kg" },
      potassium:   { min: 40, optLow: 55, optHigh: 90, max: 120, unit: "mg/kg" },
    },
  },
  {
    name: "Kidneybeans",
    key: "kidneybeans",
    category: "Pulses",
    description: "Common bean requiring moderate temperatures and well-drained soils.",
    emoji: "🫘",
    suitableSoils: ["Loamy", "Sandy Loam", "Alluvial"],
    suitableIrrigation: ["Rainfed", "Drip", "Sprinkler"],
    ranges: {
      temperature: { min: 15, optLow: 18, optHigh: 27, max: 34, unit: "°C" },
      humidity:    { min: 40, optLow: 50, optHigh: 72, max: 85, unit: "%" },
      rainfall:    { min: 50, optLow: 80, optHigh: 160, max: 220, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
      phosphorus:  { min: 50, optLow: 65, optHigh: 100, max: 140, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 25, optHigh: 50, max: 80, unit: "mg/kg" },
    },
  },
  {
    name: "Pigeonpeas",
    key: "pigeonpeas",
    category: "Pulses",
    description: "Drought-hardy legume suited to semi-arid tropical climates.",
    emoji: "🫘",
    suitableSoils: ["Sandy Loam", "Loamy", "Red Soil", "Black Soil"],
    suitableIrrigation: ["Rainfed", "Drip"],
    ranges: {
      temperature: { min: 20, optLow: 25, optHigh: 35, max: 40, unit: "°C" },
      humidity:    { min: 40, optLow: 50, optHigh: 75, max: 85, unit: "%" },
      rainfall:    { min: 50, optLow: 80, optHigh: 180, max: 250, unit: "mm" },
      ph:          { min: 5.0, optLow: 5.5, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 15, optLow: 30, optHigh: 70, max: 100, unit: "mg/kg" },
      phosphorus:  { min: 40, optLow: 60, optHigh: 100, max: 130, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
    },
  },
  {
    name: "Mothbeans",
    key: "mothbeans",
    category: "Pulses",
    description: "Heat-tolerant, drought-resistant legume for arid zones.",
    emoji: "🫘",
    suitableSoils: ["Sandy", "Sandy Loam", "Red Soil"],
    suitableIrrigation: ["Rainfed"],
    ranges: {
      temperature: { min: 25, optLow: 28, optHigh: 38, max: 43, unit: "°C" },
      humidity:    { min: 20, optLow: 30, optHigh: 55, max: 70, unit: "%" },
      rainfall:    { min: 25, optLow: 40, optHigh: 100, max: 140, unit: "mm" },
      ph:          { min: 6.0, optLow: 6.5, optHigh: 7.8, max: 8.5, unit: "" },
      nitrogen:    { min: 15, optLow: 25, optHigh: 60, max: 90, unit: "mg/kg" },
      phosphorus:  { min: 35, optLow: 50, optHigh: 85, max: 110, unit: "mg/kg" },
      potassium:   { min: 25, optLow: 35, optHigh: 65, max: 90, unit: "mg/kg" },
    },
  },
  {
    name: "Mungbean",
    key: "mungbean",
    category: "Pulses",
    description: "Fast-maturing summer pulse tolerating moderate drought.",
    emoji: "🫘",
    suitableSoils: ["Sandy Loam", "Loamy", "Alluvial"],
    suitableIrrigation: ["Rainfed", "Drip"],
    ranges: {
      temperature: { min: 22, optLow: 26, optHigh: 34, max: 40, unit: "°C" },
      humidity:    { min: 40, optLow: 55, optHigh: 78, max: 90, unit: "%" },
      rainfall:    { min: 40, optLow: 70, optHigh: 150, max: 200, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 15, optLow: 25, optHigh: 60, max: 90, unit: "mg/kg" },
      phosphorus:  { min: 35, optLow: 50, optHigh: 85, max: 120, unit: "mg/kg" },
      potassium:   { min: 20, optLow: 30, optHigh: 60, max: 90, unit: "mg/kg" },
    },
  },
  {
    name: "Blackgram",
    key: "blackgram",
    category: "Pulses",
    description: "Short-duration pulse with moderate water needs.",
    emoji: "🫘",
    suitableSoils: ["Loamy", "Clay", "Alluvial", "Red Soil"],
    suitableIrrigation: ["Rainfed", "Drip"],
    ranges: {
      temperature: { min: 22, optLow: 25, optHigh: 35, max: 40, unit: "°C" },
      humidity:    { min: 50, optLow: 60, optHigh: 80, max: 90, unit: "%" },
      rainfall:    { min: 60, optLow: 100, optHigh: 200, max: 250, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 20, optLow: 35, optHigh: 70, max: 100, unit: "mg/kg" },
      phosphorus:  { min: 40, optLow: 55, optHigh: 90, max: 120, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
    },
  },
  {
    name: "Lentil",
    key: "lentil",
    category: "Pulses",
    description: "Cool-season legume thriving in well-drained, low-rainfall conditions.",
    emoji: "🫘",
    suitableSoils: ["Loamy", "Sandy Loam", "Alluvial"],
    suitableIrrigation: ["Rainfed", "Drip"],
    ranges: {
      temperature: { min: 8, optLow: 12, optHigh: 22, max: 30, unit: "°C" },
      humidity:    { min: 25, optLow: 35, optHigh: 60, max: 75, unit: "%" },
      rainfall:    { min: 25, optLow: 40, optHigh: 100, max: 150, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
      phosphorus:  { min: 35, optLow: 50, optHigh: 85, max: 120, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
    },
  },
  {
    name: "Cotton",
    key: "cotton",
    category: "Commercial Crops",
    description: "Long-season fibre crop requiring warm temperatures and controlled irrigation.",
    emoji: "🌿",
    suitableSoils: ["Black Soil", "Loamy", "Sandy Loam"],
    suitableIrrigation: ["Drip", "Canal", "Borewell"],
    ranges: {
      temperature: { min: 22, optLow: 26, optHigh: 34, max: 40, unit: "°C" },
      humidity:    { min: 40, optLow: 50, optHigh: 70, max: 80, unit: "%" },
      rainfall:    { min: 50, optLow: 80, optHigh: 180, max: 250, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 50, optLow: 70, optHigh: 110, max: 140, unit: "mg/kg" },
      phosphorus:  { min: 25, optLow: 40, optHigh: 75, max: 110, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
    },
  },
  {
    name: "Jute",
    key: "jute",
    category: "Commercial Crops",
    description: "Fibre crop requiring warm, humid conditions and high rainfall.",
    emoji: "🌿",
    suitableSoils: ["Alluvial", "Loamy", "Clay"],
    suitableIrrigation: ["Canal", "Rainfed"],
    ranges: {
      temperature: { min: 22, optLow: 24, optHigh: 35, max: 40, unit: "°C" },
      humidity:    { min: 70, optLow: 75, optHigh: 92, max: 100, unit: "%" },
      rainfall:    { min: 150, optLow: 180, optHigh: 260, max: 300, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 60, optLow: 75, optHigh: 115, max: 140, unit: "mg/kg" },
      phosphorus:  { min: 25, optLow: 40, optHigh: 70, max: 100, unit: "mg/kg" },
      potassium:   { min: 30, optLow: 40, optHigh: 65, max: 90, unit: "mg/kg" },
    },
  },
  {
    name: "Sugarcane",
    key: "sugarcane",
    category: "Commercial Crops",
    description: "Annual high-biomass crop requiring high water inputs and tropical warmth.",
    emoji: "🎋",
    suitableSoils: ["Loamy", "Clay", "Alluvial", "Black Soil"],
    suitableIrrigation: ["Canal", "Drip", "Sprinkler", "Borewell"],
    ranges: {
      temperature: { min: 20, optLow: 24, optHigh: 35, max: 40, unit: "°C" },
      humidity:    { min: 60, optLow: 70, optHigh: 90, max: 100, unit: "%" },
      rainfall:    { min: 100, optLow: 150, optHigh: 250, max: 300, unit: "mm" },
      ph:          { min: 6.0, optLow: 6.5, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 50, optLow: 70, optHigh: 115, max: 140, unit: "mg/kg" },
      phosphorus:  { min: 20, optLow: 35, optHigh: 70, max: 100, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
    },
  },
  {
    name: "Groundnut",
    key: "groundnut",
    category: "Oilseeds",
    description: "Warm-season legume-oilseed requiring well-drained soils.",
    emoji: "🥜",
    suitableSoils: ["Sandy Loam", "Sandy", "Red Soil", "Loamy"],
    suitableIrrigation: ["Rainfed", "Drip", "Sprinkler"],
    ranges: {
      temperature: { min: 22, optLow: 25, optHigh: 33, max: 40, unit: "°C" },
      humidity:    { min: 40, optLow: 55, optHigh: 75, max: 85, unit: "%" },
      rainfall:    { min: 50, optLow: 80, optHigh: 150, max: 200, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 15, optLow: 25, optHigh: 60, max: 85, unit: "mg/kg" },
      phosphorus:  { min: 30, optLow: 45, optHigh: 80, max: 110, unit: "mg/kg" },
      potassium:   { min: 20, optLow: 30, optHigh: 60, max: 90, unit: "mg/kg" },
    },
  },
  {
    name: "Soyabean",
    key: "soyabean",
    category: "Oilseeds",
    description: "High-protein legume-oilseed crop with moderate climatic requirements.",
    emoji: "🫘",
    suitableSoils: ["Loamy", "Sandy Loam", "Clay", "Alluvial"],
    suitableIrrigation: ["Rainfed", "Drip", "Sprinkler"],
    ranges: {
      temperature: { min: 18, optLow: 22, optHigh: 30, max: 36, unit: "°C" },
      humidity:    { min: 50, optLow: 60, optHigh: 80, max: 90, unit: "%" },
      rainfall:    { min: 60, optLow: 90, optHigh: 180, max: 250, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 20, optLow: 35, optHigh: 70, max: 100, unit: "mg/kg" },
      phosphorus:  { min: 40, optLow: 55, optHigh: 90, max: 120, unit: "mg/kg" },
      potassium:   { min: 20, optLow: 30, optHigh: 60, max: 90, unit: "mg/kg" },
    },
  },
  {
    name: "Apple",
    key: "apple",
    category: "Fruits",
    description: "Temperate fruit tree requiring chilling hours and cool summers.",
    emoji: "🍎",
    suitableSoils: ["Loamy", "Sandy Loam"],
    suitableIrrigation: ["Drip", "Sprinkler"],
    ranges: {
      temperature: { min: 8, optLow: 12, optHigh: 20, max: 28, unit: "°C" },
      humidity:    { min: 40, optLow: 50, optHigh: 70, max: 80, unit: "%" },
      rainfall:    { min: 80, optLow: 110, optHigh: 180, max: 240, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 20, optLow: 30, optHigh: 65, max: 90, unit: "mg/kg" },
      phosphorus:  { min: 20, optLow: 30, optHigh: 65, max: 90, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 30, optHigh: 60, max: 90, unit: "mg/kg" },
    },
  },
  {
    name: "Banana",
    key: "banana",
    category: "Fruits",
    description: "Tropical fruit crop requiring warm, humid conditions and fertile soils.",
    emoji: "🍌",
    suitableSoils: ["Loamy", "Sandy Loam", "Alluvial"],
    suitableIrrigation: ["Drip", "Canal", "Borewell"],
    ranges: {
      temperature: { min: 22, optLow: 26, optHigh: 34, max: 40, unit: "°C" },
      humidity:    { min: 70, optLow: 77, optHigh: 92, max: 100, unit: "%" },
      rainfall:    { min: 100, optLow: 140, optHigh: 230, max: 300, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 60, optLow: 80, optHigh: 120, max: 140, unit: "mg/kg" },
      phosphorus:  { min: 50, optLow: 65, optHigh: 100, max: 130, unit: "mg/kg" },
      potassium:   { min: 40, optLow: 55, optHigh: 90, max: 115, unit: "mg/kg" },
    },
  },
  {
    name: "Mango",
    key: "mango",
    category: "Fruits",
    description: "Tropical stone fruit with low water needs outside fruiting season.",
    emoji: "🥭",
    suitableSoils: ["Loamy", "Sandy Loam", "Red Soil", "Alluvial"],
    suitableIrrigation: ["Drip", "Rainfed"],
    ranges: {
      temperature: { min: 22, optLow: 24, optHigh: 34, max: 42, unit: "°C" },
      humidity:    { min: 40, optLow: 55, optHigh: 75, max: 85, unit: "%" },
      rainfall:    { min: 40, optLow: 75, optHigh: 160, max: 230, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 15, optLow: 30, optHigh: 65, max: 90, unit: "mg/kg" },
      phosphorus:  { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
      potassium:   { min: 20, optLow: 30, optHigh: 60, max: 85, unit: "mg/kg" },
    },
  },
  {
    name: "Grapes",
    key: "grapes",
    category: "Fruits",
    description: "Vine fruit needing warm, dry summers with controlled irrigation.",
    emoji: "🍇",
    suitableSoils: ["Sandy Loam", "Loamy", "Red Soil"],
    suitableIrrigation: ["Drip"],
    ranges: {
      temperature: { min: 15, optLow: 20, optHigh: 30, max: 38, unit: "°C" },
      humidity:    { min: 40, optLow: 50, optHigh: 70, max: 80, unit: "%" },
      rainfall:    { min: 40, optLow: 60, optHigh: 140, max: 200, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 15, optLow: 25, optHigh: 60, max: 85, unit: "mg/kg" },
      phosphorus:  { min: 20, optLow: 35, optHigh: 70, max: 100, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
    },
  },
  {
    name: "Pomegranate",
    key: "pomegranate",
    category: "Fruits",
    description: "Hardy fruit shrub tolerating drought and wide pH ranges.",
    emoji: "🍎",
    suitableSoils: ["Sandy Loam", "Loamy", "Red Soil", "Black Soil"],
    suitableIrrigation: ["Drip", "Rainfed"],
    ranges: {
      temperature: { min: 20, optLow: 24, optHigh: 35, max: 42, unit: "°C" },
      humidity:    { min: 30, optLow: 45, optHigh: 70, max: 80, unit: "%" },
      rainfall:    { min: 30, optLow: 55, optHigh: 130, max: 200, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.5, optHigh: 8.0, max: 9.0, unit: "" },
      nitrogen:    { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
      phosphorus:  { min: 20, optLow: 30, optHigh: 60, max: 90, unit: "mg/kg" },
      potassium:   { min: 20, optLow: 30, optHigh: 60, max: 90, unit: "mg/kg" },
    },
  },
  {
    name: "Orange",
    key: "orange",
    category: "Fruits",
    description: "Citrus fruit requiring subtropical climate and well-drained soils.",
    emoji: "🍊",
    suitableSoils: ["Sandy Loam", "Loamy", "Alluvial"],
    suitableIrrigation: ["Drip", "Sprinkler"],
    ranges: {
      temperature: { min: 15, optLow: 20, optHigh: 30, max: 38, unit: "°C" },
      humidity:    { min: 50, optLow: 60, optHigh: 78, max: 88, unit: "%" },
      rainfall:    { min: 60, optLow: 100, optHigh: 190, max: 250, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 15, optLow: 25, optHigh: 60, max: 90, unit: "mg/kg" },
      phosphorus:  { min: 20, optLow: 30, optHigh: 65, max: 95, unit: "mg/kg" },
      potassium:   { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
    },
  },
  {
    name: "Papaya",
    key: "papaya",
    category: "Fruits",
    description: "Fast-growing tropical fruit requiring warm, frost-free conditions.",
    emoji: "🍈",
    suitableSoils: ["Sandy Loam", "Loamy", "Alluvial"],
    suitableIrrigation: ["Drip", "Canal"],
    ranges: {
      temperature: { min: 22, optLow: 25, optHigh: 35, max: 40, unit: "°C" },
      humidity:    { min: 60, optLow: 70, optHigh: 88, max: 100, unit: "%" },
      rainfall:    { min: 80, optLow: 110, optHigh: 200, max: 270, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 30, optLow: 45, optHigh: 80, max: 115, unit: "mg/kg" },
      phosphorus:  { min: 40, optLow: 55, optHigh: 90, max: 130, unit: "mg/kg" },
      potassium:   { min: 35, optLow: 48, optHigh: 80, max: 110, unit: "mg/kg" },
    },
  },
  {
    name: "Coconut",
    key: "coconut",
    category: "Fruits",
    description: "Coastal palm requiring high humidity, warm temperatures, and good drainage.",
    emoji: "🥥",
    suitableSoils: ["Sandy Loam", "Sandy", "Loamy"],
    suitableIrrigation: ["Drip", "Canal"],
    ranges: {
      temperature: { min: 22, optLow: 26, optHigh: 35, max: 40, unit: "°C" },
      humidity:    { min: 70, optLow: 78, optHigh: 95, max: 100, unit: "%" },
      rainfall:    { min: 130, optLow: 160, optHigh: 260, max: 300, unit: "mm" },
      ph:          { min: 5.0, optLow: 5.5, optHigh: 8.0, max: 8.5, unit: "" },
      nitrogen:    { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
      phosphorus:  { min: 15, optLow: 25, optHigh: 55, max: 80, unit: "mg/kg" },
      potassium:   { min: 30, optLow: 45, optHigh: 80, max: 110, unit: "mg/kg" },
    },
  },
  {
    name: "Muskmelon",
    key: "muskmelon",
    category: "Fruits",
    description: "Warm-season cucurbit crop requiring dry, sunny conditions during fruiting.",
    emoji: "🍈",
    suitableSoils: ["Sandy Loam", "Sandy", "Loamy"],
    suitableIrrigation: ["Drip"],
    ranges: {
      temperature: { min: 22, optLow: 26, optHigh: 34, max: 40, unit: "°C" },
      humidity:    { min: 35, optLow: 50, optHigh: 70, max: 80, unit: "%" },
      rainfall:    { min: 30, optLow: 50, optHigh: 120, max: 170, unit: "mm" },
      ph:          { min: 6.0, optLow: 6.5, optHigh: 7.5, max: 8.0, unit: "" },
      nitrogen:    { min: 40, optLow: 55, optHigh: 90, max: 120, unit: "mg/kg" },
      phosphorus:  { min: 40, optLow: 55, optHigh: 90, max: 120, unit: "mg/kg" },
      potassium:   { min: 40, optLow: 55, optHigh: 90, max: 115, unit: "mg/kg" },
    },
  },
  {
    name: "Watermelon",
    key: "watermelon",
    category: "Fruits",
    description: "Long-season cucurbit requiring warm summers and dry harvesting conditions.",
    emoji: "🍉",
    suitableSoils: ["Sandy Loam", "Sandy", "Loamy"],
    suitableIrrigation: ["Drip"],
    ranges: {
      temperature: { min: 22, optLow: 26, optHigh: 35, max: 42, unit: "°C" },
      humidity:    { min: 40, optLow: 55, optHigh: 75, max: 85, unit: "%" },
      rainfall:    { min: 30, optLow: 55, optHigh: 130, max: 180, unit: "mm" },
      ph:          { min: 5.5, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 40, optLow: 55, optHigh: 90, max: 120, unit: "mg/kg" },
      phosphorus:  { min: 40, optLow: 55, optHigh: 90, max: 120, unit: "mg/kg" },
      potassium:   { min: 40, optLow: 55, optHigh: 90, max: 115, unit: "mg/kg" },
    },
  },
  {
    name: "Coffee",
    key: "coffee",
    category: "Plantation",
    description: "Shade-loving plantation crop thriving in humid tropical highlands.",
    emoji: "☕",
    suitableSoils: ["Loamy", "Laterite", "Red Soil"],
    suitableIrrigation: ["Drip", "Sprinkler"],
    ranges: {
      temperature: { min: 15, optLow: 18, optHigh: 26, max: 32, unit: "°C" },
      humidity:    { min: 60, optLow: 70, optHigh: 90, max: 100, unit: "%" },
      rainfall:    { min: 100, optLow: 150, optHigh: 250, max: 300, unit: "mm" },
      ph:          { min: 5.0, optLow: 6.0, optHigh: 7.0, max: 7.5, unit: "" },
      nitrogen:    { min: 40, optLow: 55, optHigh: 95, max: 120, unit: "mg/kg" },
      phosphorus:  { min: 25, optLow: 35, optHigh: 65, max: 95, unit: "mg/kg" },
      potassium:   { min: 20, optLow: 30, optHigh: 60, max: 90, unit: "mg/kg" },
    },
  },
];

/** Lookup a CropProfile by raw ML model class key (e.g. "rice", "banana") */
export function getCropProfile(cropKey: string): CropProfile | undefined {
  const normalized = cropKey.toLowerCase().trim();
  return CROP_PROFILES.find(
    (p) => p.key === normalized || p.name.toLowerCase() === normalized
  );
}

/** Get all crop profiles */
export function getAllCropProfiles(): CropProfile[] {
  return CROP_PROFILES;
}

/** Infer AgriSurge crop category from crop name */
export function inferCropCategory(cropName: string): string {
  const profile = getCropProfile(cropName);
  if (profile) return profile.category;

  const lower = cropName.toLowerCase();
  if (lower.includes("rice") || lower.includes("wheat") || lower.includes("maize") || lower.includes("barley")) return "Cereals";
  if (lower.includes("cotton") || lower.includes("jute") || lower.includes("sugarcane")) return "Commercial Crops";
  if (lower.includes("chickpea") || lower.includes("pigeonpea") || lower.includes("lentil") || lower.includes("bean") || lower.includes("gram")) return "Pulses";
  if (lower.includes("groundnut") || lower.includes("soyabean") || lower.includes("soybean")) return "Oilseeds";
  if (["apple", "banana", "mango", "grape", "pomegranate", "orange", "papaya", "coconut", "muskmelon", "watermelon"].some((f) => lower.includes(f))) return "Fruits";
  if (lower.includes("coffee") || lower.includes("tea") || lower.includes("rubber")) return "Plantation";
  return "Cereals";
}
