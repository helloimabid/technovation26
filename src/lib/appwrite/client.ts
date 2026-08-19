// src/lib/appwrite/client.ts
import { Account, Client, Storage } from "appwrite";
import { env } from "@/lib/env";

let client: Client | null = null;

function getClient() {
  if (!client) {
    client = new Client()
      .setEndpoint(env.endpoint)
      .setProject(env.projectId);
  }
  return client;
}

export function getAccount() {
  return new Account(getClient());
}

export function getStorage() {
  return new Storage(getClient());
}