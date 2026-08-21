import { ID, Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";

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
      // Match on the code alone — CA codes exist as soon as someone applies,
      // well before an admin approves them, so credit the referral either way.
      const ambassador = await databases.listDocuments(
        env.databaseId,
        env.collections.ambassadors,
        [Query.equal("caCode", body.referralCode), Query.limit(1)]
      );

      if (ambassador.total) {
        const doc = ambassador.documents[0];
        await databases.updateDocument(env.databaseId, env.collections.ambassadors, doc.$id, {
          points: Number(doc.points ?? 0) + 10,
          referralsCount: Number(doc.referralsCount ?? 0) + 1,
        });
      }
    }

    if (body.clubPartnerCode) {
      const clubPartner = await databases.listDocuments(
        env.databaseId,
        env.collections.clubPartners,
        [Query.equal("clubCode", body.clubPartnerCode), Query.limit(1)]
      );

      if (clubPartner.total) {
        const doc = clubPartner.documents[0];
        await databases.updateDocument(env.databaseId, env.collections.clubPartners, doc.$id, {
          points: Number(doc.points ?? 0) + 10,
          referralsCount: Number(doc.referralsCount ?? 0) + 1,
        });
      }
    }

    // NOTE: no more auto-creating an ambassadors doc here.
    // A user only gets an ambassador record when they explicitly
    // hit "Apply for CA" — see /api/ambassadors/apply.

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to init profile" },
      { status: 500 }
    );
  }
}