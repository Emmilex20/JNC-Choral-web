import type { Session } from "next-auth";

type AdminSession = Session & {
  user: Session["user"] & {
    id: string;
    role: "ADMIN";
  };
};

export function isAdminSession(session: Session | null): session is AdminSession {
  return session?.user?.role === "ADMIN" && Boolean(session.user.id);
}
