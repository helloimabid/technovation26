"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccount, getStorage } from "@/lib/appwrite/client";
import { env } from "@/lib/env";

type NavUser = {
  id: string;
  name: string;
  email: string;
};

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const me = await getAccount().get();

        let nextProfilePicUrl: string | null = null;
        try {
          const profileRes = await fetch("/api/profile/me");
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile?.profilePicId) {
              nextProfilePicUrl = getStorage().getFilePreview(env.bucketId, profile.profilePicId).toString();
            }
          }
        } catch {
          nextProfilePicUrl = null;
        }

        if (!mounted) return;
        setUser({ id: me.$id, name: me.name, email: me.email });
        setProfilePicUrl(nextProfilePicUrl);
      } catch {
        if (!mounted) return;
        setUser(null);
        setProfilePicUrl(null);
      }
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", onDocClick);
    }

    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [menuOpen]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user]);

  const handleSignOut = async () => {
    try {
      await getAccount().deleteSession("current");
    } catch {
      // ignore appwrite session delete failure and clear server cookie anyway
    }

    await fetch("/api/auth/clear-session", { method: "POST" });
    setMenuOpen(false);
    setUser(null);
    setProfilePicUrl(null);
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    ["Home", "/"],
    ["About", "/about"],
    ["Events", "/events"],
    ["Schedule", "/schedule"],
    ["Gallery", "/gallery"],
    ["Contact", "/contact"],
  ] as const;

  return (
    <nav className="absolute inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 md:px-12 md:py-6" aria-label="Main navigation">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="relative z-10 flex min-w-0 items-center gap-3" onClick={() => setMobileNavOpen(false)}>
          <Image
            src="/logo.png"
            alt="JITC Logo"
            width={208}
            height={64}
            priority
            className="h-12 w-auto object-contain sm:h-14 md:h-16"
          />
        </Link>

        <div className="hidden items-center gap-5 rounded-full border border-white/10 bg-white/15 px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-white backdrop-blur-md lg:flex xl:gap-8">
          {navLinks.map(([label, href]) => (
            <Link key={href} href={href} className="whitespace-nowrap transition-colors hover:text-white/70">{label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md lg:hidden"
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((previous) => !previous)}
          >
            <span className="sr-only">{mobileNavOpen ? "Close menu" : "Open menu"}</span>
            <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
              <span className={`h-0.5 w-full bg-current transition-transform ${mobileNavOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-full bg-current transition-opacity ${mobileNavOpen ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-full bg-current transition-transform ${mobileNavOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="mt-3 rounded-2xl border border-white/15 bg-[#17172d]/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
          <div className="grid gap-1 sm:grid-cols-2">
            {navLinks.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMobileNavOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white/85 transition-colors hover:bg-white/10 hover:text-white">{label}</Link>
            ))}
          </div>
        </div>
      )}

      {user ? (
        <div ref={menuRef} className="relative z-20">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-12 h-12 rounded-full border border-white/30 bg-white/10 text-white font-semibold text-sm flex items-center justify-center overflow-hidden backdrop-blur-md"
            aria-label="Open account menu"
          >
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-3 w-56 rounded-xl border border-white/15 bg-[#2f3040] text-white shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/15">
                <p className="text-sm font-semibold leading-tight truncate">{user.name}</p>
                <p className="text-xs text-white/70 truncate mt-1">{user.email}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-white/85 hover:bg-white/10 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/85 hover:bg-white/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          className="bg-white text-[#06061b] px-4 py-2 text-xs uppercase tracking-[0.12em] font-[var(--font-inter)] font-semibold"
        >
          Login
        </Link>
      )}
    </nav>
  );
}
