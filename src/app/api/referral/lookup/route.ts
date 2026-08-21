import { Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false, error: "Missing code" }, { status: 400 });
  }

  try {
    const { databases } = getAdminClient();

    const ambassador = await databases.listDocuments(env.databaseId, env.collections.ambassadors, [
      Query.equal("caCode", code),
      Query.limit(1),
    ]);

    if (ambassador.total > 0) {
      const doc = ambassador.documents[0];
      let name = "";
      const profile = await databases.listDocuments(env.databaseId, env.collections.usersProfiles, [
        Query.equal("userId", String(doc.userId ?? "")),
        Query.limit(1),
      ]);
      if (profile.total > 0 && profile.documents[0].name) {
        name = String(profile.documents[0].name);
      }
      return NextResponse.json({ valid: true, type: "ca", name });
    }

    const clubPartner = await databases.listDocuments(env.databaseId, env.collections.clubPartners, [
      Query.equal("clubCode", code),
      Query.limit(1),
    ]);

    if (clubPartner.total > 0) {
      const doc = clubPartner.documents[0] as unknown as Record<string, unknown>;
      const name = String(doc.clubName ?? "").trim();
      return NextResponse.json({ valid: true, type: "club", name });
    }

    return NextResponse.json({ valid: false }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
