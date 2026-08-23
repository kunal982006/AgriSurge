export type NavItem = {
  label: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview" },
  { label: "Risk Analysis", href: "/risk-analysis" },
  { label: "Farm Map", href: "/farm-map" },
  { label: "Policies", href: "/policies" },
  { label: "Reports & Analytics", href: "/reports" },
  { label: "Notifications", href: "/notifications" },
  { label: "Settings", href: "/settings" },
];
