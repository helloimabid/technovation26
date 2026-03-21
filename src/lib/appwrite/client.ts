"use client";

import { Account, Client, Databases, Storage } from "appwrite";
import { env } from "@/lib/env";

let client: Client | null = null;
let account: Account | null = null;
let databases: Databases | null = null;
let storage: Storage | null = null;

function getClient() {
        if (client) return client;

        if (!env.endpoint || !env.projectId) {
                throw new Error("Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID");
        }

        client = new Client().setEndpoint(env.endpoint).setProject(env.projectId);
        return client;
}

export function getAccount() {
        if (!account) {
                account = new Account(getClient());
        }
        return account;
}

export function getDatabases() {
        if (!databases) {
                databases = new Databases(getClient());
        }
        return databases;
}

export function getStorage() {
        if (!storage) {
                storage = new Storage(getClient());
        }
        return storage;
}
