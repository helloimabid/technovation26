import { NextRequest, NextResponse } from "next/server";
import { authCookieName, verifySessionToken } from "@/lib/auth";

const protectedPaths = ["/dashboard", "/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAdminPath = pathname.startsWith("/admin");

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get(authCookieName)?.value;
  if (!token) {
    // For /admin we allow the page to load and refresh the cookie from Appwrite client session.
    if (isAdminPath) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const session = await verifySessionToken(token);

    if (pathname.startsWith("/admin") && session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
