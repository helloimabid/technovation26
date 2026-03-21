import { Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/api-auth";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function GET() {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;

  try {
    const { databases } = getAdminClient();
    const profile = await databases.listDocuments(env.databaseId, env.collections.usersProfiles, [
      Query.equal("userId", auth.session.userId),
      Query.limit(1),
    ]);

    const doc = profile.documents[0];
    return NextResponse.json(doc ? serialize(doc) : null);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;

  try {
    const body = (await req.json()) as {
      name?: string;
      institution?: string;
      phone?: string;
      address?: string;
      classLevel?: string;
      fbLink?: string;
      profilePicId?: string;
    };

    const { databases } = getAdminClient();
    const profile = await databases.listDocuments(env.databaseId, env.collections.usersProfiles, [
      Query.equal("userId", auth.session.userId),
      Query.limit(1),
    ]);

    if (!profile.total) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const current = profile.documents[0];
    const payload: Record<string, string> = {
      name: body.name ?? current.name ?? "",
      institution: body.institution ?? current.institution ?? "",
      phone: body.phone ?? current.phone ?? "",
      address: body.address ?? current.address ?? "",
      classLevel: body.classLevel ?? current.classLevel ?? "",
      fbLink: body.fbLink ?? current.fbLink ?? "",
      profilePicId: body.profilePicId ?? current.profilePicId ?? "",
    };

    const updated = await databases.updateDocument(
      env.databaseId,
      env.collections.usersProfiles,
      current.$id,
      payload
    );

    return NextResponse.json(serialize(updated));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
