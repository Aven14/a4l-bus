import type { UserRole } from "@prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  CIVIL: "Civil",
  DRIVER: "Chauffeur",
  CONTROLLER: "Contrôleur",
  ADMIN: "Administrateur",
};

export const ASSIGNABLE_ROLES: UserRole[] = [
  "CIVIL",
  "DRIVER",
  "CONTROLLER",
  "ADMIN",
];

export function hasRole(userRoles: UserRole[], role: UserRole): boolean {
  return userRoles.includes(role);
}

export function hasAnyRole(
  userRoles: UserRole[],
  required: UserRole[]
): boolean {
  return required.some((r) => userRoles.includes(r));
}

export function getLoginRedirect(roles: UserRole[]): string {
  if (hasRole(roles, "ADMIN")) return "/admin";
  if (hasRole(roles, "DRIVER")) return "/chauffeur";
  if (hasRole(roles, "CONTROLLER")) return "/controleur";
  return "/espace-personnel";
}

export function formatRoles(roles: UserRole[]): string {
  return roles.map((r) => ROLE_LABELS[r]).join(", ");
}
