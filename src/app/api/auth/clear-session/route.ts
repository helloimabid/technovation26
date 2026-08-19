// src/app/api/auth/clear-session/route.ts
import { NextResponse } from "next/server";
import { authCookieName } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Important: path must match the one used when the cookie was SET
  res.cookies.set(authCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // expires immediately
  });

  return res;
}