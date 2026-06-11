import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Apple-style modular bento grid. Children control their own spans via the
 * BentoCard `span` prop (out of 6 columns at md+; single column on mobile).
 */
export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-5 md:grid-cols-6", className)}>{children}</div>;
}

export function BentoCard({
  children,
  span = 2,
  tone = "glass",
  className,
}: {
  children: ReactNode;
  span?: 2 | 3 | 4 | 6;
  tone?: "glass" | "dark" | "cream";
  className?: string;
}) {
  const spanClass = { 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4", 6: "md:col-span-6" }[span];
  const toneClass = {
    glass: "glass-panel",
    dark: "relative overflow-hidden text-white bg-[linear-gradient(145deg,var(--dp-from),var(--dp-to))]",
    cream: "bg-[var(--color-surface-card)] border border-[var(--color-primary-100)]",
  }[tone];

  return (
    <div className={cn("rounded-3xl p-7 lift-glow", spanClass, toneClass, className)}>
      {tone === "dark" && <div className="grain-overlay" aria-hidden />}
      <div className="relative">{children}</div>
    </div>
  );
}
