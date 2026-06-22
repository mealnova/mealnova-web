"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

/* ──────────────────────────────────────────────────────────────────────────
   Shared motion vocabulary — reduced-motion-aware, transform/opacity only.
   The Service Ledger direction: authored, reversible, scroll-driven motion.
   ────────────────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Scrub-driven line (mapped to an external scroll progress) ─────────────── */
function ScrubLine({
  text,
  progress,
  start,
  end,
}: {
  text: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}) {
  const y = useTransform(progress, [start, end], ["115%", "0%"]);
  const opacity = useTransform(progress, [start, (start + end) / 2], [0, 1]);
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span style={{ y, opacity }} className="block will-change-transform">
        {text}
      </motion.span>
    </span>
  );
}

/* ── In-view line (one-shot reveal on enter) ───────────────────────────────── */
function InViewLine({ text, index }: { text: string; index: number }) {
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span
        variants={{
          hidden: { y: "115%" },
          visible: { y: "0%" },
        }}
        transition={{ duration: 0.85, ease: EASE, delay: index * 0.08 }}
        className="block will-change-transform"
      >
        {text}
      </motion.span>
    </span>
  );
}

/**
 * MaskedLines — line-by-line serif reveal.
 * Pass `progress` (a scrollYProgress MotionValue) for a reversible scrub reveal;
 * omit it for a one-shot whileInView reveal. Full text stays accessible via aria-label.
 */
export function MaskedLines({
  lines,
  className,
  progress,
  startAt = 0.05,
  perLine = 0.16,
}: {
  lines: string[];
  className?: string;
  progress?: MotionValue<number>;
  startAt?: number;
  perLine?: number;
}) {
  const reduce = useReducedMotion();
  const text = lines.join(" ");

  if (reduce) {
    return <span className={className} aria-label={text}>{lines.map((l, i) => <span key={i} className="block">{l}</span>)}</span>;
  }

  if (progress) {
    return (
      <span className={className} aria-label={text}>
        {lines.map((l, i) => (
          <ScrubLine key={i} text={l} progress={progress} start={startAt + i * perLine} end={startAt + i * perLine + perLine + 0.06} />
        ))}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-12% 0px" }}
    >
      {lines.map((l, i) => (
        <InViewLine key={i} text={l} index={i} />
      ))}
    </motion.span>
  );
}

/** LedgerRule — warm-brown hairline that draws on enter (the ledger through-line). */
export function LedgerRule({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={`ledger-rule ${className ?? ""}`}
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={reduce ? undefined : { scaleX: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, ease: EASE }}
    />
  );
}

/** MagneticButton — spring-pulls its child toward the cursor; disabled under reduced-motion. */
export function MagneticButton({
  children,
  className,
  strength = 0.32,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  function onMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: reduce ? 0 : sx, y: reduce ? 0 : sy, display: "inline-flex" }}
      className={className}
    >
      {children}
    </motion.span>
  );
}

/** RevealUp — generic reduced-motion-safe entrance for blocks. */
export function RevealUp({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
