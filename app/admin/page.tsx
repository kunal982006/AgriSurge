"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  Sprout,
  DollarSign,
  TrendingUp,
  RefreshCw,
  LogOut,
  Search,
  Download,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  Coins,
  Menu,
  X,
  BarChart3,
  CheckCircle2,
  Database,
  Lock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface AdminSummary {
  totalUsers: number;
  totalFarmers: number;
  totalInsurance: number;
  totalAssessments: number;
  totalEstimatedPremium: number;
  averageEstimatedPremium: number;
  topDistrict: {
    district: string;
    count: number;
    percentage: number;
  };
}

interface UserComparison {
  farmers: number;
  insuranceCompanies: number;
  totalUsers: number;
  farmerPercentage: number;
  insurancePercentage: number;
}

interface RegistrationTimelinePoint {
  month: string;
  farmers: number;
  insurance: number;
  total: number;
}

interface DistrictPoint {
  district: string;
  count: number;
  percentage: number;
}

interface RiskPoint {
  level: string;
  count: number;
  percentage: number;
  fill: string;
}

interface DistrictPremiumPoint {
  district: string;
  totalPremium: number;
  avgPremium: number;
  count: number;
}

interface PremiumTrendPoint {
  month: string;
  premium: number;
  count: number;
}

interface RiskVsPremiumPoint {
  category: string;
  totalPremium: number;
  avgPremium: number;
  count: number;
  fill: string;
}

interface RecentAssessment {
  id: string;
  type: string;
  farmerName: string;
  crop: string;
  district: string;
  riskLevel: string;
  riskScorePct: number;
  recommendedPremium: number;
  status: string;
  createdAt: string;
}

interface RecentRegistration {
  id: string;
  name: string;
  type: string;
  phone: string;
  organization: string;
  region: string;
  createdAt: string;
}

interface AnalyticsPayload {
  summary: AdminSummary;
  userComparison: UserComparison;
  userRegistrationTimeline: RegistrationTimelinePoint[];
  districtDistribution: DistrictPoint[];
  riskDistribution: RiskPoint[];
  districtWisePremium: DistrictPremiumPoint[];
  premiumTrends: PremiumTrendPoint[];
  riskVsPremium: RiskVsPremiumPoint[];
  recentAssessments: RecentAssessment[];
  recentRegistrations: RecentRegistration[];
}

type NavSection = "dashboard" | "users" | "assessments" | "premium" | "settings";

const NAV_ITEMS: { id: NavSection; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "assessments", label: "Assessments", icon: ShieldCheck },
  { id: "premium", label: "Premium Analytics", icon: Coins },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [adminUser, setAdminUser] = useState<{ id: number; username: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeNav, setActiveNav] = useState<NavSection>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Table filters & search
  const [tableTab, setTableTab] = useState<"assessments" | "users">("assessments");
  const [assessmentSearchQuery, setAssessmentSearchQuery] = useState("");
  const [assessmentRiskFilter, setAssessmentRiskFilter] = useState("ALL");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState("ALL");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");

  const checkAuthAndFetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const meRes = await fetch("/api/admin/auth/me");
      if (!meRes.ok) {
        router.push("/admin/login");
        return;
      }
      const meData = await meRes.json();
      if (!meData.success || !meData.admin) {
        router.push("/admin/login");
        return;
      }
      setAdminUser(meData.admin);

      const analyticsRes = await fetch("/api/admin/analytics");
      if (!analyticsRes.ok) {
        if (analyticsRes.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch analytics");
      }
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        const payload = analyticsData.data || analyticsData;
        setData(payload);
      }
    } catch (err) {
      console.error("[Admin Dashboard] Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndFetch();
  }, [checkAuthAndFetch]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  const filteredRegistrations = useMemo(() => {
    if (!data?.recentRegistrations) return [];
    return data.recentRegistrations.filter((u) => {
      if (userRoleFilter === "FARMER" && u.type !== "Farmer") return false;
      if (userRoleFilter === "INSURANCE" && u.type !== "Insurance Carrier") return false;
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          u.organization.toLowerCase().includes(q) ||
          u.region.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, userRoleFilter, userSearchQuery]);

  const filteredAssessments = useMemo(() => {
    if (!data?.recentAssessments) return [];
    return data.recentAssessments.filter((a) => {
      if (assessmentRiskFilter !== "ALL" && a.riskLevel.toUpperCase() !== assessmentRiskFilter.toUpperCase()) {
        return false;
      }
      if (assessmentStatusFilter !== "ALL" && a.status.toUpperCase() !== assessmentStatusFilter.toUpperCase()) {
        return false;
      }
      if (assessmentSearchQuery.trim()) {
        const q = assessmentSearchQuery.toLowerCase();
        return (
          a.id.toLowerCase().includes(q) ||
          a.farmerName.toLowerCase().includes(q) ||
          a.crop.toLowerCase().includes(q) ||
          a.district.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, assessmentRiskFilter, assessmentStatusFilter, assessmentSearchQuery]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows: string[][] = [
      ["--- AGRISURGE ADMIN AUDIT REPORT ---", new Date().toISOString()],
      ["Metric", "Value"],
      ["Total Users", String(data.summary.totalUsers)],
      ["Total Farmers", String(data.summary.totalFarmers)],
      ["Total Insurance Companies", String(data.summary.totalInsurance)],
      ["Total Assessments", String(data.summary.totalAssessments)],
      ["Total Estimated Premium (INR)", `₹${data.summary.totalEstimatedPremium}`],
      ["Average Estimated Premium (INR)", `₹${data.summary.averageEstimatedPremium}`],
      ["Top District with Most Farmers", `${data.summary.topDistrict.district} (${data.summary.topDistrict.count} farmers)`],
      [],
      ["--- ASSESSMENTS & POLICIES ---"],
      ["ID", "Type", "Farmer", "Crop", "District", "Risk Level", "Score %", "Premium (INR)", "Status", "Date"],
      ...filteredAssessments.map((a) => [
        a.id,
        a.type,
        a.farmerName,
        a.crop,
        a.district,
        a.riskLevel,
        `${a.riskScorePct}%`,
        `₹${a.recommendedPremium}`,
        a.status,
        new Date(a.createdAt).toISOString().slice(0, 10),
      ]),
      [],
      ["--- USER REGISTRATIONS ---"],
      ["ID", "Name", "Type", "Phone", "Organization", "District", "Date"],
      ...filteredRegistrations.map((u) => [
        u.id,
        u.name,
        u.type,
        u.phone,
        u.organization,
        u.region,
        new Date(u.createdAt).toISOString().slice(0, 10),
      ]),
    ];
    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `agrisurge_admin_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-700">
        <RefreshCw size={24} className="animate-spin text-blue-600" />
        <p className="mt-3 text-xs font-semibold text-slate-600">Loading admin analytics…</p>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      {/* ── STANDALONE ADMIN SIDEBAR ─────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 flex-col justify-between border-r border-slate-200 bg-white">
        <div>
          {/* Brand */}
          <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900">AgriSurge</span>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">Admin Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.4 : 2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Admin User & Logout */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200/70">
            <div className="min-w-0 pr-2">
              <p className="truncate text-xs font-bold text-slate-900">{adminUser?.name || "admin"}</p>
              <p className="truncate text-[10px] text-slate-400">@{adminUser?.username || "admin"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-lg border border-slate-200 p-1.5 text-slate-600"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
            <h1 className="text-base font-bold text-slate-900 capitalize">
              {activeNav === "dashboard"
                ? "Admin Dashboard"
                : activeNav === "users"
                ? "User Analytics"
                : activeNav === "assessments"
                ? "Assessments & Risk"
                : activeNav === "premium"
                ? "Premium Analytics"
                : "Settings"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => checkAuthAndFetch(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin text-blue-600" : "text-slate-500"} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
            >
              <Download size={12} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white p-2.5 space-y-1 shadow-sm">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                  activeNav === item.id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon size={15} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ── OVERVIEW KPI CARDS (6 CARDS) ────────────────────────── */}
          {(activeNav === "dashboard" || activeNav === "users" || activeNav === "assessments" || activeNav === "premium") && (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
              {/* 1. Total Users */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Users</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Users size={14} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {s?.totalUsers || 0}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 font-medium">All registered accounts</p>
              </div>

              {/* 2. Total Farmers */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Farmers</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Sprout size={14} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {s?.totalFarmers || 0}
                </div>
                <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">
                  {data?.userComparison?.farmerPercentage}% of userbase
                </p>
              </div>

              {/* 3. Total Insurance Companies */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Insurance Cos</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Building2 size={14} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {s?.totalInsurance || 0}
                </div>
                <p className="mt-0.5 text-[11px] text-indigo-700 font-medium">
                  {data?.userComparison?.insurancePercentage}% of userbase
                </p>
              </div>

              {/* 4. Total Assessments */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Assessments</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <BarChart3 size={14} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {s?.totalAssessments || 0}
                </div>
                <p className="mt-0.5 text-[11px] text-amber-700 font-medium">Underwritten farm plots</p>
              </div>

              {/* 5. Total Estimated Premium */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Premium</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <DollarSign size={14} />
                  </div>
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                  ₹{((s?.totalEstimatedPremium || 0) / 1000).toFixed(1)}k
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600 font-medium truncate" title={`₹${s?.totalEstimatedPremium?.toLocaleString("en-IN")}`}>
                  ₹{s?.totalEstimatedPremium?.toLocaleString("en-IN")}
                </p>
              </div>

              {/* 6. Average Estimated Premium */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg Premium</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                    <TrendingUp size={14} />
                  </div>
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                  ₹{s?.averageEstimatedPremium?.toLocaleString("en-IN")}
                </div>
                <p className="mt-0.5 text-[11px] text-cyan-700 font-medium">Per assessment</p>
              </div>
            </div>
          )}

          {/* ── 2. USER ANALYTICS ───────────────────────────────────── */}
          {(activeNav === "dashboard" || activeNav === "users") && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">User Analytics & Registration Trend</h2>
                  <p className="text-xs text-slate-500">
                    Farmers vs. Insurance Companies registration volume over time
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    Farmers: {s?.totalFarmers} ({data?.userComparison?.farmerPercentage}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-slate-800" />
                    Insurance: {s?.totalInsurance} ({data?.userComparison?.insurancePercentage}%)
                  </span>
                </div>
              </div>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.userRegistrationTimeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", color: "#0f172a", fontSize: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "6px" }} />
                    <Bar dataKey="farmers" name="Farmer Registrations" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="insurance" name="Insurance Registrations" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── 3 & 4. DISTRICT ANALYTICS & RISK ANALYTICS ───────────── */}
          {(activeNav === "dashboard" || activeNav === "assessments") && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* 3. District Analytics (7 cols) */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">District-Wise Farmer Distribution</h2>
                    <p className="text-xs text-slate-500">
                      Farmer concentration across Maharashtra districts
                    </p>
                  </div>
                  {s?.topDistrict && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                      Highest: {s.topDistrict.district} ({s.topDistrict.count} farmers · {s.topDistrict.percentage}%)
                    </span>
                  )}
                </div>

                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={(data?.districtDistribution || []).slice(0, 6)}
                      margin={{ top: 5, right: 25, left: 25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="district" stroke="#64748b" fontSize={11} tickLine={false} width={85} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", color: "#0f172a", fontSize: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                      />
                      <Bar dataKey="count" name="Registered Farmers" fill="#2563eb" radius={[0, 4, 4, 0]}>
                        {(data?.districtDistribution || []).slice(0, 6).map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={idx === 0 ? "#1d4ed8" : "#3b82f6"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. Risk Analytics (5 cols) */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Risk Analytics</h2>
                    <p className="text-xs text-slate-500">Low, Medium, and High crop failure risk categories</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {s?.totalAssessments} Total
                  </span>
                </div>

                <div className="relative h-[155px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.riskDistribution || []}
                        dataKey="count"
                        nameKey="level"
                        innerRadius={46}
                        outerRadius={68}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {(data?.riskDistribution || []).map((entry) => (
                          <Cell key={entry.level} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", color: "#0f172a", fontSize: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-900">{s?.totalAssessments || 0}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Assessments</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {(data?.riskDistribution || []).map((r) => (
                    <div key={r.level} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.fill }} />
                        <span className="text-[11px] font-semibold text-slate-800">{r.level}</span>
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900">{r.count}</div>
                      <div className="text-[10px] text-slate-500">{r.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 5. PREMIUM ANALYTICS ────────────────────────────────── */}
          {(activeNav === "dashboard" || activeNav === "premium") && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                {/* 5A. Estimated Premium Trend (7 cols) */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Estimated Premium Trend Over Time</h2>
                      <p className="text-xs text-slate-500">Historical underwriting premium quote volume (₹ INR)</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                      Total: ₹{s?.totalEstimatedPremium?.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="h-[230px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.premiumTrends || []} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="premiumGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", color: "#0f172a", fontSize: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Estimated Premium"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="premium"
                          stroke="#2563eb"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#premiumGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 5B. Risk Category vs Estimated Premium (5 cols) */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Risk Category vs. Estimated Premium</h2>
                      <p className="text-xs text-slate-500">Total and average exposure broken down by risk tier</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-0.5">
                    {(data?.riskVsPremium || []).map((rvp) => (
                      <div key={rvp.category} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: rvp.fill }} />
                            <span className="text-xs font-semibold text-slate-900">{rvp.category}</span>
                            <span className="text-[10px] text-slate-500">({rvp.count} assessments)</span>
                          </div>
                          <span className="text-xs font-bold text-slate-900">₹{rvp.totalPremium.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/50 pt-1.5">
                          <span>Average Premium:</span>
                          <span className="font-semibold text-blue-700">₹{rvp.avgPremium.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5C. District-Wise Premium Comparison */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">District-Wise Premium Comparison</h2>
                    <p className="text-xs text-slate-500">Total underwritten premium volume across districts</p>
                  </div>
                </div>

                <div className="h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(data?.districtWisePremium || []).slice(0, 10)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="district" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", color: "#0f172a", fontSize: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                        formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Total Premium"]}
                      />
                      <Bar dataKey="totalPremium" name="District Premium" fill="#1e40af" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── 6. DATA TABLES (SEARCH, FILTERS, CSV EXPORT) ────────── */}
          {(activeNav === "dashboard" || activeNav === "users" || activeNav === "assessments") && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              {/* Table Switcher & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setTableTab("assessments")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      tableTab === "assessments"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Recent Assessments ({data?.recentAssessments?.length || 0})
                  </button>

                  <button
                    onClick={() => setTableTab("users")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      tableTab === "users"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    User Registrations ({data?.recentRegistrations?.length || 0})
                  </button>
                </div>

                {/* Filters */}
                {tableTab === "assessments" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={assessmentSearchQuery}
                        onChange={(e) => setAssessmentSearchQuery(e.target.value)}
                        placeholder="Search ID, farmer, crop…"
                        className="rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600"
                      />
                    </div>

                    <select
                      value={assessmentRiskFilter}
                      onChange={(e) => setAssessmentRiskFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                    >
                      <option value="ALL">All Risk Levels</option>
                      <option value="LOW">Low Risk</option>
                      <option value="MODERATE">Moderate Risk</option>
                      <option value="HIGH">High Risk</option>
                    </select>

                    <select
                      value={assessmentStatusFilter}
                      onChange={(e) => setAssessmentStatusFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search name, phone, district…"
                        className="rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600"
                      />
                    </div>

                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="FARMER">Farmers Only</option>
                      <option value="INSURANCE">Insurance Companies Only</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Table Body */}
              <div className="mt-3 overflow-x-auto">
                {tableTab === "assessments" ? (
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Policy ID</th>
                        <th className="py-2.5 px-3">Farmer</th>
                        <th className="py-2.5 px-3">Crop</th>
                        <th className="py-2.5 px-3">District</th>
                        <th className="py-2.5 px-3">Risk Level</th>
                        <th className="py-2.5 px-3">Est. Premium</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAssessments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            No matching assessment records found.
                          </td>
                        </tr>
                      ) : (
                        filteredAssessments.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 font-mono font-semibold text-blue-900">{a.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{a.farmerName}</td>
                            <td className="py-2.5 px-3 text-slate-700">{a.crop}</td>
                            <td className="py-2.5 px-3 text-slate-500">{a.district}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  a.riskLevel === "High"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : a.riskLevel === "Moderate"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {a.riskLevel} ({a.riskScorePct}%)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              ₹{a.recommendedPremium?.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  a.status.toLowerCase() === "approved"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : a.status.toLowerCase() === "rejected"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {a.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400">
                              {new Date(a.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Account ID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Organization</th>
                        <th className="py-2.5 px-3">District</th>
                        <th className="py-2.5 px-3 text-right">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No matching user accounts found.
                          </td>
                        </tr>
                      ) : (
                        filteredRegistrations.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 font-mono text-slate-500">{u.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{u.name}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  u.type === "Farmer"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {u.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{u.phone}</td>
                            <td className="py-2.5 px-3 text-slate-700">{u.organization}</td>
                            <td className="py-2.5 px-3 text-slate-500">{u.region}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400">
                              {new Date(u.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── 7. SETTINGS SECTION ─────────────────────────────────── */}
          {activeNav === "settings" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs max-w-2xl space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Platform Settings & Security</h2>
                <p className="text-xs text-slate-500">AgriSurge administrative account credentials & system status</p>
              </div>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between pt-3">
                  <span className="font-medium text-slate-600">Admin Username</span>
                  <span className="font-mono font-semibold text-slate-900">{adminUser?.username || "admin"}</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="font-medium text-slate-600">Administrator Role</span>
                  <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <CheckCircle2 size={12} />
                    Super Administrator
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="font-medium text-slate-600">Database Connection</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Database size={12} />
                    Neon PostgreSQL (Active)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="font-medium text-slate-600">Authentication Mode</span>
                  <span className="text-slate-700 font-mono">PBKDF2 Salted Hash · Signed JWT Cookie</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign Out of Admin Console</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
