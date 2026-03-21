import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  return { error: null, session };
}

export async function requireAdmin() {
  const current = await requireUser();
  if (current.error || !current.session) {
    return current;
  }

  if (current.session.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return current;
}
