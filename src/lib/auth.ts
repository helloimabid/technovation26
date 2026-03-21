import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Role } from "@/types/models";

const COOKIE_NAME = "tv26_session";

function getSecretKey() {
  return new TextEncoder().encode(env.jwtSecret);
}

export async function createSessionToken(payload: {
  userId: string;
  role: Role;
  email: string;
  name: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey());
  return payload as {
    userId: string;
    role: Role;
    email: string;
    name: string;
  };
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export const authCookieName = COOKIE_NAME;
