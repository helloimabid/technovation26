import { ID } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { requireAdmin } from "@/lib/api-auth";
import { env } from "@/lib/env";
import { segmentSchema } from "@/lib/schemas";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function GET() {
  try {
    const { databases } = getAdminClient();
    const data = await databases.listDocuments(env.databaseId, env.collections.segments);
    return NextResponse.json(serialize(data.documents));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const parsed = segmentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { databases } = getAdminClient();
    const created = await databases.createDocument(
      env.databaseId,
      env.collections.segments,
      ID.unique(),
      parsed.data
    );

    return NextResponse.json(serialize(created));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
