import { ID, Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";

function makeCaCode(name: string, seed: string) {
  const clean = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "USER";
  return `TEC-${clean}-${seed.slice(-3).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      userId: string;
      name: string;
      email: string;
      institution: string;
      phone: string;
      address: string;
      classLevel: string;
      fbLink: string;
      profilePicId?: string;
      referralCode?: string;
      clubPartnerCode?: string;
    };

    const { databases } = getAdminClient();

    const existing = await databases.listDocuments(
      env.databaseId,
      env.collections.usersProfiles,
      [Query.equal("userId", body.userId), Query.limit(1)]
    );

    if (!existing.total) {
      await databases.createDocument(
        env.databaseId,
        env.collections.usersProfiles,
        ID.unique(),
        {
          userId: body.userId,
          name: body.name,
          email: body.email,
          institution: body.institution,
          phone: body.phone,
          address: body.address,
          classLevel: body.classLevel,
          fbLink: body.fbLink,
          profilePicId: body.profilePicId ?? "",
          role: "user",
          referredByCode: body.referralCode ?? "",
          clubPartnerCode: body.clubPartnerCode ?? "",
        }
      );
    }

    if (body.referralCode) {
      const ambassador = await databases.listDocuments(
        env.databaseId,
        env.collections.ambassadors,
        [Query.equal("caCode", body.referralCode), Query.equal("status", "approved"), Query.limit(1)]
      );

      if (ambassador.total) {
        const doc = ambassador.documents[0];
        await databases.updateDocument(env.databaseId, env.collections.ambassadors, doc.$id, {
          points: Number(doc.points ?? 0) + 10,
          referralsCount: Number(doc.referralsCount ?? 0) + 1,
        });
      }
    }

    const ambassadorExisting = await databases.listDocuments(
      env.databaseId,
      env.collections.ambassadors,
      [Query.equal("userId", body.userId), Query.limit(1)]
    );

    if (!ambassadorExisting.total) {
      await databases.createDocument(
        env.databaseId,
        env.collections.ambassadors,
        ID.unique(),
        {
          userId: body.userId,
          caCode: makeCaCode(body.name, body.userId),
          points: 0,
          referralsCount: 0,
          status: "pending",
        }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to init profile" },
      { status: 500 }
    );
  }
}
