import { ID, Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";
import { contentBlockSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/api-auth";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function GET() {
  try {
    const { databases } = getAdminClient();
    const data = await databases.listDocuments(env.databaseId, env.collections.contentBlocks);
    return NextResponse.json(serialize(data.documents));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const parsed = contentBlockSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { databases } = getAdminClient();
    const existing = await databases.listDocuments(env.databaseId, env.collections.contentBlocks, [
      Query.equal("key", parsed.data.key),
      Query.limit(1),
    ]);

    if (existing.total) {
      const updated = await databases.updateDocument(
        env.databaseId,
        env.collections.contentBlocks,
        existing.documents[0].$id,
        parsed.data
      );
      return NextResponse.json(serialize(updated));
    }

    const created = await databases.createDocument(
      env.databaseId,
      env.collections.contentBlocks,
      ID.unique(),
      parsed.data
    );

    return NextResponse.json(serialize(created));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
