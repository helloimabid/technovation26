// lib/db.ts
import { ID } from "node-appwrite";
import { getAdminClient } from "./appwrite/server";
import { env } from "./env";

export interface ContactMessageInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function createContactMessage(data: ContactMessageInput) {
  const { databases } = getAdminClient();
  const doc = await databases.createDocument(
    env.databaseId,
    env.collections.contactMessages,
    ID.unique(),
    {
      name: data.name.trim(),
      email: data.email.trim(),
      subject: data.subject?.trim() || null,
      message: data.message.trim(),
      status: "new", // default status
      createdAt: new Date().toISOString(), // optional, Appwrite also provides $createdAt
    }
  );
  return doc;
}