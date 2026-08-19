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
  role?: string;
};

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        // 1️⃣ Get user from our server session
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const session = await res.json();
          if (!mounted) return;
          setUser({
            id: session.userId,
            name: session.name,
            email: session.email,
            role: session.role,
          });

          // 2️⃣ Fetch profile picture if available
          const profileRes = await fetch("/api/profile/me", { credentials: "include" });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile?.profilePicId) {
              const url = getStorage().getFilePreview(env.bucketId, profile.profilePicId).toString();
              setProfilePicUrl(url);
            }
          }
        } else {
          // Not authenticated
          if (mounted) setUser(null);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
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
    // No Appwrite session — fine
  }

  // 2️⃣ Clear your custom session cookie
  try {
    await fetch("/api/auth/clear-session", { method: "POST" });
  } catch {
    // ignore
  }

  // 3️⃣ Hard navigation — wipes all client state and router cache
  setMenuOpen(false);
  setUser(null);
  setProfilePicUrl(null);
  window.location.href = "/login";
  };

  const navigation = [
    ["Home", "/"],
    ["About", "/about"],
    ["Events", "/events"],
    ["Schedule", "/schedule"],
    ["Gallery", "/gallery"],
    ["Contact", "/contact"],
  ] as const;

  return (
    <nav className="absolute inset-x-0 top-0 z-50 px-3 py-3 sm:px-5 sm:py-4 md:px-8 lg:px-12 lg:py-6">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
        <Link href="/" onClick={() => setMenuOpen(false)} className="relative z-10 flex min-w-0 shrink-0 items-center">
          <Image
            src="/logo.png"
            alt="JITC Logo"
            width={208}
            height={64}
            priority
            className="h-10 w-auto object-contain sm:h-12 md:h-14 lg:h-16"
          />
        </Link>

        <div className="hidden items-center gap-4 rounded-full border border-white/10 bg-white/15 px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-md md:flex lg:gap-7 lg:px-8 lg:py-3 lg:text-xs lg:tracking-[0.15em]">
          {navigation.map(([label, href]) => (
            <Link key={href} href={href} className="whitespace-nowrap transition-colors hover:text-white/70">
              {label}
            </Link>
          ))}
        </div>

        <div ref={menuRef} className="relative z-20 flex shrink-0 items-center gap-2">
          {navOpen ? (
            <div className="absolute right-0 top-12 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-white/15 bg-[#1a1a38]/95 p-2 text-white shadow-2xl backdrop-blur-xl md:hidden">
              <div className="flex flex-col gap-1">
                {navigation.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setNavOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white/10"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setNavOpen((prev) => !prev)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md md:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <span className="flex flex-col gap-1.5" aria-hidden="true">
              <span className="h-0.5 w-4 bg-current" />
              <span className="h-0.5 w-4 bg-current" />
              <span className="h-0.5 w-4 bg-current" />
            </span>
          </button>

          {!loading && user ? (
            <div className="relative">
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
                      href={user.role === "admin" ? "/admin" : "/dashboard"}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-white/85 hover:bg-white/10 transition-colors"
                    >
                      {user.role === "admin" ? "Admin Panel" : "Dashboard"}
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
            !loading && (
              <Link
                href="/login"
                onClick={() => setNavOpen(false)}
                className="bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#06061b] sm:px-4 sm:text-xs"
              >
                Login
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}