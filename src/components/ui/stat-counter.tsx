"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/**
 * Counts up from 0 to `value` when scrolled into view.
 * Accepts values like "600+", "15", "4.9★" — animates the numeric part and
 * re-attaches the suffix. Renders the final value immediately under
 * prefers-reduced-motion.
 */
export function StatCounter({
  value,
  duration = 1.4,
  className,
}: {
  value: string | number;
  duration?: number;
  className?: string;
}) {
  const raw = String(value);
  const match = raw.match(/^([\d,.]+)(.*)$/);
  const target = match ? parseFloat(match[1].replace(/,/g, "")) : NaN;
  const suffix = match ? match[2] : "";
  const decimals = match && match[1].includes(".") ? (match[1].split(".")[1] ?? "").length : 0;

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced || Number.isNaN(target) ? raw : "0");

  useEffect(() => {
    if (!inView || reduced || Number.isNaN(target)) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay((target * eased).toFixed(decimals) + suffix);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, target, suffix, duration, decimals]);

  return (
    <span ref={ref} className={className}>
      {Number.isNaN(target) ? raw : display}
    </span>
  );
}
