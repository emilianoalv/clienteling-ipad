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
    { id: "samples", href: "/ba/samples", labelKey: "rail.samples", icon: "gift" },
    { id: "followup", href: "/ba/followup", labelKey: "rail.followup", icon: "message" },
    { id: "performance", href: "/ba/performance", labelKey: "rail.perf", icon: "chart" },
  ],
  Manager: [
    { id: "home", href: "/manager", labelKey: "rail.home", icon: "home" },
    { id: "team", href: "/manager/team", labelKey: "rail.team", icon: "users" },
    { id: "segments", href: "/manager/segments", labelKey: "rail.segments", icon: "chart" },
    { id: "appointments", href: "/manager/appointments", labelKey: "rail.appointments", icon: "calendar" },
    { id: "devices", href: "/manager/devices", labelKey: "rail.devices", icon: "device" },
    { id: "reports", href: "/manager/reports", labelKey: "rail.reports", icon: "pdf" },
  ],
  Supervisor: [
    { id: "home", href: "/supervisor", labelKey: "rail.home", icon: "home" },
    { id: "stores", href: "/supervisor/stores", labelKey: "rail.stores", icon: "device" },
    { id: "reports", href: "/supervisor/reports", labelKey: "rail.reports", icon: "pdf" },
    { id: "tickets", href: "/supervisor/tickets", labelKey: "rail.tickets", icon: "ticket" },
  ],
  HQ: [
    { id: "home", href: "/hq", labelKey: "rail.home", icon: "home" },
    { id: "stores", href: "/hq/stores", labelKey: "rail.stores", icon: "device" },
    { id: "catalog", href: "/hq/catalog", labelKey: "rail.catalog", icon: "bag" },
    { id: "devices", href: "/hq/devices", labelKey: "rail.devices", icon: "device" },
    { id: "reports", href: "/hq/reports", labelKey: "rail.reports", icon: "pdf" },
    { id: "integrations", href: "/hq/integrations", labelKey: "rail.integrations", icon: "plug" },
  ],
  Admin: [
    { id: "home", href: "/admin", labelKey: "rail.home", icon: "home" },
    { id: "users", href: "/admin/users", labelKey: "rail.users", icon: "users" },
    { id: "segments", href: "/admin/segments", labelKey: "rail.segments", icon: "chart" },
    { id: "integrations", href: "/admin/integrations", labelKey: "rail.integrations", icon: "plug" },
    { id: "reports", href: "/admin/reports", labelKey: "rail.reports", icon: "pdf" },
    { id: "audit", href: "/admin/audit", labelKey: "rail.audit", icon: "shield" },
  ],
};
