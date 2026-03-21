"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ID } from "appwrite";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { getAccount, getStorage } from "@/lib/appwrite/client";
import { env } from "@/lib/env";
import { UserProfile } from "@/types/models";

type SettingsForm = {
  name: string;
  institution: string;
  phone: string;
  address: string;
  classLevel: string;
  fbLink: string;
};

const EMPTY_FORM: SettingsForm = {
  name: "",
  institution: "",
  phone: "",
  address: "",
  classLevel: "",
  fbLink: "",
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [email, setEmail] = useState("");
  const [profilePicId, setProfilePicId] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);

  const initials = useMemo(() => {
    if (!form.name.trim()) return "U";
    return form.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [form.name]);

  useEffect(() => {
    const load = async () => {
      try {
        const account = getAccount();
        const me = await account.get();
        setEmail(me.email);

        const res = await fetch("/api/profile/me");
        if (!res.ok) throw new Error("Failed to load profile");

        const profile = (await res.json()) as UserProfile | null;
        if (!profile) throw new Error("Profile not found");

        setForm({
          name: profile.name ?? "",
          institution: profile.institution ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
          classLevel: profile.classLevel ?? "",
          fbLink: profile.fbLink ?? "",
        });

        const nextPicId = profile.profilePicId ?? "";
        setProfilePicId(nextPicId);
        if (nextPicId) {
          const url = getStorage().getFilePreview(env.bucketId, nextPicId).toString();
          setProfilePicUrl(url);
        }
      } catch {
        toast.error("Please login to access settings");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const onInputChange = (key: keyof SettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      toast.error("File size must be under 30MB");
      event.target.value = "";
      return;
    }
    setNewFile(file);
    setProfilePicUrl(URL.createObjectURL(file));
  };

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      let nextProfilePicId = profilePicId;

      if (newFile) {
        const fileUpload = await getStorage().createFile(env.bucketId, ID.unique(), newFile);
        nextProfilePicId = fileUpload.$id;
      }

      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          profilePicId: nextProfilePicId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update profile");

      setProfilePicId(nextProfilePicId);
      setNewFile(null);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06061b] text-white flex items-center justify-center">
        <p className="font-[var(--font-roboto-mono)] text-sm tracking-[0.24em] uppercase text-white/60">Loading Settings</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06061b] text-white relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-12%] w-[55%] h-[50%] bg-[#6972fd] opacity-10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-25%] right-[-10%] w-[50%] h-[45%] bg-[#25203A] opacity-45 blur-[130px] rounded-full pointer-events-none"></div>

      <Navbar />

      <section className="relative z-10 pt-28 pb-14 px-6 md:px-10">
        <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-white/10 bg-black/25 backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="grid lg:grid-cols-[280px_1fr]">
            <aside className="border-b lg:border-b-0 lg:border-r border-white/10 p-8 bg-[#0d0a17]/80 flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center text-2xl font-semibold">
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <p className="mt-4 font-semibold text-lg">{form.name || "User"}</p>
              <p className="text-sm text-white/65 break-all">{email}</p>

              <label className="mt-6 w-full cursor-pointer rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.16em] hover:bg-white/[0.08] transition-colors">
                Change Photo
                <input type="file" accept="image/jpeg,image/png" onChange={onFileChange} className="hidden" />
              </label>

              <button
                onClick={() => router.push("/dashboard")}
                className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.02] px-4 py-3 text-xs uppercase tracking-[0.16em] text-white/80 hover:bg-white/[0.06] transition-colors"
              >
                Back to Dashboard
              </button>
            </aside>

            <div className="p-8 md:p-10">
              <div className="mb-8">
                <p className="font-[var(--font-roboto-mono)] text-[11px] tracking-[0.28em] uppercase text-white/50">User Settings</p>
                <h1 className="font-[var(--font-anton)] text-5xl tracking-[0.04em] mt-2">Edit Profile</h1>
              </div>

              <form onSubmit={onSave} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Full Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => onInputChange("name", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Email</label>
                    <input
                      value={email}
                      disabled
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 outline-none text-white/60"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Institute</label>
                    <input
                      value={form.institution}
                      onChange={(e) => onInputChange("institution", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => onInputChange("phone", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Address</label>
                    <input
                      value={form.address}
                      onChange={(e) => onInputChange("address", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Class / Level</label>
                    <select
                      value={form.classLevel}
                      onChange={(e) => onInputChange("classLevel", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30 [&>option]:bg-[#06061b]"
                    >
                      <option value="">Select Class / Level</option>
                      <option value="Class 6-8">Class 6-8 (Junior)</option>
                      <option value="Class 9-10">Class 9-10 (Secondary)</option>
                      <option value="Class 11-12">Class 11-12 (Higher Secondary)</option>
                      <option value="Undergrad">University / Undergrad</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Facebook Profile Link</label>
                  <input
                    value={form.fbLink}
                    onChange={(e) => onInputChange("fbLink", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 outline-none transition-all focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30"
                  />
                </div>

                <button
                  disabled={saving}
                  className="w-full md:w-auto rounded-xl bg-gradient-to-r from-[#6972fd] to-[#5660f0] px-8 py-3.5 font-semibold uppercase text-sm tracking-[0.15em] text-white disabled:opacity-50 hover:brightness-110 transition"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
