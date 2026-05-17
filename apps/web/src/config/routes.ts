import type { Role } from "@/types/staff";

export const routes = {
  login: "/login",
  home: {
    BA: "/ba",
    Gerente: "/gerente",
    Supervisor: "/supervisor",
    Admin: "/admin",
  },
} as const;

export function homeFor(role: Role): string {
  return routes.home[role];
}
