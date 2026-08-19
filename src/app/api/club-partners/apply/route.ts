import { ID, Query } from "node-appwrite";
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/api-auth";

function makeClubCode(name: string, seed: string) {
  const clean = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "CLUB";
  return `CP-${clean}-${seed.slice(-3).toUpperCase()}`;
}

export async function POST() {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;

  try {
    const { databases } = getAdminClient();

    // Check if submissions are open
    const settings = await databases.listDocuments(env.databaseId, env.collections.contentBlocks, [
      Query.equal("key", "clubPartnerSubmissionsOpen"),
      Query.limit(1),
    ]);
    const isOpen = settings.documents[0]?.value === "true";

    if (!isOpen) {
      return NextResponse.json({ error: "Club Partner submissions are currently closed." }, { status: 403 });
    }

    // Check if user already applied
    const existing = await databases.listDocuments(env.databaseId, env.collections.clubPartners, [
      Query.equal("userId", auth.session.userId),
      Query.limit(1),
    ]);
    if (existing.total > 0) {
      return NextResponse.json({ error: "You have already applied for Club Partner." }, { status: 409 });
    }

    // Get user profile for name
    const profile = await databases.listDocuments(env.databaseId, env.collections.usersProfiles, [
      Query.equal("userId", auth.session.userId),
      Query.limit(1),
    ]);
    const userName = profile.documents[0]?.name ?? auth.session.name ?? "User";

    const created = await databases.createDocument(
      env.databaseId,
      env.collections.clubPartners,
      ID.unique(),
      {
        userId: auth.session.userId,
        clubCode: makeClubCode(userName, auth.session.userId),
        points: 0,
        referralsCount: 0,
        status: "pending",
      }
    );

    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply" },
      { status: 500 }
    );
  }
}