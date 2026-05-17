import type { Role } from "@/types/staff";

export type Permission =
  | "clients:read"
  | "clients:write"
  | "purchases:read"
  | "purchases:write"
  | "appointments:read"
  | "appointments:write"
  | "communications:read"
  | "communications:write"
  | "templates:read"
  | "templates:write"
  | "recommendations:read"
  | "recommendations:write"
  | "reports:read"
  | "devices:read"
  | "devices:write"
  | "users:write"
  | "integrations:write"
  | "stores:write"
  | "admin:read";

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  BA: new Set<Permission>([
    "clients:read",
    "clients:write",
    "purchases:read",
    "purchases:write",
    "appointments:read",
    "appointments:write",
    "communications:read",
    "communications:write",
    "templates:read",
    "recommendations:read",
    "recommendations:write",
  ]),
  Gerente: new Set<Permission>([
    "clients:read",
    "clients:write",
    "purchases:read",
    "purchases:write",
    "appointments:read",
    "appointments:write",
    "communications:read",
    "communications:write",
    "templates:read",
    "templates:write",
    "recommendations:read",
    "recommendations:write",
    "reports:read",
    "devices:read",
    "devices:write",
  ]),
  Supervisor: new Set<Permission>([
    "clients:read",
    "clients:write",
    "appointments:read",
    "appointments:write",
    "communications:read",
    "templates:read",
    "templates:write",
    "recommendations:read",
    "reports:read",
  ]),
  Admin: new Set<Permission>([
    "clients:read",
    "clients:write",
    "purchases:read",
    "purchases:write",
    "appointments:read",
    "appointments:write",
    "communications:read",
    "communications:write",
    "templates:read",
    "templates:write",
    "recommendations:read",
    "recommendations:write",
    "reports:read",
    "devices:read",
    "devices:write",
    "users:write",
    "integrations:write",
    "stores:write",
    "admin:read",
  ]),
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function canAccessRolePrefix(role: Role, urlSegment: string): boolean {
  if (role === "Admin") return true;
  return role.toLowerCase() === urlSegment.toLowerCase();
}
