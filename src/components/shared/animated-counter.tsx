"use client";

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  className,
}: AnimatedCounterProps) {
  return (
    <span className={className}>
      {prefix}
      {target.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
