import { Query } from "node-appwrite";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, authCookieName } from "@/lib/auth";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { userId: string; secret: string };

    if (!body.userId || !body.secret) {
      return NextResponse.json({ error: "Missing verification token" }, { status: 400 });
    }

    const { account, users, databases } = getAdminClient();

    // Complete the verification with the admin API key. Doing this server-side
    // (instead of the browser SDK) avoids the "guests missing scope" error you
    // get when the link is opened in a browser with no active Appwrite session,
    // e.g. clicking the link from an email client on a fresh tab/device.
    await account.updateVerification(body.userId, body.secret);

    const user = await users.get(body.userId);

    const profile = await databases.listDocuments(
      env.databaseId,
      env.collections.usersProfiles,
      [Query.equal("userId", body.userId), Query.limit(1)]
    );

    const role = (profile.documents[0]?.role as "admin" | "user" | undefined) ?? "user";
    const token = await createSessionToken({
      userId: body.userId,
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
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400 }
    );
  }
}