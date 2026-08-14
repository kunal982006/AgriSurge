import { NextRequest, NextResponse } from "next/server";
import { getAllUnderwritingRecords, UnderwritingRecord } from "@/lib/underwriting/underwritingStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "ALL";
    const riskFilter = searchParams.get("risk") || "ALL";
    const cropFilter = searchParams.get("crop") || "ALL";
    const regionFilter = searchParams.get("region") || "ALL";
    const searchQuery = (searchParams.get("q") || "").trim().toLowerCase();
    const sortBy = searchParams.get("sortBy") || "default"; // default | date | risk | premium | area

    let records: UnderwritingRecord[] = await getAllUnderwritingRecords();

    // Summary Counts (from ALL database records)
    const counts = {
      total: records.length,
      underReview: records.filter((r) => r.status === "UNDER_REVIEW").length,
      needsInformation: records.filter((r) => r.status === "NEEDS_INFORMATION").length,
      approved: records.filter((r) => r.status === "APPROVED").length,
      rejected: records.filter((r) => r.status === "REJECTED").length,
      highRisk: records.filter((r) => String(r.riskLevel).toUpperCase() === "HIGH").length,
    };

    // Dynamic Filter Lists
    const availableCrops = Array.from(new Set(records.map((r) => r.crop))).sort();
    const availableRegions = Array.from(new Set(records.map((r) => r.district || r.region))).sort();

    // 1. Status Filter
    if (statusFilter !== "ALL") {
      records = records.filter((r) => r.status.toUpperCase() === statusFilter.toUpperCase());
    }

    // 2. Risk Filter
    if (riskFilter !== "ALL") {
      records = records.filter((r) => String(r.riskLevel).toUpperCase() === riskFilter.toUpperCase());
    }

    // 3. Crop Filter
    if (cropFilter !== "ALL") {
      records = records.filter((r) => r.crop.toUpperCase() === cropFilter.toUpperCase());
    }

    // 4. Region Filter
    if (regionFilter !== "ALL") {
      records = records.filter(
        (r) => (r.district || r.region).toUpperCase() === regionFilter.toUpperCase()
      );
    }

    // 5. Search Query (across ID, Farm ID, Farmer, Farm Name, Village, District, Crop)
    if (searchQuery) {
      records = records.filter((r) => {
        return (
          r.id.toLowerCase().includes(searchQuery) ||
          r.farmCode.toLowerCase().includes(searchQuery) ||
          r.farmerName.toLowerCase().includes(searchQuery) ||
          r.farmName.toLowerCase().includes(searchQuery) ||
          (r.village && r.village.toLowerCase().includes(searchQuery)) ||
          (r.district && r.district.toLowerCase().includes(searchQuery)) ||
          r.crop.toLowerCase().includes(searchQuery)
        );
      });
    }

    // 6. Sorting (Default: Under Review first, then newest)
    records.sort((a, b) => {
      if (sortBy === "risk") {
        return b.riskScore - a.riskScore;
      }
      if (sortBy === "premium") {
        return b.recommendedPremium - a.recommendedPremium;
      }
      if (sortBy === "area") {
        return b.areaAcres - a.areaAcres;
      }
      if (sortBy === "date") {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }

      // Default sort: UNDER_REVIEW first, then NEEDS_INFORMATION, then by newest date
      const statusPriority: Record<string, number> = {
        UNDER_REVIEW: 1,
        NEEDS_INFORMATION: 2,
        DRAFT: 3,
        APPROVED: 4,
        REJECTED: 5,
      };

      const prioA = statusPriority[a.status] || 99;
      const prioB = statusPriority[b.status] || 99;

      if (prioA !== prioB) {
        return prioA - prioB;
      }

      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    return NextResponse.json({
      success: true,
      counts,
      availableCrops,
      availableRegions,
      records,
    });
  } catch (err) {
    console.error("Failed to fetch policies:", err);
    return NextResponse.json({ error: "Failed to fetch underwriting policies." }, { status: 500 });
  }
}
