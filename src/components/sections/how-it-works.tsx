"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Smartphone, ChefHat, Truck, Star } from "lucide-react";

const steps = [
  {
    icon: Smartphone,
    step: "01",
    title: "Browse & Order",
    description:
      "Explore our daily menu or custom event packages. Order online with just a few taps.",
  },
  {
    icon: ChefHat,
    step: "02",
    title: "Freshly Prepared",
    description:
      "Our chefs prepare your meal fresh in our FSSAI-certified kitchen using quality ingredients.",
  },
  {
    icon: Truck,
    step: "03",
    title: "Delivered On Time",
    description:
      "Hot, fresh meals delivered to your office or event venue right on schedule.",
  },
  {
    icon: Star,
    step: "04",
    title: "Enjoy & Rate",
    description:
      "Enjoy a satisfying meal and share your feedback. We continuously improve.",
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-[var(--color-surface-warm)] py-20 lg:py-28">
      <div className="container-max">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="eyebrow text-[var(--color-text-primary)] mb-4"
          >
            HOW IT WORKS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="section-title text-[var(--color-text-primary)] mb-4"
          >
            Four Simple Steps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="text-[var(--color-text-secondary)] max-w-xl mx-auto"
          >
            Getting quality vegetarian meals for your workplace has never been easier.
          </motion.p>
        </div>

        {/* Desktop layout: 4-column grid with connector lines */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-0 relative">
          {/* Horizontal connector line */}
          <div
            className="absolute top-[20px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] border-t-2 border-dashed border-[var(--color-primary-100)] z-0"
            aria-hidden="true"
          />

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative z-10 px-3"
              >
                <div className="site-panel p-6 text-left h-full">
                  {/* Step number circle */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--dp-from)] to-[var(--dp-to)] flex items-center justify-center mb-4">
                    <span className="text-sm font-bold text-white leading-none">
                      {step.step}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-50)] border border-[#d9e2ec] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[var(--color-text-primary)]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-h3 text-[var(--color-text-primary)] mb-2">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile layout: vertical stack with left connector line */}
        <div className="lg:hidden relative">
          {/* Vertical connector line */}
          <div
            className="absolute top-[20px] bottom-[20px] left-[19px] border-l-2 border-dashed border-[var(--color-primary-100)] z-0"
            aria-hidden="true"
          />

          <div className="space-y-5">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.2 + index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative z-10 flex items-start gap-5"
                >
                  {/* Step number circle */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--dp-from)] to-[var(--dp-to)] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white leading-none">
                      {step.step}
                    </span>
                  </div>

                  {/* Card */}
                  <div className="site-panel p-6 flex-1 text-left">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-50)] border border-[#d9e2ec] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[var(--color-text-primary)]" />
                    </div>

                    {/* Title */}
                    <h3 className="text-h3 text-[var(--color-text-primary)] mb-2">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
