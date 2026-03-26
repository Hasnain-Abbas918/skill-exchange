import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/create-bid", "/messages", "/profile", "/admin", "/settings", "/browse"];
const authRoutes = ["/login", "/register", "/forgot-password"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  if (isProtected && !token) return NextResponse.redirect(new URL("/login", req.url));

  const isAuth = authRoutes.some((r) => pathname.startsWith(r));
  if (isAuth && token) return NextResponse.redirect(new URL("/dashboard", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/create-bid/:path*", "/messages/:path*",
    "/profile/:path*", "/admin/:path*", "/settings/:path*",
    "/browse/:path*", "/login", "/register", "/forgot-password",
  ],
};