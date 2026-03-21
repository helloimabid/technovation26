import { ID } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { requireAdmin } from "@/lib/api-auth";
import { env } from "@/lib/env";
import { packageSchema } from "@/lib/schemas";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function parseIncludedSegmentIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
      return [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizePackage(doc: Record<string, unknown>) {
  return {
    ...doc,
    includedSegmentIds: parseIncludedSegmentIds(doc.includedSegmentIds),
  };
}

export async function GET() {
  try {
    const { databases } = getAdminClient();
    const data = await databases.listDocuments(env.databaseId, env.collections.packages);
    const docs = serialize(data.documents) as Record<string, unknown>[];
    return NextResponse.json(docs.map((doc) => normalizePackage(doc)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (/collection|database|not found/i.test(message)) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const parsed = packageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { databases } = getAdminClient();
    const created = await databases.createDocument(
      env.databaseId,
      env.collections.packages,
      ID.unique(),
      {
        ...parsed.data,
        includedSegmentIds: JSON.stringify(parsed.data.includedSegmentIds),
      }
    );

    const doc = serialize(created) as Record<string, unknown>;
    return NextResponse.json(normalizePackage(doc));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
