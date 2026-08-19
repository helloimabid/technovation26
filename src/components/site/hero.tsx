"use client";

import Link from "next/link";
import { Countdown } from "@/components/site/countdown";
import { motion } from "framer-motion";

export function Hero({
  title,
  dateLabel,
  targetDate,
  ctaLabel,
}: {
  title: string;
  dateLabel: string;
  targetDate: string;
  ctaLabel?: string;
}) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-6 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          src="https://framerusercontent.com/assets/WJe8tkvd6ZUTAybBH2Y2kl4I0.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#06061b]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-7xl flex flex-col items-start md:items-center text-left md:text-center mt-12 md:mt-0"
      >
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-[var(--font-roboto-mono)] font-medium text-xs md:text-sm tracking-[0.25em] uppercase mb-6 md:mb-10 text-[#6972fd] bg-[#6972fd]/10 px-4 py-2 border border-[#6972fd]/30 rounded-full"
        >
          {dateLabel}
        </motion.p>

        <div className="flex flex-col items-start md:items-center w-full mb-8 md:mb-12">
          <h1 className="w-full max-w-full break-words font-[var(--font-anton)] text-[clamp(3.5rem,14vw,11rem)] leading-[0.9] uppercase tracking-normal text-white animate-hero-rise drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            {title}
          </h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full md:w-auto"
        >
          <Countdown targetISO={targetDate} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-8 md:gap-12 w-full md:w-auto mt-10 md:mt-12"
        >
          <Link
            href="/register"
            className="group relative bg-[#6972fd] text-white px-10 py-5 text-sm md:text-base font-bold tracking-[0.2em] uppercase font-[var(--font-inter)] transition-all overflow-hidden flex items-center justify-center min-w-[240px] shadow-[0_0_20px_rgba(105,114,253,0.4)] hover:shadow-[0_0_40px_rgba(105,114,253,0.7)] hover:-translate-y-1"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10">{ctaLabel ?? "Register Now"}</span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
