import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { hasLocalePrefix } from "./lib/locale-paths";

const VISITOR_COOKIE = "hc_visitor_id";
const PASSTHROUGH_PATHS = new Set(["/opengraph-image", "/twitter-image"]);
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  if (PASSTHROUGH_PATHS.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!hasLocalePrefix(request.nextUrl.pathname)) {
    const localizedUrl = request.nextUrl.clone();
    localizedUrl.pathname =
      request.nextUrl.pathname === "/"
        ? `/${routing.defaultLocale}`
        : `/${routing.defaultLocale}${request.nextUrl.pathname}`;

    return NextResponse.redirect(localizedUrl, 308);
  }

  const response = intlMiddleware(request);

  // Ensure every visitor has a stable ID for A/B theme testing
  if (!request.cookies.get(VISITOR_COOKIE)?.value) {
    const visitorId = crypto.randomUUID();
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|opengraph-image|twitter-image|.*\\..*).*)"],
};
