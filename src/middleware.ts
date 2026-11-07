import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedPrefixes = ["/dashboard", "/admin"];
const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes from intl
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const localeMatch = pathname.match(/^\/(ar|en)(?=\/|$)/);
  const locale = localeMatch?.[1] || routing.defaultLocale;
  const pathWithoutLocale = localeMatch
    ? pathname.slice(locale.length + 1) || "/"
    : pathname;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isProtected = protectedPrefixes.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );
  const isAuthPage = authPages.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );
  const isAdmin = pathWithoutLocale === "/admin" || pathWithoutLocale.startsWith("/admin/");

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin && token && token.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
