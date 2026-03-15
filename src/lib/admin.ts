import { User } from "lucia";

export function isAdmin(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export function requireAdmin(user: User | null): void {
  if (!user || !isAdmin(user)) {
    throw new Error("Unauthorized: Admin access required");
  }
}

export function assertAdmin(user: User | null): asserts user is User {
  requireAdmin(user);
}
