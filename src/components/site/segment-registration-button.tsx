"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAccount, getStorage } from "@/lib/appwrite/client";
import { Package, Purchase, Segment } from "@/types/models";
import { env } from "@/lib/env";

type SegmentField = {
  label: string;
  name: string;
  type: "text" | "url" | "textarea" | "number" | "date" | "email" | "select" | "radio" | "checkbox";
  required?: boolean;
};

type MemberPreview = {
  userId: string;
  name?: string;
  institution?: string;
  profilePicId?: string;
};

export function SegmentRegistrationButton({ segment }: { segment: Segment }) {
  const [status, setStatus] = useState<"loading" | "guest" | "registered" | "ready">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamMembersRaw, setTeamMembersRaw] = useState("");
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [memberPreviewLoading, setMemberPreviewLoading] = useState(false);
  const [memberPreviews, setMemberPreviews] = useState<MemberPreview[]>([]);
  const [coveredByPackage, setCoveredByPackage] = useState(false);
  const [coveringPackageName, setCoveringPackageName] = useState<string | null>(null);

  const parsedTeamMemberIds = teamMembersRaw
    .split(/\r?\n|,/) 
    .map((value) => value.trim())
    .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);
  const parsedTeamMemberIdsKey = parsedTeamMemberIds.join("|");

  const fields: SegmentField[] = (() => {
    try { return JSON.parse(segment.formSchema) as SegmentField[]; } catch { return []; }
  })();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await getAccount().get();
        const [regsRes, packRes, purchasesRes] = await Promise.all([
          fetch("/api/registrations"),
          fetch("/api/packages"),
          fetch("/api/purchases"),
        ]);
        if (!regsRes.ok || !packRes.ok || !purchasesRes.ok) throw new Error();

        const regs: { segmentId: string }[] = await regsRes.json();
        const packages = (await packRes.json()) as Package[];
        const purchases = (await purchasesRes.json()) as Purchase[];

        const purchasedIds = new Set(purchases.map((p) => p.packageId));
        const coveringPackage = packages.find((pack) => {
          if (!purchasedIds.has(pack.$id)) return false;
          const included = Array.isArray(pack.includedSegmentIds) ? pack.includedSegmentIds : [];
          return included.includes(segment.$id);
        });

        if (!mounted) return;
        setCoveredByPackage(Boolean(coveringPackage));
        setCoveringPackageName(coveringPackage?.name ?? null);
        if (regs.some((r) => r.segmentId === segment.$id)) {
          setStatus("registered");
        } else {
          setStatus("ready");
        }
      } catch {
        if (mounted) setStatus("guest");
      }
    })();
    return () => { mounted = false; };
  }, [segment.$id]);

  useEffect(() => {
    if (!segment.isTeamEvent) return;
    if (parsedTeamMemberIds.length === 0) {
      setMemberPreviews([]);
      setMemberPreviewLoading(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setMemberPreviewLoading(true);
        const res = await fetch(`/api/profile/lookup?ids=${encodeURIComponent(parsedTeamMemberIds.join(","))}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as MemberPreview[];
        if (!active) return;
        setMemberPreviews(Array.isArray(data) ? data : []);
      } catch {
        if (active) {
          setMemberPreviews([]);
        }
      } finally {
        if (active) {
          setMemberPreviewLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [segment.isTeamEvent, parsedTeamMemberIdsKey]);

  const handleRegister = async () => {
    setSubmitting(true);
    try {
      const teamMemberUserIds = teamMembersRaw
        .split(/\r?\n|,/) 
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      const foundIds = new Set(memberPreviews.map((member) => member.userId));
      const missingIds = teamMemberUserIds.filter((memberId) => !foundIds.has(memberId));
      if (segment.isTeamEvent && missingIds.length > 0) {
        throw new Error(`These user IDs do not exist: ${missingIds.join(", ")}`);
      }

      if (segment.isTeamEvent && teamName.trim() === "") {
        throw new Error("Team name is required for this segment");
      }

      if (segment.isTeamEvent && teamMemberUserIds.length === 0) {
        throw new Error("Add at least one team member user ID");
      }

      const teamMemberLimit = Number(segment.teamMemberLimit ?? 0);
      if (segment.isTeamEvent && teamMemberLimit > 0 && teamMemberUserIds.length > teamMemberLimit) {
        throw new Error(`Maximum ${teamMemberLimit} team members are allowed for this segment`);
      }

      if (segment.isPaid && !coveredByPackage && paymentTransactionId.trim().length < 6) {
        throw new Error("Please enter your bKash transaction ID");
      }

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentId: segment.$id,
          teamName: teamName || "",
          teamMemberUserIds,
          paymentTransactionId: paymentTransactionId.trim(),
          additionalFormData: JSON.stringify(formValues),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      toast.success("Registered successfully!");
      setStatus("registered");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-center text-white/40 text-sm font-medium tracking-wider animate-pulse">
        Loading…
      </div>
    );
  }

  if (status === "guest") {
    return (
      <a
        href="/register"
        className="block w-full text-center py-4 rounded-xl bg-gradient-to-r from-[#6972fd] to-[#5660f0] text-white font-bold text-sm uppercase tracking-[0.15em] hover:brightness-110 transition shadow-[0_0_25px_rgba(105,114,253,0.3)] hover:shadow-[0_0_40px_rgba(105,114,253,0.5)]"
      >
        Create Account to Register
      </a>
    );
  }

  if (status === "registered") {
    return (
      <div className="w-full py-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center text-green-400 text-sm font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        Registered
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6972fd] to-[#5660f0] text-white font-bold text-sm uppercase tracking-[0.15em] hover:brightness-110 transition shadow-[0_0_25px_rgba(105,114,253,0.3)] hover:shadow-[0_0_40px_rgba(105,114,253,0.5)] cursor-pointer"
      >
        Register for this Segment
      </button>
    );
  }

  return (
    <div className="w-full space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
      <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-white/80">Registration Form</h4>

      {segment.isPaid && !coveredByPackage ? (
        <div className="rounded-xl border border-[#6972fd]/30 bg-[#6972fd]/10 p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#9ea4ff] font-semibold">Send Fee to bKash</p>
          <p className="text-xl font-[var(--font-anton)] text-white tracking-wide">{segment.bkashNumber || "Not set yet"}</p>
          <p className="text-[11px] text-white/55">After sending money, enter the transaction ID below for verification.</p>
        </div>
      ) : null}

      {segment.isPaid && coveredByPackage ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200 font-semibold">Package Coverage</p>
          <p className="text-sm text-emerald-100">This segment is covered by your package{coveringPackageName ? `: ${coveringPackageName}` : ""}.</p>
          <p className="text-[11px] text-emerald-200/80">No separate bKash transaction is required.</p>
        </div>
      ) : null}

      {segment.isTeamEvent ? (
        <>
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-1.5">Team Name</label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30 transition-all text-white placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-1.5">Team Member User IDs</label>
            <textarea
              value={teamMembersRaw}
              onChange={(e) => setTeamMembersRaw(e.target.value)}
              rows={3}
              placeholder="One user ID per line or comma separated"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30 transition-all text-white placeholder:text-white/30 resize-none"
            />
            <p className="mt-1 text-[11px] text-white/50">Each member must already have an account on this site.</p>
            {segment.teamMemberLimit && segment.teamMemberLimit > 0 ? (
              <p className="mt-1 text-[11px] text-white/50">Max team members allowed: {segment.teamMemberLimit}</p>
            ) : null}

            <div className="mt-3 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Member Preview</p>
              {memberPreviewLoading ? (
                <p className="text-[11px] text-white/50">Checking members...</p>
              ) : null}
              {parsedTeamMemberIds.map((memberId) => {
                const member = memberPreviews.find((item) => item.userId === memberId);
                const profilePicUrl = member?.profilePicId
                  ? getStorage().getFilePreview(env.bucketId, member.profilePicId).toString()
                  : null;

                return (
                  <div
                    key={memberId}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${member ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"}`}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-xs font-bold text-white/70">
                      {profilePicUrl ? <img src={profilePicUrl} alt={member?.name ?? memberId} className="h-full w-full object-cover" /> : (member?.name?.charAt(0).toUpperCase() ?? memberId.charAt(0).toUpperCase())}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{member?.name ?? "User not found"}</p>
                      <p className="text-[11px] text-white/60 truncate">{memberId}{member?.institution ? ` • ${member.institution}` : ""}</p>
                    </div>
                  </div>
                );
              })}
              {parsedTeamMemberIds.length === 0 ? (
                <p className="text-[11px] text-white/40">Add member IDs to see who will be added to your team.</p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-1.5">{field.label}{field.required ? " *" : ""}</label>
          {field.type === "textarea" ? (
            <textarea
              value={formValues[field.name] ?? ""}
              onChange={(e) => setFormValues((p) => ({ ...p, [field.name]: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30 transition-all text-white placeholder:text-white/30 resize-none"
            />
          ) : (
            <input
              type={field.type === "url" ? "url" : "text"}
              value={formValues[field.name] ?? ""}
              onChange={(e) => setFormValues((p) => ({ ...p, [field.name]: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30 transition-all text-white placeholder:text-white/30"
            />
          )}
        </div>
      ))}

      {segment.isPaid && !coveredByPackage ? (
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-1.5">bKash Transaction ID *</label>
          <input
            value={paymentTransactionId}
            onChange={(e) => setPaymentTransactionId(e.target.value)}
            placeholder="e.g. 9H3K2P7Q"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-[#6972fd] focus:ring-2 focus:ring-[#6972fd]/30 transition-all text-white placeholder:text-white/30"
          />
        </div>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleRegister}
          disabled={submitting}
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#6972fd] to-[#5660f0] text-white font-bold text-xs uppercase tracking-[0.15em] hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Submitting…" : "Confirm Registration"}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white/60 text-xs uppercase tracking-[0.15em] font-bold hover:bg-white/10 transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
