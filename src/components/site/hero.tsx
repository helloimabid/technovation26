"use client";

import Link from "next/link";
import Image from "next/image";
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
    <section className="relative flex min-h-[min(900px,100svh)] flex-col items-center justify-center overflow-hidden bg-[#030207] px-4 pb-20 pt-32 sm:px-6 md:pb-24">
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#030207]" aria-hidden="true">
        <Image src="/poster-theme.png" alt="" fill priority className="object-cover object-center opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,2,7,0.18)_0%,rgba(3,2,7,0.48)_54%,#030207_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(3,2,7,0.7)_100%)]" />
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
          className="max-w-full border-y border-white/25 px-4 py-2 text-center font-[var(--font-roboto-mono)] text-xs font-medium uppercase tracking-[0.28em] text-[#d8d3e7] sm:text-sm md:mb-10 md:tracking-[0.38em]"
        >
          {dateLabel}
        </motion.p>

        <div className="flex flex-col items-start md:items-center w-full mb-8 md:mb-12">
          <h1 className="w-full max-w-full whitespace-nowrap text-center font-[var(--font-anton)] text-[clamp(2.2rem,10vw,9rem)] leading-[0.82] uppercase tracking-[-0.06em] text-white animate-hero-rise drop-shadow-[0_0_18px_rgba(216,211,231,0.5)]">
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
            className="group relative flex min-w-[240px] items-center justify-center border border-white/30 bg-[#6f22d9] px-10 py-5 font-[var(--font-inter)] text-sm font-bold uppercase tracking-[0.24em] text-white transition-all hover:bg-[#3825a8] hover:shadow-[0_0_32px_rgba(111,34,217,0.55)] md:text-base"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10">{ctaLabel ?? "Register Now"}</span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
