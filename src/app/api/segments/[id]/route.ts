import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { requireAdmin } from "@/lib/api-auth";
import { env } from "@/lib/env";
import { segmentSchema } from "@/lib/schemas";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const parsed = segmentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { id } = await params;
    const { databases } = getAdminClient();
    const updated = await databases.updateDocument(
      env.databaseId,
      env.collections.segments,
      id,
      parsed.data
    );

    return NextResponse.json(serialize(updated));
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
    await databases.deleteDocument(env.databaseId, env.collections.segments, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
