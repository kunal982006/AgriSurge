"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ExternalLink,
  RefreshCw,
  Search,
  AlertTriangle,
  Radio,
  Clock,
  Sparkles,
  Newspaper,
  Compass,
} from "lucide-react";
import { AgriNewsArticle, NEWS_CATEGORIES, NewsCategoryKey } from "@/lib/news/types";

// ─── Visual Theme Mapping for Fallback Art ────────────────────────────────────
const CATEGORY_THEMES: Record<
  NewsCategoryKey,
  {
    gradient: string;
    border: string;
    iconColor: string;
    accent: string;
    tagBg: string;
    tagText: string;
  }
> = {
  all: {
    gradient: "from-emerald-950/40 via-emerald-900/20 to-zinc-900",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    accent: "#10b981",
    tagBg: "bg-emerald-500/10",
    tagText: "text-emerald-400",
  },
  "crop-farming": {
    gradient: "from-amber-950/40 via-amber-900/20 to-zinc-900",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
    accent: "#f59e0b",
    tagBg: "bg-amber-500/10",
    tagText: "text-amber-400",
  },
  "weather-climate": {
    gradient: "from-sky-950/40 via-sky-900/20 to-zinc-900",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
    accent: "#0ea5e9",
    tagBg: "bg-sky-500/10",
    tagText: "text-sky-400",
  },
  "insurance-risk": {
    gradient: "from-emerald-950/40 via-teal-900/20 to-zinc-900",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    accent: "#14b8a6",
    tagBg: "bg-emerald-500/10",
    tagText: "text-emerald-400",
  },
  "government-schemes": {
    gradient: "from-indigo-950/40 via-indigo-900/20 to-zinc-900",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
    accent: "#6366f1",
    tagBg: "bg-indigo-500/10",
    tagText: "text-indigo-400",
  },
  "agritech-innovation": {
    gradient: "from-teal-950/40 via-teal-900/20 to-zinc-900",
    border: "border-teal-500/20",
    iconColor: "text-teal-400",
    accent: "#14b8a6",
    tagBg: "bg-teal-500/10",
    tagText: "text-teal-400",
  },
  "soil-health": {
    gradient: "from-green-950/40 via-green-900/20 to-zinc-900",
    border: "border-green-500/20",
    iconColor: "text-green-400",
    accent: "#22c55e",
    tagBg: "bg-green-500/10",
    tagText: "text-green-400",
  },
  "agricultural-market": {
    gradient: "from-purple-950/40 via-purple-900/20 to-zinc-900",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
    accent: "#a855f7",
    tagBg: "bg-purple-500/10",
    tagText: "text-purple-400",
  },
};

// ─── News Card Component ──────────────────────────────────────────────────────
function NewsCard({ article, index }: { article: AgriNewsArticle; index: number }) {
  const [imgError, setImgError] = useState(false);
  const theme = CATEGORY_THEMES[article.category] || CATEGORY_THEMES.all;

  return (
    <article
      style={{ animationDelay: `${index * 40}ms` }}
      className="group relative flex flex-col justify-between rounded-[10px] border border-white/8 bg-[var(--color-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[var(--color-surface-raised)]"
    >
      <div>
        {/* Top bar: Category badge & Time */}
        <div className="flex items-center justify-between gap-2 pb-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${theme.tagBg} ${theme.tagText}`}
          >
            <span>{article.categoryEmoji}</span>
            <span>{article.categoryLabel}</span>
          </span>

          <span className="flex items-center gap-1 text-[11px] text-white/40">
            <Clock size={11} className="shrink-0" />
            <time dateTime={article.publishedAt}>{article.relativeTime}</time>
          </span>
        </div>

        {/* Thumbnail / Themed Fallback Illustration */}
        <div className="relative mb-3.5 h-40 w-full overflow-hidden rounded-[7px] bg-[#121614]">
          {article.imageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt={article.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${theme.gradient} p-4 text-center`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10">
                <span className="text-[20px]">{article.categoryEmoji}</span>
              </div>
              <span className="text-[11px] font-medium tracking-wide text-white/50 uppercase">
                {article.source}
              </span>
            </div>
          )}
        </div>

        {/* Headline */}
        <h2 className="text-[14.5px] font-semibold leading-snug text-white/90 group-hover:text-white line-clamp-2">
          {article.title}
        </h2>

        {/* Short Description */}
        <p className="mt-2 text-[12px] leading-relaxed text-white/60 line-clamp-3">
          {article.description}
        </p>
      </div>

      {/* Footer info: Source & Read link */}
      <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
        <div className="flex items-center gap-1.5 text-[11.5px] text-white/45">
          <Newspaper size={12} className="shrink-0 text-white/30" />
          <span className="max-w-[140px] truncate font-medium">{article.source}</span>
        </div>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[11.5px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <span>Read Update</span>
          <ExternalLink size={11} className="shrink-0" />
        </a>
      </div>
    </article>
  );
}

// ─── Skeleton Card Loader ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col justify-between rounded-[10px] border border-white/6 bg-[var(--color-surface)] p-4 animate-pulse">
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="h-4 w-28 rounded-full bg-white/8" />
          <div className="h-3 w-14 rounded bg-white/8" />
        </div>
        <div className="mb-3.5 h-40 w-full rounded-[7px] bg-white/5" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-white/8" />
          <div className="h-4 w-4/5 rounded bg-white/8" />
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-3 w-full rounded bg-white/5" />
          <div className="h-3 w-3/4 rounded bg-white/5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
        <div className="h-3 w-20 rounded bg-white/5" />
        <div className="h-3 w-16 rounded bg-white/8" />
      </div>
    </div>
  );
}

// ─── Main Notifications Page ─────────────────────────────────────────────────
export default function NotificationsPage() {
  const [articles, setArticles] = useState<AgriNewsArticle[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<NewsCategoryKey, number>>({
    all: 0,
    "crop-farming": 0,
    "weather-climate": 0,
    "insurance-risk": 0,
    "government-schemes": 0,
    "agritech-innovation": 0,
    "soil-health": 0,
    "agricultural-market": 0,
  });
  const [selectedCategory, setSelectedCategory] = useState<NewsCategoryKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>("");

  const fetchNews = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = `/api/news${forceRefresh ? "?refresh=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load agricultural updates.");

      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
        setLastRefreshedTime(
          new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        );

        // Update counts
        const counts: Record<NewsCategoryKey, number> = {
          all: data.articles.length,
          "crop-farming": 0,
          "weather-climate": 0,
          "insurance-risk": 0,
          "government-schemes": 0,
          "agritech-innovation": 0,
          "soil-health": 0,
          "agricultural-market": 0,
        };

        data.articles.forEach((a: AgriNewsArticle) => {
          if (counts[a.category] !== undefined) {
            counts[a.category]++;
          }
        });
        setCategoryCounts(counts);
      } else {
        throw new Error(data.error || "Failed to parse news updates.");
      }
    } catch (err: any) {
      setError(err.message || "Unable to fetch news right now. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(false);
  }, [fetchNews]);

  // Client-side filtering for search & category
  const filteredArticles = articles.filter((a) => {
    const matchesCategory = selectedCategory === "all" || a.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.source.toLowerCase().includes(q) ||
      a.categoryLabel.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const categoriesList = Object.keys(NEWS_CATEGORIES) as NewsCategoryKey[];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-bold tracking-tight text-white">Notifications</h1>
            {/* Live indicator badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live Agriculture Updates
            </span>
          </div>
          <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed max-w-2xl">
            Stay updated with important agricultural developments, crop risks, weather events, insurance updates and farming intelligence.
          </p>
        </div>

        {/* Action Controls: Refresh & Status */}
        <div className="flex items-center gap-2">
          {lastRefreshedTime && (
            <span className="text-[11px] text-white/35">Updated {lastRefreshedTime}</span>
          )}
          <button
            onClick={() => fetchNews(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 rounded-[7px] border border-white/10 bg-white/4 px-3 py-1.5 text-[12px] font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/8 hover:text-white disabled:opacity-50"
            title="Refresh latest updates"
          >
            <RefreshCw
              size={13}
              className={`shrink-0 ${refreshing ? "animate-spin text-emerald-400" : ""}`}
            />
            <span>{refreshing ? "Updating…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar: Categories & Search ─────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categoriesList.map((key) => {
            const cat = NEWS_CATEGORIES[key];
            const isActive = selectedCategory === key;
            const count = categoryCounts[key] || 0;

            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-[12px] font-medium transition-all ${
                  isActive
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "border-white/8 bg-white/3 text-white/65 hover:border-white/15 hover:bg-white/6 hover:text-white"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                      isActive ? "bg-emerald-500/30 text-emerald-200" : "bg-white/8 text-white/40"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative max-w-md">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop, scheme, monsoon, insurance or keywords…"
            className="w-full rounded-[7px] border border-white/8 bg-white/4 py-1.5 pl-8 pr-3 text-[12.5px] text-white/85 placeholder:text-white/30 focus:border-emerald-500/50 focus:bg-white/6 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/40 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-red-500/20 bg-red-500/8 px-4 py-3 text-[12.5px] text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchNews(true)}
            className="shrink-0 rounded-[5px] bg-red-500/20 px-2.5 py-1 text-[11.5px] font-medium text-red-200 hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Articles Grid ───────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article, idx) => (
            <NewsCard key={`${article.id}-${idx}`} article={article} index={idx} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-white/10 py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/4 border border-white/8 text-white/40">
            <Compass size={22} />
          </div>
          <h3 className="text-[14.5px] font-semibold text-white/85">
            No new agricultural updates found
          </h3>
          <p className="mt-1.5 max-w-sm text-[12px] text-white/50 leading-relaxed">
            {searchQuery
              ? `No articles matched your search "${searchQuery}". Try different keywords or clear filters.`
              : "No articles found in this category right now. Check other categories or refresh."}
          </p>
          {(selectedCategory !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-4 rounded-[6px] border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/75 hover:bg-white/10 hover:text-white"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
