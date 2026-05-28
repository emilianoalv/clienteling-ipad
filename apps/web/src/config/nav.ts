import type { IconName } from "@/types/icon";
import type { Role } from "@/types/staff";

export interface NavItem {
  /** Stable id, used for highlighting active state when the URL changes. */
  id: string;
  /** Target URL (typed-routes safe). */
  href: string;
  /** i18n key consumed by Shell.Rail. */
  labelKey: string;
  icon: IconName;
}

export const NAV_BY_ROLE: Record<Role, readonly NavItem[]> = {
  BA: [
    { id: "home", href: "/ba", labelKey: "rail.home", icon: "home" },
    { id: "clients", href: "/ba/clients", labelKey: "rail.clients", icon: "users" },
    { id: "appointments", href: "/ba/appointments", labelKey: "rail.appointments", icon: "calendar" },
    { id: "catalog", href: "/ba/catalog", labelKey: "rail.catalog", icon: "bag" },
    { id: "purchases", href: "/ba/purchases", labelKey: "rail.purchases", icon: "ticket" },
    { id: "samples", href: "/ba/samples", labelKey: "rail.samples", icon: "gift" },
    { id: "followup", href: "/ba/followup", labelKey: "rail.followup", icon: "message" },
    { id: "performance", href: "/ba/performance", labelKey: "rail.perf", icon: "chart" },
  ],
  Gerente: [
    { id: "home", href: "/gerente", labelKey: "rail.home", icon: "home" },
    { id: "team", href: "/gerente/team", labelKey: "rail.team", icon: "users" },
    { id: "segments", href: "/gerente/segments", labelKey: "rail.segments", icon: "chart" },
    { id: "appointments", href: "/gerente/appointments", labelKey: "rail.appointments", icon: "calendar" },
    { id: "devices", href: "/gerente/devices", labelKey: "rail.devices", icon: "device" },
    { id: "reports", href: "/gerente/reports", labelKey: "rail.reports", icon: "pdf" },
  ],
  Supervisor: [
    { id: "home", href: "/supervisor", labelKey: "rail.home", icon: "home" },
    { id: "stores", href: "/supervisor/stores", labelKey: "rail.stores", icon: "bag" },
    { id: "appointments", href: "/supervisor/appointments", labelKey: "rail.appointments", icon: "calendar" },
    { id: "reports", href: "/supervisor/reports", labelKey: "rail.reports", icon: "pdf" },
  ],
  Admin: [
    { id: "home", href: "/admin", labelKey: "rail.home", icon: "home" },
    { id: "users", href: "/admin/users", labelKey: "rail.users", icon: "users" },
    { id: "stores", href: "/admin/stores", labelKey: "rail.stores", icon: "bag" },
    { id: "segments", href: "/admin/segments", labelKey: "rail.segments", icon: "chart" },
    { id: "integrations", href: "/admin/integrations", labelKey: "rail.integrations", icon: "plug" },
    { id: "privacy", href: "/admin/privacy", labelKey: "rail.privacy", icon: "shield" },
    { id: "reports", href: "/admin/reports", labelKey: "rail.reports", icon: "pdf" },
    { id: "audit", href: "/admin/audit", labelKey: "rail.audit", icon: "shield" },
  ],
};
