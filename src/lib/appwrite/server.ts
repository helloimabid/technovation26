import { Client, Databases, Users } from "node-appwrite";
import { env } from "@/lib/env";

export function getAdminClient() {
  const client = new Client()
    .setEndpoint(env.endpoint)
    .setProject(env.projectId)
    .setKey(env.apiKey);

  return {
    client,
    databases: new Databases(client),
    users: new Users(client),
  };
}
