import type { Session } from "next-auth";

export function isAdminSession(session: Session | null) {
  return session?.user?.role === "ADMIN";
}
