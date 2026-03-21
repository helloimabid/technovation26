import { Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/api-auth";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;

  try {
    const rawIds = req.nextUrl.searchParams.get("ids") ?? "";
    const ids = Array.from(
      new Set(
        rawIds
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      )
    ).slice(0, 20);

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    const { databases } = getAdminClient();
    const result = await databases.listDocuments(env.databaseId, env.collections.usersProfiles, [
      Query.equal("userId", ids),
      Query.limit(ids.length),
    ]);

    return NextResponse.json(serialize(result.documents));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}