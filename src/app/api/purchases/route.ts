import { ID, Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/api-auth";

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

export async function GET() {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;

  try {
    const { databases } = getAdminClient();
    const purchases = await databases.listDocuments(env.databaseId, env.collections.purchases, [
      Query.equal("userId", auth.session.userId),
    ]);
    return NextResponse.json(serialize(purchases.documents));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (/collection|database|not found/i.test(message)) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;

  try {
    const body = (await req.json()) as { packageId: string; paymentTransactionId?: string };
    if (!body.packageId) {
      return NextResponse.json({ error: "Missing packageId" }, { status: 400 });
    }

    const paymentTransactionId = String(body.paymentTransactionId ?? "").trim();

    const { databases } = getAdminClient();

    const packageDoc = await databases.getDocument(
      env.databaseId,
      env.collections.packages,
      body.packageId
    ) as unknown as Record<string, unknown>;

    const packagePrice = Number(packageDoc.price ?? 0);
    const packageBkashNumber = String(packageDoc.bkashNumber ?? "").trim();

    if (packagePrice > 0) {
      if (!packageBkashNumber) {
        return NextResponse.json({ error: "Package payment is not configured yet." }, { status: 400 });
      }

      if (paymentTransactionId.length < 6) {
        return NextResponse.json({ error: "Please provide a valid bKash transaction ID." }, { status: 400 });
      }
    }

    const exists = await databases.listDocuments(env.databaseId, env.collections.purchases, [
      Query.equal("userId", auth.session.userId),
      Query.equal("packageId", body.packageId),
      Query.limit(1),
    ]);

    if (exists.total) {
      return NextResponse.json({ error: "Already purchased" }, { status: 409 });
    }

    const created = await databases.createDocument(
      env.databaseId,
      env.collections.purchases,
      ID.unique(),
      {
        userId: auth.session.userId,
        packageId: body.packageId,
        paymentTransactionId: paymentTransactionId || undefined,
      }
    );

    const includedSegmentIds = parseIncludedSegmentIds(packageDoc.includedSegmentIds);

    return NextResponse.json(
      serialize({
        ...created,
        unlockedSegmentIds: includedSegmentIds,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (/collection|database|not found/i.test(message)) {
      return NextResponse.json({ error: "Purchases are not enabled." }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
