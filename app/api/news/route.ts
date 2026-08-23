import { NextRequest, NextResponse } from "next/server";
import { getAgricultureNews } from "@/lib/news/newsService";
import { NewsCategoryKey } from "@/lib/news/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "all") as NewsCategoryKey;
    const forceRefresh = searchParams.get("refresh") === "true";
    const searchQuery = (searchParams.get("q") || "").trim().toLowerCase();

    const response = await getAgricultureNews(forceRefresh);

    let filtered = response.articles;

    // 1. Filter by category
    if (category && category !== "all") {
      filtered = filtered.filter((a) => a.category === category);
    }

    // 2. Filter by search query if provided
    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery) ||
          a.description.toLowerCase().includes(searchQuery) ||
          a.source.toLowerCase().includes(searchQuery) ||
          a.categoryLabel.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json({
      success: true,
      articles: filtered,
      totalResults: filtered.length,
      lastUpdated: response.lastUpdated,
      categories: response.categories,
    });
  } catch (err) {
    console.error("[/api/news] Failed to fetch news:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to load agriculture news updates at this time.",
        articles: [],
        totalResults: 0,
        categories: [],
      },
      { status: 500 }
    );
  }
}
