"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useClientLogos } from "@/lib/hooks/use-content";

export function ClientsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const { data: clients, isLoading } = useClientLogos();

  if (!isLoading && (!clients || clients.length === 0)) return null;

  const scrollClients = clients ? [...clients, ...clients] : [];

  if (isLoading) {
    return (
      <section
        ref={ref}
        className="relative py-12 overflow-hidden bg-[var(--color-surface)]"
      >
        <div className="container-max mb-6">
          <p className="eyebrow justify-center text-text-muted">
            Trusted by leading organizations
          </p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 px-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl shrink-0"
            >
              <div className="skeleton w-8 h-8 !rounded-full" />
              <div className="skeleton h-3 w-20 !rounded-md" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      className="relative py-12 overflow-hidden bg-[var(--color-surface)]"
    >
      <div className="container-max mb-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
          className="eyebrow justify-center text-text-muted"
        >
          Trusted by leading organizations
        </motion.p>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Gradient fade edges — matched to cream bg */}
        <div
          className="absolute left-0 top-0 bottom-0 w-20 sm:w-28 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, var(--color-surface), transparent)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-20 sm:w-28 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, var(--color-surface), transparent)",
          }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center gap-4 sm:gap-6 animate-marquee"
          style={{ width: "max-content" }}
        >
          {scrollClients.map((client, index) => (
            <div
              key={`${client.id}-${index}`}
              className="site-panel-static !rounded-xl !shadow-none flex items-center gap-2.5 px-5 py-3 shrink-0 border-black/[0.05] bg-[var(--color-surface-card)] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-350 cursor-pointer"
            >
              {client.imageUrl ? (
                <img
                  src={client.imageUrl}
                  alt={client.name}
                  className="w-8 h-8 rounded-lg object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white tracking-tight">
                    {client.name
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 3)}
                  </span>
                </div>
              )}
              <span className="text-[13px] font-semibold text-text-secondary whitespace-nowrap">
                {client.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
