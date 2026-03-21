"use client";

import { useEffect, useMemo, useState } from "react";

function pad(num: number) {
  return `${num}`.padStart(2, "0");
}

export function Countdown({ targetISO }: { targetISO: string }) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const parts = useMemo(() => {
    const distance = new Date(targetISO).getTime() - now;
    if (distance <= 0) return { days: "00", hours: "00", mins: "00", secs: "00" };

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((distance / (1000 * 60)) % 60);
    const secs = Math.floor((distance / 1000) % 60);

    return { days: `${days}`, hours: pad(hours), mins: pad(mins), secs: pad(secs) };
  }, [now, targetISO]);

  return (
    <div className="hidden md:flex font-[var(--font-roboto-mono)] font-medium text-xl md:text-2xl text-white/80 mb-16 gap-2">
      <span className="text-white">{parts.days}</span> DAYS | <span className="text-white">{parts.hours}</span> HOURS |
      <span className="text-white"> {parts.mins}</span> MIN | <span className="text-white">{parts.secs}</span> SEC
    </div>
  );
}
