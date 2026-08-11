"use client";

import Link from "next/link";
import { Segment } from "@/types/models";
import { motion } from "framer-motion";

function getSafeImageUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmedUrl = url.trim();
  if (trimmedUrl === "") return null;
  try {
    const parsed = new URL(trimmedUrl);
    if (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.trim() !== ""
    ) {
      return trimmedUrl;
    }
    return null;
  } catch {
    return null;
  }
}

export function SegmentsGrid({
  segments,
  ctaLabel,
}: {
  segments: Segment[];
  ctaLabel?: string;
}) {
  return (
    <section id="segments" className="relative z-10 overflow-hidden border-t border-white/10 bg-[#030207] px-4 py-20 sm:px-6 md:px-12 md:py-32">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8"
        >
          <h2 className="font-[var(--font-anton)] text-[clamp(2.5rem,8vw,5rem)] uppercase leading-none tracking-[-0.03em] text-white">Our Segments</h2>
          <a href="/register" className="bg-[#6972fd] hover:bg-[#5b63ea] text-white px-8 py-4 text-xs font-bold tracking-[0.15em] uppercase font-[var(--font-inter)] transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(105,114,253,0.3)] hover:shadow-[0_0_30px_rgba(105,114,253,0.6)]">
            {ctaLabel ?? "REGISTER NOW"}
          </a>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {segments.map((segment, idx) => {
            const imageUrl = getSafeImageUrl(segment.image);
            const segmentName = typeof segment.name === "string" && segment.name.trim() !== ""
              ? segment.name
              : "Segment";

            return (
              <Link key={segment.$id} href={`/events/${segment.$id}`} className="contents">
              <motion.article 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group cursor-pointer overflow-hidden border border-white/15 bg-[#080612] transition-all duration-500 hover:-translate-y-1 hover:border-[#6f22d9]/70 hover:shadow-[0_14px_36px_rgba(111,34,217,0.22)]"
              >
                <div className="aspect-[4/3] w-full relative overflow-hidden bg-gray-900">
                  {imageUrl ? (
                    <img
                      src={imageUrl || "https://placehold.co/600x400/EEE/31343C"}
                      alt={segmentName}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-in-out"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#0a0a2a] flex items-center justify-center group-hover:scale-110 transition-all duration-700 ease-in-out">
                      <span className="text-white/20 text-6xl font-bold font-[var(--font-anton)] uppercase">{segmentName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06061b] via-[#06061b]/50 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-500" />
                </div>
                <div className="p-6 md:p-8 text-center bg-[#06061b] border-t border-white/5 relative z-10">
                  <h4 className="font-[var(--font-inter)] text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-[#6972fd] transition-colors duration-300">{segmentName}</h4>
                </div>
              </motion.article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
