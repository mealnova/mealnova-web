"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatedCounter } from "@/components/shared/animated-counter";

export interface StatsSectionItem {
  target: number;
  suffix?: string;
  label: string;
  description: string;
}

export function StatsSection({ stats }: { stats: StatsSectionItem[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-16 lg:py-24 overflow-hidden bg-[#0f172a]"
    >
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ca8a04]/30 to-transparent" />
      {/* Bottom border */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="container-max relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: 0.1 + index * 0.1,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="relative text-center px-4 lg:px-8"
            >
              {/* Vertical divider — desktop only, not before first item */}
              {index > 0 && (
                <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 h-12 w-px bg-white/[0.06]" />
              )}

              <div className="mb-3">
                <motion.span
                  className="inline-block text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight"
                  animate={
                    isInView
                      ? {
                          textShadow: [
                            "0 0 0px rgba(202,138,4,0)",
                            "0 0 20px rgba(202,138,4,0.2)",
                            "0 0 8px rgba(202,138,4,0.1)",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 2,
                    delay: 2.2 + index * 0.1,
                    ease: "easeInOut",
                  }}
                >
                  <AnimatedCounter
                    target={stat.target}
                    suffix={stat.suffix}
                    duration={2}
                  />
                </motion.span>
              </div>

              <div className="text-xs font-semibold text-[#ca8a04] uppercase tracking-widest mb-1.5">
                {stat.label}
              </div>

              <div className="text-xs text-white/35 leading-relaxed">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
