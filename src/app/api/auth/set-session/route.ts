import { Query } from "node-appwrite";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, authCookieName } from "@/lib/auth";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { userId?: string };

    if (!body.userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const { users, databases } = getAdminClient();

    // Source of truth is the admin API, not whatever the client claims.
    const user = await users.get(body.userId);

    if (!user.emailVerification) {
      return NextResponse.json(
        { error: "Email not verified yet" },
        { status: 403 }
      );
    }

    const profile = await databases.listDocuments(
      env.databaseId,
      env.collections.usersProfiles,
      [Query.equal("userId", body.userId), Query.limit(1)]
    );

    const role = (profile.documents[0]?.role as "admin" | "user" | undefined) ?? "user";
    const token = await createSessionToken({
      userId: user.$id,
      email: user.email ?? "",
      name: user.name ?? "",
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
      { error: error instanceof Error ? error.message : "Failed to start session" },
      { status: 400 }
    );
  }
}