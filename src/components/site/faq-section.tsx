"use client";

import { motion } from "framer-motion";

type FaqItem = { question: string; answer: string };

export function FaqSection({
  items,
  title,
  description,
}: {
  items: FaqItem[];
  title?: string;
  description?: string;
}) {
  return (
    <section id="faq" className="overflow-hidden bg-white px-4 py-16 text-[#333] relative z-10 sm:px-6 md:px-12 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 lg:flex-row lg:gap-24">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-1/3"
        >
          <h2 className="whitespace-nowrap font-[var(--font-anton)] text-[clamp(2.5rem,8vw,4.5rem)] uppercase tracking-wider text-[#06061b] mb-6">{title ?? "Got questions?"}</h2>
          <p className="font-[var(--font-inter)] text-lg md:text-xl text-[#06061b]/70 font-medium leading-relaxed max-w-sm">
            {description ?? "Find answers to common questions about the event, registration, and participation rules."}
          </p>
        </motion.div>

        <div className="flex w-full flex-col lg:w-2/3">
          {items.map((item, idx) => (
            <motion.details 
              key={item.question} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group border-b border-[#333]/10" 
              open={idx === 0}
            >
              <summary className="flex justify-between items-center py-8 cursor-pointer outline-none list-none relative">
                <h4 className="font-[var(--font-inter)] text-xl md:text-2xl font-bold text-[#333] group-hover:text-[#6972fd] transition-colors pr-8">
                  {item.question}
                </h4>
                <div className="w-8 h-8 rounded-full bg-[#333]/5 group-hover:bg-[#6972fd]/10 flex items-center justify-center shrink-0 transition-colors">
                  <span className="text-xl font-bold text-[#333] group-hover:text-[#6972fd] transition-colors group-open:rotate-45 transform duration-300">
                    +
                  </span>
                </div>
              </summary>
              <div className="pb-8 pr-12">
                <p className="font-[var(--font-inter)] text-lg text-[#333]/70 leading-relaxed font-medium">
                  {item.answer}
                </p>
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
