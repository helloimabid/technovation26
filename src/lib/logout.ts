// src/lib/logout.ts
"use client";

import { getAccount } from "@/lib/appwrite/client";

export async function logout(redirectTo = "/") {
  // 1. Delete the Appwrite browser session (the missing step → caused the loop)
  try {
    await getAccount().deleteSession("current");
  } catch {
    // No Appwrite session — fine
  }

  // 2. Clear the custom session cookie
  try {
    await fetch("/api/auth/clear-session", { method: "POST" });
  } catch {
    // ignore
  }

  // 3. Hard navigation so all client state is wiped
  window.location.href = redirectTo;
}