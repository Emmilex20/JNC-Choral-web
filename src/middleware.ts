import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isAdminRoute = pathname.startsWith("/admin");
    const role = req.nextauth?.token?.role as string | undefined;

    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
