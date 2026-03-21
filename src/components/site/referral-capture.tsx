"use client";

import { useEffect } from "react";

export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("tv26_ref", ref);
    }
  }, []);

  return null;
}
