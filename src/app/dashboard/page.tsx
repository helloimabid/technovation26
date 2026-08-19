"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getAccount, getStorage } from "@/lib/appwrite/client";
import { Ambassador, ClubPartner, Package, Purchase, Registration, Segment, UserProfile } from "@/types/models";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { env } from "@/lib/env";
import { PackagesSection } from "@/components/site/packages-section";

type FormDataRecord = Record<string, unknown>;
type TeamMemberProfile = {
  userId: string;
  name?: string;
  profilePicId?: string;
};

function parseFormData(value: string): FormDataRecord {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as FormDataRecord;
    }
    return {};
  } catch {
    return {};
  }
}

function toTitleCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [clubPartner, setClubPartner] = useState<ClubPartner | null>(null);
  const [clubSubmissionsOpen, setClubSubmissionsOpen] = useState<boolean | null>(null);
  const [memberProfilesByUserId, setMemberProfilesByUserId] = useState<Record<string, TeamMemberProfile>>({});

  const load = async () => {
    try {
      setLoading(true);
      const account = getAccount();
      const me = await account.get();

      const clubStatusRes = await fetch("/api/club-partners/status");
      if (clubStatusRes.ok) {
        const clubData = await clubStatusRes.json();
        setClubPartner(clubData);
      }

      // Fetch submissions open toggle from content blocks
      const toggleRes = await fetch("/api/content-blocks?key=clubPartnerSubmissionsOpen");
      if (toggleRes.ok) {
        const blocks = await toggleRes.json();
        const block = blocks.find((b: any) => b.key === "clubPartnerSubmissionsOpen");
        setClubSubmissionsOpen(block ? block.value === "true" : false);
      }
      const [profileRes, segmentsRes, regsRes, packRes, purchaseRes, ambRes] = await Promise.all([
        fetch("/api/profile/me"),
        fetch("/api/segments"),
        fetch("/api/registrations"),
        fetch("/api/packages"),
        fetch("/api/purchases"),
        fetch("/api/ambassadors/status"),
        fetch("/api/club-partners/status"),
        fetch("/api/content-blocks?keys=clubPartnerSubmissionsOpen"),
      ]);

      const [segmentsData, regsData, packsData, purchasesData, ambData, clubPartnerData, submissionsOpenData] = await Promise.all([
        segmentsRes.json(),
        regsRes.json(),
        packRes.json(),
        purchaseRes.json(),
        ambRes.json(),
        clubPartnerRes.json(),
        submissionsOpenRes.json(),
      ]);

      setSegments(asArray<Segment>(segmentsData));
      setRegistrations(asArray<Registration>(regsData));
      setPackages(asArray<Package>(packsData));
      setPurchases(asArray<Purchase>(purchasesData));
      setAmbassador(ambData);
      setClubPartner(clubPartnerData);
      setClubSubmissionsOpen(submissionsOpenData.value === "true");

      const registrationDocs = asArray<Registration>(regsData);
      const memberIds = Array.from(
        new Set(
          registrationDocs.flatMap((reg) => {
            if (Array.isArray(reg.teamMemberUserIds)) return reg.teamMemberUserIds;
            const parsed = parseFormData(reg.additionalFormData);
            if (Array.isArray(parsed.teamMemberUserIds)) {
              return parsed.teamMemberUserIds.map((value) => String(value));
            }
            return [];
          })
        )
      );

      if (memberIds.length > 0) {
        const lookupRes = await fetch(`/api/profile/lookup?ids=${encodeURIComponent(memberIds.join(","))}`);
        if (lookupRes.ok) {
          const lookupData = asArray<TeamMemberProfile>(await lookupRes.json());
          const nextMap = lookupData.reduce<Record<string, TeamMemberProfile>>((acc, profileDoc) => {
            acc[profileDoc.userId] = profileDoc;
            return acc;
          }, {});
          setMemberProfilesByUserId(nextMap);
        }
      } else {
        setMemberProfilesByUserId({});
      }

      const profileLike: UserProfile = {
        $id: me.$id,
        userId: me.$id,
        name: me.name,
        email: me.email,
        institution: "-",
        phone: "-",
        address: "-",
        classLevel: "-",
        fbLink: "",
        role: "user",
      };

      if (profileRes.ok) {
        const serverProfile = await profileRes.json();
        if (serverProfile) {
          profileLike.institution = serverProfile.institution ?? profileLike.institution;
          profileLike.phone = serverProfile.phone ?? profileLike.phone;
          profileLike.address = serverProfile.address ?? profileLike.address;
          profileLike.classLevel = serverProfile.classLevel ?? profileLike.classLevel;
          profileLike.fbLink = serverProfile.fbLink ?? profileLike.fbLink;
          profileLike.role = serverProfile.role ?? profileLike.role;
          profileLike.profilePicId = serverProfile.profilePicId ?? profileLike.profilePicId;

          if (serverProfile.profilePicId) {
            try {
              const url = getStorage().getFilePreview(env.bucketId, serverProfile.profilePicId);
              setProfilePicUrl(url.toString());
            } catch (err) {
              console.error("Failed to load profile pic", err);
            }
          }
        }
      }

      setProfile(profileLike);
      const clubPartnerRes = await fetch("/api/club-partners/status");
      let clubPartnerData = null;
      if (clubPartnerRes.ok) {
        clubPartnerData = await clubPartnerRes.json();
      }
      setClubPartner(clubPartnerData);

      const submissionsOpenRes = await fetch("/api/content-blocks?key=clubPartnerSubmissionsOpen");
      let submissionsOpen = false;
      if (submissionsOpenRes.ok) {
        const blocks = await submissionsOpenRes.json();
        const block = blocks.find((b: any) => b.key === "clubPartnerSubmissionsOpen");
        submissionsOpen = block ? block.value === "true" : false;
      }
      setClubSubmissionsOpen(submissionsOpen);
    } catch {
      toast.error("Please login to continue");
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const coveredSegmentIds = useMemo(() => {
    const purchasedIds = new Set(purchases.map((purchase) => purchase.packageId));
    const covered = new Set<string>();

    packages.forEach((pack) => {
      if (!purchasedIds.has(pack.$id)) return;
      const included = Array.isArray(pack.includedSegmentIds) ? pack.includedSegmentIds : [];
      included.forEach((segmentId) => covered.add(segmentId));
    });

    return covered;
  }, [packages, purchases]);

  const registeredSegmentIds = useMemo(
    () => new Set(registrations.map((r) => r.segmentId)),
    [registrations]
  );

  const unregister = async (id: string) => {
    const res = await fetch(`/api/registrations?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed");
      return;
    }

    toast.success("Unregistered");
    load();
  };


  const purchase = async (packageId: string) => {
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }

    toast.success("Package purchased");
    load();
  };

  const applyCa = async () => {
    const res = await fetch("/api/ambassadors/apply", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed");
      return;
    }

    toast.success("CA application submitted");
    load();
  };
  const applyClubPartner = async () => {
    try {
      const res = await fetch("/api/club-partners/apply", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to apply");
      toast.success("Club Partner application submitted");
      // Reload status
      const statusRes = await fetch("/api/club-partners/status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setClubPartner(statusData);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply");
    }
  };

  const logout = async () => {
    const account = getAccount();
    try {
      await account.deleteSession("current");
    } catch {
      // ignore
    }
    await fetch("/api/auth/clear-session", { method: "POST" });
    window.location.href = "/login";
  };

  if (loading) {
    return <main className="min-h-screen bg-[#0E0B16] text-white p-8 flex items-center justify-center font-[var(--font-anton)] text-4xl">Loading dashboard...</main>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0E0B16] text-white flex flex-col font-[var(--font-inter)] selection:bg-[#6972fd] selection:text-white pb-12 relative">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] bg-[#6972fd] opacity-5 blur-[150px] rounded-full pointer-events-none transition-transform duration-1000 ease-in-out"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#25203A] opacity-30 blur-[130px] rounded-full pointer-events-none transition-transform duration-1000 ease-in-out"></div>

      <Navbar />

      {/* Main Content */}
      <div className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-12 relative z-10 mt-16 md:mt-24">

        {/* HERO PROFILE CARD */}
        <div className="relative rounded-[2rem] overflow-hidden p-5 sm:p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 shadow-2xl border border-white/10 group transition-all duration-500 hover:border-[#6972fd]/40 bg-[#161224]/80 backdrop-blur-sm" style={{ background: "linear-gradient(145deg, rgba(28,23,43,0.9) 0%, rgba(13,10,20,0.9) 100%)" }}>

          <div className="absolute top-0 right-0 w-[120%] md:w-[60%] h-full pointer-events-none opacity-[0.03] transform translate-x-1/4 scale-150 z-0">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <circle cx="50" cy="50" r="40" fill="url(#hero-glow)" />
              <defs>
                <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6972fd" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 w-full">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/10 shrink-0 bg-[#0A0A10] shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:border-[#6972fd]/50 transition-colors duration-500">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-[var(--font-anton)] text-6xl bg-gradient-to-br from-[#1c182a] to-[#05040a] text-white/50 pt-2">{profile?.name?.charAt(0).toUpperCase() || 'U'}</div>
              )}
            </div>
            <div className="text-center md:text-left flex-1 space-y-1.5 md:mt-3">
              <p className="text-xs md:text-sm text-[#6972fd] font-medium font-[var(--font-roboto-mono)] tracking-[0.2em] uppercase">{profile?.userId}</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold pb-2 font-[var(--font-anton)] tracking-wide drop-shadow-md">{profile?.name}</h1>
              <div className="flex flex-col items-center md:items-start gap-1 text-white/70 font-medium">
                <p className="flex items-center gap-2"><span className="text-white/30">✉</span> {profile?.email}</p>
                <p className="flex items-center gap-2 text-sm max-w-md"><span className="text-white/30">🏫</span> {profile?.institution}</p>
              </div>
              <div className="pt-6 flex justify-center md:justify-start">
                <Link href="/settings" className="bg-white/[0.04] hover:bg-white/[0.1] hover:text-white transition-all duration-300 font-semibold text-xs px-6 py-2.5 rounded-full border border-white/10 flex items-center gap-2.5 uppercase tracking-widest text-white/70 shadow-lg">
                  Edit Profile <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 z-10 bg-black/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md self-center md:self-auto shadow-2xl group-hover:border-white/15 transition-all duration-500 mt-6 md:mt-0">
            <div className="bg-white p-3 rounded-xl shadow-inner relative overflow-hidden">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${profile?.userId || 'tecnovation'}&color=06061b&bgcolor=ffffff`} alt="Ticket QR Code" className="w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] opacity-90" />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[#6972fd]/50 animate-[scan_3s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-[10px] text-white/40 font-[var(--font-roboto-mono)] font-semibold text-center tracking-[0.3em] uppercase">{profile?.userId}</p>
          </div>
        </div>

        {/* PARTICIPATED EVENTS */}
        <section className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-[var(--font-inter)] font-semibold text-white/90 tracking-wide">Participated Events</h2>
            <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-transparent via-[#6972fd] to-transparent rounded-full opacity-70"></div>
          </div>

          <div className="bg-[#120E1C]/60 border border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.3)] rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center min-h-[180px] text-center backdrop-blur-sm relative overflow-hidden">
            {registrations.length === 0 ? (
              <p className="text-white/40 font-medium tracking-wide">You haven&apos;t participated in any event yet.</p>
            ) : (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-left relative z-10">
                {registrations.map((reg) => {
                  const seg = segments.find((s) => s.$id === reg.segmentId);
                  const data = parseFormData(reg.additionalFormData);
                  const status = reg.status ?? "pending";
                  const statusClassName =
                    status === "approved"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : status === "disapproved"
                        ? "bg-red-500/15 text-red-300 border-red-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30";
                  const teamMemberIds = Array.isArray(reg.teamMemberUserIds)
                    ? reg.teamMemberUserIds
                    : Array.isArray(data.teamMemberUserIds)
                      ? (data.teamMemberUserIds as unknown[]).map((item) => String(item))
                      : [];
                  const visibleEntries = Object.entries(data).filter(([key, value]) => {
                    if (key === "teamMemberUserIds") return false;
                    if (value === null || value === undefined) return false;
                    if (typeof value === "string" && value.trim() === "") return false;
                    return true;
                  });
                  const isTeamLead = reg.userId === profile?.userId;

                  return (
                    <div key={reg.$id} className="min-w-0 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10 shadow-lg hover:shadow-xl group">
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-lg text-white/90 font-[var(--font-anton)] tracking-wide">{seg?.name ?? reg.segmentId}</p>
                          <span className={`text-[10px] uppercase tracking-[0.18em] font-bold px-2.5 py-1 rounded-full border ${statusClassName}`}>{status}</span>
                        </div>
                        <p className="text-white/50 text-[11px] font-medium font-[var(--font-roboto-mono)] uppercase">Role: <span className="text-white/80">{isTeamLead ? "Team Lead" : "Team Member"}</span></p>
                        <p className="text-white/50 text-xs mt-1 font-medium font-[var(--font-roboto-mono)] uppercase">Team: <span className="text-white/80">{reg.teamName || "N/A"}</span></p>
                        {teamMemberIds.length > 0 ? (
                          <div className="pt-1">
                            <p className="text-white/50 text-[11px] font-medium font-[var(--font-roboto-mono)] uppercase mb-2">Members</p>
                            <div className="flex flex-wrap gap-2">
                              {teamMemberIds.map((memberId) => {
                                const member = memberProfilesByUserId[memberId];
                                const memberPicUrl = member?.profilePicId
                                  ? getStorage().getFilePreview(env.bucketId, member.profilePicId).toString()
                                  : null;
                                const initial = (member?.name?.charAt(0) ?? "U").toUpperCase();

                                return (
                                  <div key={`${reg.$id}-${memberId}`} className="h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/80" title={member?.name ?? "Team Member"}>
                                    {memberPicUrl ? (
                                      <img src={memberPicUrl} alt={member?.name ?? "Team Member"} className="h-full w-full object-cover" />
                                    ) : (
                                      initial
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        {visibleEntries.length > 0 ? (
                          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 space-y-1.5">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-bold">Submitted Details</p>
                            {visibleEntries.map(([key, value]) => (
                              <p key={`${reg.$id}-${key}`} className="text-[11px] text-white/70 break-words">
                                <span className="text-white/45 uppercase tracking-[0.15em] mr-1">{toTitleCase(key)}:</span>
                                {typeof value === "string" ? value : JSON.stringify(value)}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      {isTeamLead ? (
                        <button onClick={() => unregister(reg.$id)} className="w-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 py-2 text-[10px] rounded-xl uppercase font-bold tracking-[0.2em] transition-colors">Unregister</button>
                      ) : (
                        <div className="w-full bg-white/5 text-white/50 border border-white/10 py-2 text-[10px] rounded-xl uppercase font-bold tracking-[0.2em] text-center">Managed by Team Lead</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <Link href="/#segments" className="bg-white/5 hover:bg-[#6972fd] hover:text-white hover:border-[#6972fd] text-white/60 transition-all duration-300 border border-white/10 px-8 py-3.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase shadow-lg hover:shadow-[0_0_20px_rgba(105,114,253,0.3)]">
              Participate in more Events
            </Link>
          </div>
        </section>

        {/* WARNING BANNER */}
        <div className="bg-[#1C1506] border border-[#6B5012] text-[#F3C44B] text-xs sm:text-sm font-medium py-4 px-6 text-center rounded-2xl shadow-[0_0_30px_rgba(107,80,18,0.15)] flex items-center justify-center gap-3">
          <span className="text-xl hidden sm:inline">⚠️</span>
          <span><strong className="font-bold tracking-wider">ATTENTION:</strong> You are permitted to apply for ONLY ONE program: either Campus Ambassador (CA) or Club Partner. Once you apply for one, the other option will be permanently disabled.</span>
        </div>

        {/* CA & CLUB PARTNER STATUS */}
        <section className="grid md:grid-cols-2 gap-6 sm:gap-8 pt-2">
          {/* CA Status Box */}
          <div className="bg-[#120E1C]/60 border border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.3)] rounded-[2rem] p-8 flex flex-col justify-between min-h-[260px] text-center backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-lg font-[var(--font-inter)] font-semibold text-white/90 tracking-wide inline-block border-b border-white/10 pb-3 mb-2 px-6">CA Status</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              {ambassador ? (
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-white/50 text-sm font-medium uppercase tracking-widest">Status:</span>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase ${ambassador.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                      {ambassador.status}
                    </span>
                  </div>
                  <div className="bg-black/30 border border-white/5 py-2.5 px-4 rounded-xl inline-block mt-2">
                    <span className="text-white/40 text-xs uppercase tracking-widest mr-2">Code:</span>
                    <span className="text-white font-[var(--font-roboto-mono)] tracking-wider font-semibold">{ambassador.caCode || "Generating..."}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-4 w-full">
                    <div className="bg-black/40 border border-white/[0.03] p-4 rounded-2xl flex-1 shadow-inner">
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-1">Points</p>
                      <p className="text-3xl font-[var(--font-anton)] text-[#6972fd] drop-shadow-md">{ambassador.points}</p>
                    </div>
                    <div className="bg-black/40 border border-white/[0.03] p-4 rounded-2xl flex-1 shadow-inner">
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-1">Referrals</p>
                      <p className="text-3xl font-[var(--font-anton)] text-white drop-shadow-md">{ambassador.referralsCount}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 w-full flex flex-col items-center">
                  <p className="text-white/40 font-medium text-sm">You have not applied for the CA program yet.</p>
                  <button onClick={applyCa} disabled={profile?.role === "admin"} className="bg-white/5 hover:bg-[#6972fd] hover:text-white text-white/70 transition-all duration-300 border border-white/10 px-8 py-3 rounded-full text-xs font-bold tracking-[0.2em] uppercase shadow-lg w-full max-w-[220px]">
                    Apply for CA
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Club Partner Status Box */}

          <div className="bg-[#120E1C]/60 border border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.3)] rounded-[2rem] p-8 flex flex-col justify-between min-h-[260px] text-center backdrop-blur-sm opacity-90 hover:opacity-100 transition-opacity">
            <div className="mb-6">
              <h2 className="text-lg font-[var(--font-inter)] font-semibold text-white/90 tracking-wide inline-block border-b border-white/10 pb-3 mb-2 px-6">Club Partner Status</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              {loading ? (
                <p className="text-white/40">Loading...</p>
              ) : clubPartner ? (
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-white/50 text-sm font-medium uppercase tracking-widest">Status:</span>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase ${clubPartner.status === "approved"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : clubPartner.status === "rejected"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}>
                      {clubPartner.status}
                    </span>
                  </div>
                  {clubPartner.status === "approved" && (
                    <div className="bg-black/30 border border-white/5 py-2.5 px-4 rounded-xl inline-block mt-2">
                      <span className="text-white/40 text-xs uppercase tracking-widest mr-2">Code:</span>
                      <span className="text-white font-[var(--font-roboto-mono)] tracking-wider font-semibold">{clubPartner.clubCode}</span>
                    </div>
                  )}
                  {clubPartner.status === "approved" && (
                    <div className="flex items-center justify-center gap-3 mt-4 w-full">
                      <div className="bg-black/40 border border-white/[0.03] p-4 rounded-2xl flex-1 shadow-inner">
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-1">Points</p>
                        <p className="text-3xl font-[var(--font-anton)] text-[#6972fd] drop-shadow-md">{clubPartner.points}</p>
                      </div>
                      <div className="bg-black/40 border border-white/[0.03] p-4 rounded-2xl flex-1 shadow-inner">
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-1">Referrals</p>
                        <p className="text-3xl font-[var(--font-anton)] text-white drop-shadow-md">{clubPartner.referralsCount}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : clubSubmissionsOpen === false ? (
                <p className="text-white/40 text-sm">Submissions are currently closed.</p>
              ) : (
                <div className="space-y-6 w-full flex flex-col items-center">
                  <p className="text-white/40 font-medium text-sm">You have not applied for Club Partner yet.</p>
                  <button
                    onClick={applyClubPartner}
                    className="bg-white/5 hover:bg-[#6972fd] hover:text-white text-white/70 transition-all duration-300 border border-white/10 px-8 py-3 rounded-full text-xs font-bold tracking-[0.2em] uppercase shadow-lg w-full max-w-[220px] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Apply for Club Partner
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM SECTIONS: PACKAGES & SEGMENTS */}
        <div className="pt-10 mb-12 space-y-10">
          {/* PACKAGES — using shared component with proper bKash checkout */}
          <PackagesSection
            packages={packages}
            segments={segments}
            onPurchaseSuccess={(purchase) => setPurchases((prev) => [...prev, purchase])}
          />
          {segments.length > 0 && (
            <section className="bg-[#120E1C]/60 border border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.3)] rounded-[2rem] p-6 sm:p-10 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 mb-8">
                <h2 className="text-xl sm:text-2xl font-[var(--font-inter)] font-semibold text-white/90 tracking-wide">Available Segments</h2>
                <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-transparent via-[#6972fd] to-transparent rounded-full opacity-70"></div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {segments.map((segment) => (
                  <article key={segment.$id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/[0.04] transition-all duration-300 hover:border-white/10">
                    <div className="flex-1 space-y-3">
                      <h3 className="font-bold text-lg text-white/90 tracking-wide">{segment.name}</h3>
                      <p className="text-xs text-white/40 leading-relaxed line-clamp-3">{segment.description}</p>
                      {segment.isPaid && coveredSegmentIds.has(segment.$id) ? (
                        <p className="text-[11px] text-emerald-300/90 uppercase tracking-[0.14em]">Covered by purchased package</p>
                      ) : null}
                    </div>
                    <Link
                      href={`/events/${segment.$id}`}
                      aria-disabled={registeredSegmentIds.has(segment.$id)}
                      className={`block w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 transition-colors hover:bg-[#6972fd] hover:text-white ${registeredSegmentIds.has(segment.$id) ? "pointer-events-none opacity-30" : ""}`}
                    >
                      {registeredSegmentIds.has(segment.$id) ? "Registered" : "Register"}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(130px); opacity: 0; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
