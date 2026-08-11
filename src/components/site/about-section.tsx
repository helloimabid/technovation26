"use client";

import { motion } from "framer-motion";

export function AboutSection({
  highlightTitle,
  highlightBody,
  teaserCaption,
}: {
  highlightTitle?: string;
  highlightBody?: string;
  teaserCaption?: string;
}) {
  return (
    <>
      <section id="about" className="relative z-10 flex items-center justify-center overflow-hidden border-y border-white/10 bg-[#3825a8] px-4 py-20 text-center sm:px-6 md:px-12 md:py-32 md:text-left">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto flex flex-col gap-8 md:gap-12 relative z-10"
        >
          <p className="font-[var(--font-inter)] text-3xl md:text-4xl lg:text-[2.5rem] leading-tight md:leading-snug text-white/90">
            <span className="block max-w-full whitespace-nowrap font-[var(--font-anton)] text-[clamp(2rem,7vw,3.5rem)] uppercase tracking-[-0.03em] text-white drop-shadow-lg sm:inline">
              {highlightTitle ?? "TECNOVATION'26 DHAKA"}
            </span>{" "}
            {highlightBody ?? "will inspire you to think bigger about the way you code and design. Join us for never-before-seen tech showcases, intense competitions, sessions from industry leaders, and a community of innovators."}
          </p>
          <p className="font-[var(--font-inter)] text-xl md:text-2xl lg:text-[1.75rem] leading-snug text-white/80 font-medium">
            Here&apos;s an overview of what you can expect — check out our teaser below!
          </p>
        </motion.div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-black/10 rounded-full blur-[80px] pointer-events-none" />
      </section>

      <section className="relative z-10 border-b border-white/20 bg-[#3825a8] px-4 pb-20 sm:px-6 md:px-12 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="group relative aspect-video w-full overflow-hidden border border-white/25 bg-[#030207] shadow-[0_18px_50px_rgba(3,2,7,0.55)]"
          >
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#06061b] to-[#12132b]">
             
              <p className="pointer-events-none absolute bottom-8 left-1/2 max-w-[92%] -translate-x-1/2 whitespace-nowrap text-center font-[var(--font-anton)] text-[clamp(1.25rem,7vw,3.75rem)] uppercase tracking-[0.08em] text-white/10">
                {teaserCaption ?? "Teaser Coming Soon"}
              </p>
            </div>
            
            {/* Glow effect that follows the container slightly */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#6972fd]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </motion.div>
        </div>
      </section>
    </>
  );
}
