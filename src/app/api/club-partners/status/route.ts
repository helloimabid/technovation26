import { Query } from "node-appwrite";
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;

  try {
    const { databases } = getAdminClient();
    const record = await databases.listDocuments(env.databaseId, env.collections.clubPartners, [
      Query.equal("userId", auth.session.userId),
      Query.limit(1),
    ]);
    const doc = record.documents[0];
    return NextResponse.json(doc ? JSON.parse(JSON.stringify(doc)) : null);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}