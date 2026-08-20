"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccount } from "@/lib/appwrite/client";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your email address...");

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const userId = params.get("userId");
      const secret = params.get("secret");

      if (!userId || !secret) {
        setStatus("error");
        setMessage("This verification link is incomplete or invalid.");
        return;
      }

      try {
        const account = getAccount();
        await account.updateEmailVerification(userId, secret);
        const me = await account.get();
        const sessionRes = await fetch("/api/auth/set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: me.$id, email: me.email, name: me.name }),
        });

        if (!sessionRes.ok) {
          const data = await sessionRes.json();
          throw new Error(data.error ?? "Failed to start your app session");
        }

        setStatus("success");
        setMessage("Your email is verified. Redirecting you to your dashboard...");
        const data = await sessionRes.json();
        window.setTimeout(() => router.replace(data.role === "admin" ? "/admin" : "/dashboard"), 900);
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Verification failed. Please request a new link.");
      }
    };

    void verify();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#06061b] text-white flex flex-col">
      <Navbar />
      <section className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0d0a17]/90 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-12">
          <p className="font-[var(--font-roboto-mono)] text-xs uppercase tracking-[0.28em] text-[#9ea4ff]">Tecnovation 2026</p>
          <h1 className="mt-4 font-[var(--font-anton)] text-5xl tracking-[0.04em]">Verify Email</h1>
          <p className={`mt-6 leading-relaxed ${status === "error" ? "text-red-200" : "text-white/70"}`}>{message}</p>
          {status === "error" && (
            <Link href="/login" className="mt-8 inline-block rounded-xl bg-[#6972fd] px-6 py-3 font-semibold uppercase tracking-[0.12em] transition hover:brightness-110">
              Return to login
            </Link>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
