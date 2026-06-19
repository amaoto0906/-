import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type Role = "admin" | "worker" | "viewer";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * セッション必須。なければ /login にリダイレクト。
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const u = session.user as { id?: string; email?: string; name?: string; role?: string };
  return {
    id: u.id ?? "",
    email: u.email ?? "",
    name: u.name ?? "",
    role: (u.role as Role) ?? "viewer",
  };
}

/**
 * 指定ロールのいずれかが必要。なければ /403 にリダイレクト。
 */
export async function requireRole(...allowed: Role[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!allowed.includes(user.role)) redirect("/403");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole("admin");
}

export async function requireWorkerOrAdmin(): Promise<SessionUser> {
  return requireRole("admin", "worker");
}

export function canEdit(role: Role): boolean {
  return role === "admin" || role === "worker";
}

export function canManageMasters(role: Role): boolean {
  return role === "admin";
}

export function canDelete(role: Role): boolean {
  return role === "admin";
}
