export type NewsCategoryKey =
  | "all"
  | "crop-farming"
  | "weather-climate"
  | "insurance-risk"
  | "government-schemes"
  | "agritech-innovation"
  | "soil-health"
  | "agricultural-market";

export interface NewsCategoryMeta {
  key: NewsCategoryKey;
  label: string;
  emoji: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const NEWS_CATEGORIES: Record<NewsCategoryKey, NewsCategoryMeta> = {
  all: {
    key: "all",
    label: "All Updates",
    shortLabel: "All",
    emoji: "⚡",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/20",
  },
  "crop-farming": {
    key: "crop-farming",
    label: "Crop & Farming",
    shortLabel: "Crops",
    emoji: "🌾",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    badgeBorder: "border-amber-500/20",
  },
  "weather-climate": {
    key: "weather-climate",
    label: "Weather & Climate Risk",
    shortLabel: "Weather",
    emoji: "🌧️",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-400",
    badgeBorder: "border-sky-500/20",
  },
  "insurance-risk": {
    key: "insurance-risk",
    label: "Crop Insurance & Risk",
    shortLabel: "Insurance",
    emoji: "🛡️",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    badgeBorder: "border-emerald-500/20",
  },
  "government-schemes": {
    key: "government-schemes",
    label: "Government Schemes",
    shortLabel: "Government",
    emoji: "🏛️",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-400",
    badgeBorder: "border-indigo-500/20",
  },
  "agritech-innovation": {
    key: "agritech-innovation",
    label: "AgriTech & Innovation",
    shortLabel: "AgriTech",
    emoji: "🚜",
    badgeBg: "bg-teal-500/10",
    badgeText: "text-teal-400",
    badgeBorder: "border-teal-500/20",
  },
  "soil-health": {
    key: "soil-health",
    label: "Soil & Crop Health",
    shortLabel: "Soil Health",
    emoji: "🌱",
    badgeBg: "bg-green-500/10",
    badgeText: "text-green-400",
    badgeBorder: "border-green-500/20",
  },
  "agricultural-market": {
    key: "agricultural-market",
    label: "Agricultural Market",
    shortLabel: "Market & Mandi",
    emoji: "📈",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    badgeBorder: "border-purple-500/20",
  },
};

export interface AgriNewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string;
  relativeTime: string;
  category: NewsCategoryKey;
  categoryLabel: string;
  categoryEmoji: string;
  isImportant?: boolean;
  tags?: string[];
}

export interface AgriNewsResponse {
  success: boolean;
  articles: AgriNewsArticle[];
  totalResults: number;
  lastUpdated: string;
  categories: { key: NewsCategoryKey; label: string; emoji: string; count: number }[];
  error?: string;
}
