import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { requireAdmin } from "@/lib/api-auth";
import { env } from "@/lib/env";
import { packageSchema } from "@/lib/schemas";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const parsed = packageSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { id } = await params;
    const { databases } = getAdminClient();
    const updated = await databases.updateDocument(
      env.databaseId,
      env.collections.packages,
      id,
      {
        ...parsed.data,
        includedSegmentIds: JSON.stringify(parsed.data.includedSegmentIds),
      }
    );

    return NextResponse.json(normalizePackage(JSON.parse(JSON.stringify(updated)) as Record<string, unknown>));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { databases } = getAdminClient();
    await databases.deleteDocument(env.databaseId, env.collections.packages, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
