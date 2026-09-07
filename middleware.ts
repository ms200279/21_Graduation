import { NextResponse, type NextRequest } from "next/server";

/**
 * TEMP production-only lock: every page except `/` redirects to the landing.
 * Delete this file together with `app/components/LandingDeployClickBlock.tsx`.
 */
const STATIC_PREFIXES = ["/_next", "/images", "/fonts", "/favicon"];
const STATIC_FILE = /\.(?:avif|css|gif|ico|jpe?g|js|map|png|svg|webm|webp|woff2?)$/i;

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (
    STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    STATIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
