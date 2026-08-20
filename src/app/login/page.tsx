"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getAccount, } from "@/lib/appwrite/client";
import { loginSchema } from "@/lib/schemas";
import { z } from "zod";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Try to restore JWT from localStorage
        // const client = getClient();
        const storedJwt = localStorage.getItem("appwrite_jwt");
        if (storedJwt) {
          // const client = getClient();
          // client.setJWT(storedJwt);
        }
        const account = getAccount();
        const me = await account.get();
        if (me.emailVerification && mounted) {
          // An Appwrite session exists, but our own signed session cookie
          // (tv26_session) may not be set yet. Without this call, the
          // middleware keeps redirecting /dashboard -> /login -> /dashboard.
          const sessionRes = await fetch("/api/auth/set-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: me.$id, email: me.email, name: me.name }),
          });

          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (mounted) {
              router.replace(sessionData.role === "admin" ? "/admin" : "/dashboard");
            }
          } else {
            // Couldn't establish our own session; don't loop, let the user log in again.
            await account.deleteSession("current");
            if (mounted) setCheckingAuth(false);
          }
        } else {
          await account.deleteSession("current");
          if (mounted) setCheckingAuth(false);
        }
      } catch {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      const account = getAccount();
      await account.createEmailPasswordSession(values.email, values.password);

     

      const me = await account.get();

      if (!me.emailVerification) {
        await account.deleteSession("current");
        throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
      }

      const sessionRes = await fetch("/api/auth/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: me.$id, email: me.email, name: me.name }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error ?? "Session failed");

      toast.success("Welcome back");
      router.push(sessionData.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#06061b] text-white flex items-center justify-center">
        <p className="font-[var(--font-roboto-mono)] text-sm tracking-[0.25em] text-white/60 uppercase">Checking session</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06061b] text-white relative overflow-hidden flex flex-col">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[55%] bg-[#6972fd] opacity-10 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[50%] bg-[#25203A] opacity-40 blur-[120px] rounded-full pointer-events-none"></div>
      <Navbar />
      <div className="relative z-10 flex-1 w-full px-3 sm:px-6 py-8 sm:py-10 mt-14 md:mt-24 md:px-12">
        <div className="mx-auto w-full max-w-5xl grid lg:grid-cols-2 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <section className="hidden lg:flex flex-col justify-between p-10 bg-[radial-gradient(circle_at_20%_20%,rgba(105,114,253,0.22),transparent_45%),linear-gradient(160deg,#161224_0%,#0a0912_60%,#06061b_100%)] border-r border-white/10">
            <div>
              <p className="font-[var(--font-roboto-mono)] text-xs tracking-[0.28em] uppercase text-[#9ea4ff]">Tecnovation 2026</p>
              <h1 className="mt-4 font-[var(--font-anton)] text-6xl leading-[0.95] tracking-[0.06em]">Welcome Back</h1>
              <p className="mt-16 text-white/70 max-w-sm leading-relaxed">Sign in to manage your profile, registrations, and ambassador activity from your personalized dashboard.</p>
            </div>
          </section>

          <section className="p-5 sm:p-7 md:p-12 bg-[#0d0a17]/90">
            <div className="mb-8">
              <p className="font-[var(--font-roboto-mono)] text-[11px] tracking-[0.28em] uppercase text-white/50">Account Portal</p>
              <h2 className="font-[var(--font-anton)] text-5xl tracking-[0.04em] mt-2">Login</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30"
                />
                {errors.email && <p className="text-red-300 text-sm mt-2">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Password</label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30"
                />
                {errors.password && <p className="text-red-300 text-sm mt-2">{errors.password.message}</p>}
              </div>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#6972fd] to-[#5660f0] py-3.5 font-semibold uppercase text-sm tracking-[0.15em] text-white disabled:opacity-50 hover:brightness-110 transition"
              >
                {loading ? "Signing in..." : "Login"}
              </button>

              <p className="text-sm text-white/70">
                New here?{" "}
                <Link href="/register" className="text-white hover:text-[#9ea4ff] transition-colors underline underline-offset-4">
                  Create account
                </Link>
              </p>
            </form>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}