"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ID } from "appwrite";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getAccount, getStorage } from "@/lib/appwrite/client";
import { signupSchema } from "@/lib/schemas";
import { env } from "@/lib/env";
import { z } from "zod";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

type FormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const account = getAccount();
        const me = await account.get();
        if (me.emailVerification && mounted) {
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
            await account.deleteSession("current");
            if (mounted) setCheckingAuth(false);
          }
        } else {
          await account.deleteSession("current");
          if (mounted) setCheckingAuth(false);
        }
      } catch {
        if (mounted) {
          const params = new URLSearchParams(window.location.search);
          const ref = params.get("ref") ?? localStorage.getItem("tv26_ref") ?? "";
          if (ref) {
            setReferralCode(ref);
            setValue("referralCode", ref);
          }
          setCheckingAuth(false);
        }
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 30 * 1024 * 1024) {
        toast.error("File size must be under 30MB");
        e.target.value = "";
        return;
      }
      setProfilePic(file);
    }
  };

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);

      if (!profilePic) {
        throw new Error("Please upload a profile picture.");
      }

      const account = getAccount();
      const storage = getStorage();

      // Create authentication account FIRST so they have the proper permissions to upload
      await account.create(ID.unique(), values.email, values.password, values.name);
      await account.createEmailPasswordSession(values.email, values.password);
      const me = await account.get();

      // Keep the Appwrite session for the verification callback, but do not
      // create the app session until the email has been verified.
      await account.createVerification(`${window.location.origin}/verify-email`);

      // Upload profile picture now that the session exists
      const fileUpload = await storage.createFile(
        env.bucketId || "profile_pics",
        ID.unique(),
        profilePic
      );

      // Register profile document with fileId
      const profileRes = await fetch("/api/profile/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: me.$id,
          name: values.name,
          email: values.email,
          institution: values.institution,
          phone: values.phone,
          address: values.address,
          classLevel: values.classLevel,
          fbLink: values.fbLink,
          referralCode: values.referralCode || referralCode || undefined,
          clubPartnerCode: values.clubPartnerCode || undefined,
          profilePicId: fileUpload.$id,
        }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error ?? "Failed to create profile");

      toast.success("Account created. Check your email to verify it.");
      router.push(`/verify-email?email=${encodeURIComponent(me.email)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed");
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
      <Navbar />
      <div className="absolute top-[-20%] left-[-8%] w-[55%] h-[55%] bg-[#6972fd] opacity-10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[45%] bg-[#25203A] opacity-40 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="relative z-10 flex-1 w-full px-6 py-10 mt-16 md:mt-24 md:px-12">
      <div className="mx-auto w-full max-w-6xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="grid xl:grid-cols-[1.2fr_1fr]">
          <section className="p-4 sm:p-7 md:p-12 bg-[#0d0a17]/90">
            <div className="mb-8">
              <p className="font-[var(--font-roboto-mono)] text-[11px] tracking-[0.28em] uppercase text-white/50">Account Creation</p>
              <h1 className="font-[var(--font-anton)] text-5xl tracking-[0.04em] mt-2">Register</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Profile Picture (JPG/PNG, Max 30MB)</label>
                <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[#6972fd] file:px-3 file:py-1.5 file:text-white hover:file:brightness-110" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input {...register("name")} placeholder="Full Name *" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" />
                  {errors.name && <p className="text-red-300 text-sm mt-2">{errors.name.message}</p>}
                </div>
                <div>
                  <input {...register("email")} type="email" placeholder="Email ID *" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" />
                  {errors.email && <p className="text-red-300 text-sm mt-2">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input {...register("phone")} placeholder="Mobile Number *" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" />
                  {errors.phone && <p className="text-red-300 text-sm mt-2">{errors.phone.message}</p>}
                </div>
                <div>
                  <input {...register("address")} placeholder="Address *" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" />
                  {errors.address && <p className="text-red-300 text-sm mt-2">{errors.address.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input {...register("institution")} placeholder="Institute *" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" />
                  {errors.institution && <p className="text-red-300 text-sm mt-2">{errors.institution.message}</p>}
                </div>
                <div>
                  <select {...register("classLevel")} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30 [&>option]:bg-[#06061b]">
                    <option value="">Select Class / Level *</option>
                    <option value="Class 6-8">Class 6-8 (Junior)</option>
                    <option value="Class 9-10">Class 9-10 (Secondary)</option>
                    <option value="Class 11-12">Class 11-12 (Higher Secondary)</option>
                    <option value="Undergrad">University / Undergrad</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.classLevel && <p className="text-red-300 text-sm mt-2">{errors.classLevel.message}</p>}
                </div>
              </div>

              <div>
                <input {...register("fbLink")} placeholder="Facebook Profile Link *" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" />
                {errors.fbLink && <p className="text-red-300 text-sm mt-2">{errors.fbLink.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input {...register("referralCode")} placeholder="CA Reference (optional)" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" defaultValue={referralCode} />
                <input {...register("clubPartnerCode")} placeholder="Club Partner Reference (optional)" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input {...register("password")} type="password" placeholder="Password *" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" />
                  {errors.password && <p className="text-red-300 text-sm mt-2">{errors.password.message}</p>}
                </div>
                <div>
                  <input {...register("confirmPassword")} type="password" placeholder="Confirm Password *" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30" />
                  {errors.confirmPassword && <p className="text-red-300 text-sm mt-2">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <label htmlFor="terms" className="flex items-start gap-3 text-sm text-white/80 select-none cursor-pointer">
                  <input type="checkbox" id="terms" {...register("terms")} className="mt-0.5 w-4 h-4 accent-[#6972fd] cursor-pointer" />
                  I agree to the Terms and Conditions of Tecnovation&apos;26
                </label>
                {errors.terms && <p className="text-red-300 text-sm mt-2">{errors.terms.message}</p>}
              </div>

              <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#6972fd] to-[#5660f0] py-3.5 font-semibold uppercase text-sm tracking-[0.15em] text-white disabled:opacity-50 hover:brightness-110 transition">
                {loading ? "Registering..." : "Submit Registration"}
              </button>

              <p className="text-sm text-white/70">
                Already have an account?{" "}
                <Link href="/login" className="text-white hover:text-[#9ea4ff] transition-colors underline underline-offset-4">
                  Login here
                </Link>
              </p>
            </form>
          </section>

          <aside className="hidden xl:flex flex-col justify-between p-10 border-l border-white/10 bg-[radial-gradient(circle_at_20%_15%,rgba(105,114,253,0.2),transparent_45%),linear-gradient(160deg,#171328_0%,#0a0912_60%,#06061b_100%)]">
            <div>
              <p className="font-[var(--font-roboto-mono)] text-xs tracking-[0.28em] uppercase text-[#9ea4ff]">Join The Future</p>
              <h2 className="mt-4 font-[var(--font-anton)] text-6xl leading-[0.95] tracking-[0.06em]">Build Your Profile</h2>
              <p className="mt-6 text-white/70 leading-relaxed">Register once to unlock event registrations, ambassador tools, referral tracking, and dashboard controls.</p>
            </div>
            <div className="space-y-3 text-sm text-white/75">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">One account for all segments and packages.</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">Referral codes are auto-detected when available.</div>
            </div>
          </aside>
        </div>
      </div>
      </div>   
      <Footer /> 
    </main>
  );
}