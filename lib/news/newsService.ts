import crypto from "crypto";
import { AgriNewsArticle, AgriNewsResponse, NEWS_CATEGORIES, NewsCategoryKey } from "./types";

// ─── Unique Article ID Generator ─────────────────────────────────────────────
function generateArticleId(prefix: string, identifier: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(identifier)
    .digest("hex")
    .slice(0, 16);
  return `${prefix}-${hash}`;
}

// ─── Cache Layer ─────────────────────────────────────────────────────────────
interface CacheEntry {
  data: AgriNewsArticle[];
  timestamp: number;
}

let _newsCache: CacheEntry | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// ─── Relative Time Helper ────────────────────────────────────────────────────
export function formatRelativeTime(dateInput: string | Date | number): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Recently";
    
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

// ─── Positive and Negative Keywords ──────────────────────────────────────────
const POSITIVE_AGRICULTURE_KEYWORDS = [
  "agriculture", "agricultural", "farming", "farmer", "farmers",
  "crop", "crops", "soil", "irrigation", "fertilizer", "fertilizers",
  "harvest", "harvesting", "sowing", "paddy", "wheat", "cotton", "sugarcane",
  "soybean", "maize", "pulses", "gram", "groundnut", "horticulture",
  "monsoon", "rainfall", "drought", "flood", "unseasonal rain",
  "crop insurance", "farmer insurance", "fasal bima", "pmfby", "indemnity",
  "agritech", "smart farming", "precision agriculture", "drone in agriculture",
  "soil health", "organic farming", "pesticide", "pesticides", "urea", "npk",
  "mandi", "msp", "minimum support price", "apmc", "kisan", "krishi",
  "icar", "imd weather", "kharif", "rabi", "grain", "yield", "produce",
  "foodgrain", "tractor", "agronomy", "livestock", "dairy farming"
];

const NEGATIVE_SPAM_KEYWORDS = [
  "bollywood", "hollywood", "box office", "celebrity", "cinema", "trailer",
  "cricket", "ipl", "t20", "premier league", "football match", "goal",
  "horoscope", "astrology", "actor", "actress", "fashion show", "bikini",
  "crypto", "bitcoin", "ethereum", "casino", "gambling", "movie review"
];

// ─── Classification Rules ────────────────────────────────────────────────────
function classifyArticleCategory(title: string, description: string): NewsCategoryKey {
  const text = `${title} ${description}`.toLowerCase();

  // 1. Insurance & Risk
  if (
    text.includes("insurance") ||
    text.includes("fasal bima") ||
    text.includes("pmfby") ||
    text.includes("claim") ||
    text.includes("compensation") ||
    text.includes("indemnity") ||
    text.includes("loss assessment") ||
    text.includes("underwrite")
  ) {
    return "insurance-risk";
  }

  // 2. Weather & Climate Risk
  if (
    text.includes("monsoon") ||
    text.includes("rainfall") ||
    text.includes("rain") ||
    text.includes("drought") ||
    text.includes("flood") ||
    text.includes("heatwave") ||
    text.includes("temperature") ||
    text.includes("cyclone") ||
    text.includes("weather forecast") ||
    text.includes("imd") ||
    text.includes("climate change") ||
    text.includes("el nino") ||
    text.includes("la nina")
  ) {
    return "weather-climate";
  }

  // 3. Government Schemes
  if (
    text.includes("scheme") ||
    text.includes("subsidy") ||
    text.includes("subsidies") ||
    text.includes("ministry of agriculture") ||
    text.includes("government") ||
    text.includes("govt") ||
    text.includes("cabinet") ||
    text.includes("kisan samman") ||
    text.includes("kisan credit") ||
    text.includes("loan waiver") ||
    text.includes("policy") ||
    text.includes("pib")
  ) {
    return "government-schemes";
  }

  // 4. AgriTech & Innovation
  if (
    text.includes("drone") ||
    text.includes("sensor") ||
    text.includes("iot") ||
    text.includes("agritech") ||
    text.includes("agtech") ||
    text.includes("precision agriculture") ||
    text.includes("smart farming") ||
    text.includes("artificial intelligence") ||
    text.includes("ai in farming") ||
    text.includes("startup") ||
    text.includes("satellite") ||
    text.includes("automation")
  ) {
    return "agritech-innovation";
  }

  // 5. Soil & Crop Health
  if (
    text.includes("soil") ||
    text.includes("fertilizer") ||
    text.includes("fertiliser") ||
    text.includes("urea") ||
    text.includes("npk") ||
    text.includes("pesticide") ||
    text.includes("insecticide") ||
    text.includes("pest") ||
    text.includes("disease") ||
    text.includes("nutrient") ||
    text.includes("organic farming") ||
    text.includes("water management")
  ) {
    return "soil-health";
  }

  // 6. Agricultural Market
  if (
    text.includes("mandi") ||
    text.includes("price") ||
    text.includes("msp") ||
    text.includes("apmc") ||
    text.includes("export") ||
    text.includes("import") ||
    text.includes("procurement") ||
    text.includes("inflation") ||
    text.includes("commodity") ||
    text.includes("trade")
  ) {
    return "agricultural-market";
  }

  // Default: Crop & Farming
  return "crop-farming";
}

// ─── Relevance Filter ────────────────────────────────────────────────────────
function isAgricultureRelevant(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();

  // Reject if negative keywords match prominently
  for (const neg of NEGATIVE_SPAM_KEYWORDS) {
    if (text.includes(neg)) {
      // If it contains a negative keyword, only accept if there is strong agricultural focus
      const hasStrongAgri =
        text.includes("farmer") ||
        text.includes("agriculture") ||
        text.includes("crop") ||
        text.includes("farming");
      if (!hasStrongAgri) return false;
    }
  }

  // Must match at least one agricultural keyword
  return POSITIVE_AGRICULTURE_KEYWORDS.some((kw) => text.includes(kw));
}

// ─── Deduplication ───────────────────────────────────────────────────────────
function deduplicateArticles(articles: AgriNewsArticle[]): AgriNewsArticle[] {
  const seenTitles = new Set<string>();
  const results: AgriNewsArticle[] = [];

  for (const article of articles) {
    // Normalize title to first 8 significant words
    const norm = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .slice(0, 8)
      .join(" ");

    if (norm.length > 5 && !seenTitles.has(norm)) {
      seenTitles.add(norm);
      results.push(article);
    }
  }

  return results;
}

// ─── External Feed Parsers ───────────────────────────────────────────────────

/** 1. NewsAPI.org Provider */
async function fetchFromNewsApi(apiKey: string): Promise<AgriNewsArticle[]> {
  try {
    const url = `https://newsapi.org/v2/everything?q=(agriculture OR farming OR "crop yield" OR "crop insurance" OR "farmer") AND (India OR Maharashtra)&language=en&sortBy=publishedAt&pageSize=40&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) return [];

    return data.articles.map((item: any, idx: number) => {
      const title = item.title || "";
      const description = item.description || "";
      const category = classifyArticleCategory(title, description);
      const catMeta = NEWS_CATEGORIES[category];

      return {
        id: generateArticleId("newsapi", item.url || `${title}-${idx}`),
        title,
        description,
        content: item.content || description,
        url: item.url || "#",
        imageUrl: item.urlToImage || null,
        source: item.source?.name || "News Network",
        publishedAt: item.publishedAt || new Date().toISOString(),
        relativeTime: formatRelativeTime(item.publishedAt),
        category,
        categoryLabel: catMeta.label,
        categoryEmoji: catMeta.emoji,
      };
    });
  } catch (err) {
    console.error("[NewsAPI] Fetch error:", err);
    return [];
  }
}

/** 2. GNews.io Provider */
async function fetchFromGNews(apiKey: string): Promise<AgriNewsArticle[]> {
  try {
    const url = `https://gnews.io/api/v4/search?q=agriculture+OR+farming+OR+crops+India&lang=en&country=in&max=30&token=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) return [];

    return data.articles.map((item: any, idx: number) => {
      const title = item.title || "";
      const description = item.description || "";
      const category = classifyArticleCategory(title, description);
      const catMeta = NEWS_CATEGORIES[category];

      return {
        id: generateArticleId("gnews", item.url || `${title}-${idx}`),
        title,
        description,
        content: item.content || description,
        url: item.url || "#",
        imageUrl: item.image || null,
        source: item.source?.name || "Agricultural Source",
        publishedAt: item.publishedAt || new Date().toISOString(),
        relativeTime: formatRelativeTime(item.publishedAt),
        category,
        categoryLabel: catMeta.label,
        categoryEmoji: catMeta.emoji,
      };
    });
  } catch (err) {
    console.error("[GNews] Fetch error:", err);
    return [];
  }
}

/** 3. Google News India Agriculture RSS Feed (Live & Always Available) */
async function fetchFromGoogleNewsRss(): Promise<AgriNewsArticle[]> {
  try {
    // Queries curated for high-value agriculture, insurance, crop and weather intelligence in India / Maharashtra
    const queries = [
      "agriculture+India+farming+crops+Maharashtra+when:7d",
      "crop+insurance+Fasal+Bima+PMFBY+monsoon+rainfall+India+when:7d",
      "agritech+farming+smart+agriculture+India+Kisan+when:7d",
    ];

    const allItems: AgriNewsArticle[] = [];

    for (const q of queries) {
      const rssUrl = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
      const res = await fetch(rssUrl, { next: { revalidate: 600 } });
      if (!res.ok) continue;

      const text = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;

      while ((match = itemRegex.exec(text)) !== null) {
        const itemBlock = match[1];
        const titleMatch = itemBlock.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/);
        const pubDateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const sourceMatch = itemBlock.match(/<source[^>]*>([\s\S]*?)<\/source>/);
        const descMatch = itemBlock.match(/<description>([\s\S]*?)<\/description>/);

        if (titleMatch && linkMatch) {
          let rawTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();
          const sourceName = sourceMatch
            ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim()
            : "Agricultural News";

          // Strip source suffix if present
          if (rawTitle.endsWith(` - ${sourceName}`)) {
            rawTitle = rawTitle.slice(0, -(sourceName.length + 3));
          }

          let rawDesc = descMatch ? descMatch[1] : "";
          // 1. Decode HTML entities
          let decoded = rawDesc
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&nbsp;/g, " ");

          // 2. Strip HTML tags
          let cleanDesc = decoded.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

          // 3. Strip trailing source name
          if (cleanDesc.endsWith(sourceName)) {
            cleanDesc = cleanDesc.slice(0, -sourceName.length).trim();
          }

          // 4. Ensure descriptive non-empty content
          if (!cleanDesc || cleanDesc.toLowerCase() === rawTitle.toLowerCase() || cleanDesc.length < 20) {
            cleanDesc = `Latest agricultural report and risk intelligence update regarding ${rawTitle}.`;
          }

          const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
          const category = classifyArticleCategory(rawTitle, cleanDesc);
          const catMeta = NEWS_CATEGORIES[category];

          allItems.push({
            id: generateArticleId("rss", `${linkMatch[1].trim()}#${rawTitle}`),
            title: rawTitle,
            description: cleanDesc,
            url: linkMatch[1].trim(),
            imageUrl: null, // RSS links don't always carry high-res images; fallback illustration will be used
            source: sourceName,
            publishedAt: pubDate,
            relativeTime: formatRelativeTime(pubDate),
            category,
            categoryLabel: catMeta.label,
            categoryEmoji: catMeta.emoji,
          });
        }
      }
    }

    return allItems;
  } catch (err) {
    console.error("[GoogleNewsRSS] Fetch error:", err);
    return [];
  }
}

// ─── Primary Service Function ────────────────────────────────────────────────
export async function getAgricultureNews(forceRefresh = false): Promise<AgriNewsResponse> {
  const now = Date.now();

  // Return cached result if valid and not forcing refresh
  if (!forceRefresh && _newsCache && now - _newsCache.timestamp < CACHE_TTL_MS) {
    return buildResponse(_newsCache.data);
  }

  // Detect available environment variable keys
  const newsApiKey =
    process.env.NEWS_API_KEY ||
    process.env.NEWSAPI_KEY ||
    process.env.NEWS_KEY;

  const gnewsApiKey =
    process.env.GNEWS_API_KEY ||
    process.env.GNEWS_KEY;

  let rawArticles: AgriNewsArticle[] = [];

  // Try API keys first if configured
  if (newsApiKey) {
    const apiArticles = await fetchFromNewsApi(newsApiKey);
    if (apiArticles.length > 0) {
      rawArticles.push(...apiArticles);
    }
  }

  if (gnewsApiKey) {
    const gnewsArticles = await fetchFromGNews(gnewsApiKey);
    if (gnewsArticles.length > 0) {
      rawArticles.push(...gnewsArticles);
    }
  }

  // Always supplement / fallback with live Agriculture RSS feeds
  const rssArticles = await fetchFromGoogleNewsRss();
  rawArticles.push(...rssArticles);

  // Apply strict agricultural relevance filter
  const filtered = rawArticles.filter((article) =>
    isAgricultureRelevant(article.title, article.description)
  );

  // Deduplicate articles
  const deduplicated = deduplicateArticles(filtered);

  // Sort by newest publication date
  deduplicated.sort((a, b) => {
    const timeA = new Date(a.publishedAt).getTime();
    const timeB = new Date(b.publishedAt).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  // Update in-memory cache
  if (deduplicated.length > 0) {
    _newsCache = {
      data: deduplicated,
      timestamp: now,
    };
  }

  return buildResponse(deduplicated.length > 0 ? deduplicated : (_newsCache?.data || []));
}

function buildResponse(articles: AgriNewsArticle[]): AgriNewsResponse {
  // Compute category counts
  const catCounts: Record<NewsCategoryKey, number> = {
    all: articles.length,
    "crop-farming": 0,
    "weather-climate": 0,
    "insurance-risk": 0,
    "government-schemes": 0,
    "agritech-innovation": 0,
    "soil-health": 0,
    "agricultural-market": 0,
  };

  articles.forEach((a) => {
    if (catCounts[a.category] !== undefined) {
      catCounts[a.category]++;
    }
  });

  const categories = (Object.keys(NEWS_CATEGORIES) as NewsCategoryKey[]).map((key) => ({
    key,
    label: NEWS_CATEGORIES[key].label,
    emoji: NEWS_CATEGORIES[key].emoji,
    count: catCounts[key] || 0,
  }));

  return {
    success: true,
    articles,
    totalResults: articles.length,
    lastUpdated: new Date().toISOString(),
    categories,
  };
}
