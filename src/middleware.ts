import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { buildCsp, getCspMode } from "@/lib/csp";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    });
    if (token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  // Per-request nonce so inline scripts are only allowed when Next.js emits them.
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const headerName =
    getCspMode() === "enforce"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(headerName, csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set(headerName, csp);
  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|svg|webp|ico|gif|pdf|txt|xml)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
