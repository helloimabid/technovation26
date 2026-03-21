import { Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";
import { requireAdmin } from "@/lib/api-auth";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { databases } = getAdminClient();
    const data = await databases.listDocuments(env.databaseId, env.collections.ambassadors, [
      Query.orderDesc("$createdAt"),
    ]);
    return NextResponse.json(serialize(data.documents));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as { id: string; status: "approved" | "rejected" };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { databases } = getAdminClient();
    const updated = await databases.updateDocument(env.databaseId, env.collections.ambassadors, body.id, {
      status: body.status,
    });

    return NextResponse.json(serialize(updated));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
