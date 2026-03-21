import { Query } from "node-appwrite";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, authCookieName } from "@/lib/auth";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { userId: string; email: string; name: string };

    if (!body.userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { databases } = getAdminClient();
    const profile = await databases.listDocuments(
      env.databaseId,
      env.collections.usersProfiles,
      [Query.equal("userId", body.userId), Query.limit(1)]
    );

    const role = (profile.documents[0]?.role as "admin" | "user" | undefined) ?? "user";
    const token = await createSessionToken({
      userId: body.userId,
      email: body.email ?? "",
      name: body.name ?? "",
      role,
    });

    const store = await cookies();
    store.set(authCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set session" },
      { status: 500 }
    );
  }
}
