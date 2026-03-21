import { ID, Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";
import { registrationSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/api-auth";
import { Segment } from "@/types/models";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function parseAdditionalFormData(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function extractTeamMemberIds(doc: { additionalFormData?: unknown; teamMemberUserIds?: unknown }): string[] {
  if (Array.isArray(doc.teamMemberUserIds)) {
    return doc.teamMemberUserIds.map((value) => String(value));
  }

  if (typeof doc.additionalFormData === "string") {
    const parsed = parseAdditionalFormData(doc.additionalFormData);
    if (Array.isArray(parsed.teamMemberUserIds)) {
      return parsed.teamMemberUserIds.map((value) => String(value));
    }
  }

  return [];
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
    if (auth.session.role === "admin") {
      const data = await databases.listDocuments(env.databaseId, env.collections.registrations);
      return NextResponse.json(serialize(data.documents));
    }

    const [asOwner, allRegistrations] = await Promise.all([
      databases.listDocuments(env.databaseId, env.collections.registrations, [
        Query.equal("userId", auth.session.userId),
      ]),
      databases.listDocuments(env.databaseId, env.collections.registrations),
    ]);

    const asMember = allRegistrations.documents.filter((doc) => {
      const teamMemberIds = extractTeamMemberIds({
        additionalFormData: doc.additionalFormData,
        teamMemberUserIds: doc.teamMemberUserIds,
      });
      return teamMemberIds.includes(auth.session.userId);
    });

    const merged = new Map<string, unknown>();
    for (const doc of [...asOwner.documents, ...asMember]) {
      merged.set(doc.$id, doc);
    }

    return NextResponse.json(serialize(Array.from(merged.values())));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;

  try {
    const parsed = registrationSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { databases } = getAdminClient();
    const segmentDoc = await databases.getDocument(env.databaseId, env.collections.segments, parsed.data.segmentId);
    const segment = serialize(segmentDoc) as unknown as Segment;

    const normalizedTeamMemberUserIds = Array.from(
      new Set(
        parsed.data.teamMemberUserIds
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      )
    );

    if (segment.isTeamEvent) {
      if (!parsed.data.teamName || parsed.data.teamName.trim() === "") {
        return NextResponse.json({ error: "Team name is required for team events" }, { status: 400 });
      }

      if (normalizedTeamMemberUserIds.length === 0) {
        return NextResponse.json({ error: "At least one team member user ID is required" }, { status: 400 });
      }

      const teamMemberLimit = Number(segment.teamMemberLimit ?? 0);
      if (teamMemberLimit > 0 && normalizedTeamMemberUserIds.length > teamMemberLimit) {
        return NextResponse.json(
          { error: `Maximum ${teamMemberLimit} team members are allowed for this segment` },
          { status: 400 }
        );
      }

      if (normalizedTeamMemberUserIds.includes(auth.session.userId)) {
        return NextResponse.json({ error: "Do not include your own user ID in team members" }, { status: 400 });
      }

      const memberProfiles = await databases.listDocuments(env.databaseId, env.collections.usersProfiles, [
        Query.equal("userId", normalizedTeamMemberUserIds),
        Query.limit(normalizedTeamMemberUserIds.length),
      ]);

      const existingMemberIds = new Set(memberProfiles.documents.map((doc) => String(doc.userId)));
      const missingIds = normalizedTeamMemberUserIds.filter((memberId) => !existingMemberIds.has(memberId));
      if (missingIds.length > 0) {
        return NextResponse.json(
          { error: `These user IDs do not exist: ${missingIds.join(", ")}` },
          { status: 400 }
        );
      }
    } else if (normalizedTeamMemberUserIds.length > 0) {
      return NextResponse.json({ error: "Team members can only be added for team events" }, { status: 400 });
    }

    const paymentTransactionId = (parsed.data.paymentTransactionId ?? "").trim();
    let packageCoverage: { packageId: string; packageName: string } | null = null;

    if (segment.isPaid) {
      const purchases = await databases.listDocuments(env.databaseId, env.collections.purchases, [
        Query.equal("userId", auth.session.userId),
      ]);

      if (purchases.total > 0) {
        const purchasedPackageIds = purchases.documents.map((doc) => String(doc.packageId));
        const packageDocs = await databases.listDocuments(env.databaseId, env.collections.packages, [
          Query.equal("$id", purchasedPackageIds),
        ]);

        const found = packageDocs.documents.find((pkg) => {
          const included = parseIncludedSegmentIds((pkg as unknown as Record<string, unknown>).includedSegmentIds);
          return included.includes(parsed.data.segmentId);
        });

        if (found) {
          packageCoverage = {
            packageId: String(found.$id),
            packageName: String((found as unknown as Record<string, unknown>).name ?? "Package"),
          };
        }
      }
    }

    if (segment.isPaid) {
      if (!packageCoverage && (!segment.bkashNumber || segment.bkashNumber.trim() === "")) {
        return NextResponse.json({ error: "This paid segment has no bKash number configured by admin" }, { status: 400 });
      }

      if (!packageCoverage && paymentTransactionId.length < 6) {
        return NextResponse.json({ error: "Transaction ID is required for paid segments" }, { status: 400 });
      }
    }

    const exists = await databases.listDocuments(env.databaseId, env.collections.registrations, [
      Query.equal("userId", auth.session.userId),
      Query.equal("segmentId", parsed.data.segmentId),
      Query.limit(1),
    ]);

    if (exists.total) {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }

    const additionalFormData = parseAdditionalFormData(parsed.data.additionalFormData);
    if (normalizedTeamMemberUserIds.length > 0) {
      additionalFormData.teamMemberUserIds = normalizedTeamMemberUserIds;
    }
    if (packageCoverage) {
      additionalFormData.source = "package";
      additionalFormData.packageId = packageCoverage.packageId;
      additionalFormData.packageName = packageCoverage.packageName;
    }

    const created = await databases.createDocument(
      env.databaseId,
      env.collections.registrations,
      ID.unique(),
      {
        userId: auth.session.userId,
        segmentId: parsed.data.segmentId,
        teamName: segment.isTeamEvent ? parsed.data.teamName?.trim() ?? "" : "",
        paymentTransactionId: packageCoverage ? "" : paymentTransactionId,
        status: packageCoverage ? "approved" : "pending",
        additionalFormData: JSON.stringify(additionalFormData),
      }
    );

    return NextResponse.json(serialize(created));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;
  if (auth.session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as { id?: string; status?: "approved" | "disapproved" };
    if (!body.id || !body.status || !["approved", "disapproved"].includes(body.status)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const { databases } = getAdminClient();
    const updated = await databases.updateDocument(
      env.databaseId,
      env.collections.registrations,
      body.id,
      { status: body.status }
    );

    return NextResponse.json(serialize(updated));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error || !auth.session) return auth.error;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { databases } = getAdminClient();
    const doc = await databases.getDocument(env.databaseId, env.collections.registrations, id);

    if (auth.session.role !== "admin" && doc.userId !== auth.session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await databases.deleteDocument(env.databaseId, env.collections.registrations, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
