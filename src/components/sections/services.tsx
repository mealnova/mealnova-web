"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Building2,
  PartyPopper,
  UtensilsCrossed,
  ArrowRight,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useServiceOfferings } from "@/lib/hooks/use-content";

const themeMap: Record<string, { icon: LucideIcon; gradient: string }> = {
  primary: { icon: Building2, gradient: "from-[var(--dp-from)] to-[var(--dp-to)]" },
  accent: { icon: PartyPopper, gradient: "from-[var(--color-secondary-500)] to-[var(--color-secondary-600)]" },
  secondary: { icon: UtensilsCrossed, gradient: "from-[var(--color-primary-500)] to-[var(--dp-to)]" },
};

export function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const { data: services, isLoading } = useServiceOfferings();

  if (!isLoading && (!services || services.length === 0)) return null;

  return (
    <section ref={ref} className="py-20 lg:py-28 bg-[var(--color-surface-warm)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none hidden lg:block" style={{ background: "radial-gradient(circle, rgba(15, 23, 42, 0.08), transparent 70%)" }} />

      <div className="container-max relative z-10">
        {/* Section header */}
        <div className="text-center mb-14 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-100)]/50 bg-[var(--color-primary-50)]/50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-primary)] mb-5"
          >
            Our Services
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="display-page text-text-primary mb-5"
          >
            Everything Your{" "}
            <span className="gradient-text-vivid">Workplace Needs</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="body-large max-w-2xl mx-auto"
          >
            From daily office meals to grand celebrations — multi-cuisine
            expertise on every plate.
          </motion.p>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-interactive p-7 lg:p-8">
                <div className="w-14 h-14 rounded-2xl skeleton mb-6" />
                <div className="h-6 skeleton rounded-lg w-48 mb-4" />
                <div className="h-4 skeleton rounded w-full mb-2" />
                <div className="h-4 skeleton rounded w-3/4 mb-8" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-4 skeleton rounded w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service cards */}
        {!isLoading && services && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.slice(0, 3).map((service, index) => {
              const theme = themeMap[service.colorTheme] ?? themeMap.primary;
              const Icon = theme.icon;

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.6,
                    delay: 0.2 + index * 0.12,
                    ease: [0.22, 1, 0.36, 1] as const,
                  }}
                >
                  <Link
                    href={service.ctaLink || "#"}
                    className="group relative block h-full overflow-hidden rounded-[var(--radius-xl)] border border-black/[0.06] bg-[var(--color-surface-card)] p-7 lg:p-8 shadow-[var(--shadow-card)] transition-all duration-350 hover:translate-y-[-6px] hover:shadow-[var(--shadow-card-glow)] hover:border-[var(--color-primary-100)]/40 cursor-pointer"
                  >
                    {/* Gradient top border on hover */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--dp-from)] via-[var(--color-primary-500)] to-[var(--color-secondary-500)] opacity-0 transition-opacity duration-350 group-hover:opacity-100" />

                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    <h3 className="text-lg font-bold text-text-primary mt-6 tracking-tight">
                      {service.title}
                    </h3>

                    <p className="text-[14px] text-text-secondary leading-relaxed mt-2.5">
                      {service.description}
                    </p>

                    {service.features && service.features.length > 0 && (
                      <ul className="space-y-2.5 mt-6">
                        {service.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-[13px] text-text-secondary">
                            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#d9e2ec]">
                              <Check className="w-2.5 h-2.5 text-[var(--color-text-primary)]" />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center gap-2 mt-8 pt-5 border-t border-black/[0.04]">
                      <span className="text-sm font-bold text-[var(--color-text-primary)] transition-colors duration-200 group-hover:text-[var(--color-text-primary)]">
                        {service.ctaText || "Learn more"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[var(--color-text-primary)] transition-transform duration-250 group-hover:translate-x-2" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
