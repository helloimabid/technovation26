"use client";

import { motion } from "framer-motion";

export function ScheduleTimeline({
  schedule,
  emptyMessage,
}: {
  schedule: Array<{ day: string; events: Array<{ time: string; title: string; location?: string }> }>;
  emptyMessage?: string;
}) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="text-center text-white/50 py-12">
        <p>{emptyMessage ?? "Schedule details will be announced soon."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {schedule.map((dayData, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: i * 0.2 }}
          className="relative"
        >
          {/* Day Header */}
          <div className="sticky top-24 z-20 bg-[#06061b]/90 backdrop-blur-xl py-4 mb-8 border-b border-white/10">
            <h2 className="font-[var(--font-anton)] text-3xl md:text-4xl uppercase tracking-widest text-[#6972fd]">
              {dayData.day}
            </h2>
          </div>

          {/* Timeline container */}
          <div className="relative border-l-2 border-white/10 ml-4 md:ml-8 space-y-12">
            {dayData.events.map((event, j) => (
              <motion.div 
                key={j} 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: j * 0.1 }}
                className="relative pl-8 md:pl-12 group"
              >
                {/* Timeline Dot */}
                <span className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-[#06061b] border-2 border-[#6972fd] group-hover:bg-[#6972fd] group-hover:scale-125 transition-all duration-300 shadow-[0_0_10px_rgba(105,114,253,0)] group-hover:shadow-[0_0_15px_rgba(105,114,253,0.8)]" />
                
                <div className="flex flex-col md:flex-row gap-2 md:gap-8 items-start md:items-baseline">
                  {/* Time */}
                  <div className="md:w-40 shrink-0">
                    <span className="font-[var(--font-roboto-mono)] text-[#6972fd] font-bold tracking-wider text-sm md:text-base bg-[#6972fd]/10 px-3 py-1 rounded-md border border-[#6972fd]/20">
                      {event.time}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 bg-white/5 border border-white/5 hover:border-[#6972fd]/50 rounded-xl p-6 transition-colors duration-300 w-full group-hover:bg-white/10 mt-4 md:mt-0">
                    <h3 className="text-xl md:text-2xl font-[var(--font-inter)] font-semibold text-white mb-3 group-hover:text-[#6972fd] transition-colors">
                      {event.title}
                    </h3>
                    {event.location && (
                      <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
                        <svg className="w-4 h-4 text-[#6972fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
