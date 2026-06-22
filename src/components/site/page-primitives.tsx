"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { getPathLocale, localizeHref } from "@/lib/locale-paths";
import { cn } from "@/lib/utils";
import {
  MaskedLines,
  LedgerRule,
  MagneticButton,
  RevealUp,
} from "@/components/ui/motion-primitives";

type Action = {
  href: string;
  label: string;
  variant?: ButtonProps["variant"];
  icon?: ReactNode;
};

type Metric = {
  label: string;
  value: string;
  detail?: string;
};

/* ── Title that reveals line-by-line when given a string ───────────────────── */
function splitLines(text: string, maxLines = 2): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length <= 3) return [text];
  const lines = Math.min(maxLines, Math.max(1, Math.round(words.length / 4)));
  const per = Math.ceil(words.length / lines);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "));
  return out;
}

function DisplayTitle({
  title,
  className,
  maxLines = 2,
}: {
  title: ReactNode;
  className?: string;
  maxLines?: number;
}) {
  if (typeof title === "string") {
    return (
      <span className={className}>
        <MaskedLines lines={splitLines(title, maxLines)} />
      </span>
    );
  }
  return <span className={className}>{title}</span>;
}

/* ── Ledger eyebrow — warm-brown small-caps marker + drawn hairline ────────── */
function LedgerEyebrow({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <div className={cn("flex items-center gap-4", center && "justify-center")}>
      <span className="ledger-index">{children}</span>
      <LedgerRule className={cn("max-w-[5rem]", center && "max-w-[3rem]")} />
    </div>
  );
}

export function ActionButton({
  action,
  size = "lg",
  className,
  magnetic = false,
}: {
  action: Action;
  size?: ButtonProps["size"];
  className?: string;
  magnetic?: boolean;
}) {
  const pathname = usePathname();
  const locale = getPathLocale(pathname);
  const href = localizeHref(action.href, locale);
  const content = (
    <>
      {action.label}
      {action.icon ?? <ArrowRight className="h-4 w-4" />}
    </>
  );
  const isInternal = href.startsWith("/") || href.startsWith("#");

  const button = (
    <Button variant={action.variant ?? "primary"} size={size} className={className} asChild>
      {isInternal ? <Link href={href}>{content}</Link> : <a href={href}>{content}</a>}
    </Button>
  );

  return magnetic ? <MagneticButton>{button}</MagneticButton> : button;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        align === "right" && "ml-auto text-right",
        className,
      )}
    >
      {eyebrow ? <LedgerEyebrow center={align === "center"}>{eyebrow}</LedgerEyebrow> : null}
      <h2 className="section-title mt-5 text-[var(--color-text-primary)]">
        <DisplayTitle title={title} />
      </h2>
      {description ? (
        <p className={cn("body-large mt-4 text-pretty", align === "center" && "mx-auto")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function MetricGrid({ items, className }: { items: Metric[]; className?: string }) {
  return (
    <div className={cn("grid gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item, i) => (
        <RevealUp key={`${item.label}-${item.value}`} delay={i * 0.06}>
          <div className="ledger-index mb-2">{String(i + 1).padStart(2, "0")}</div>
          <LedgerRule className="mb-3 max-w-[3rem]" />
          <div className="display-section leading-none text-[var(--color-primary-600)]">
            {item.value}
          </div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {item.label}
          </div>
          {item.detail ? (
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {item.detail}
            </p>
          ) : null}
        </RevealUp>
      ))}
    </div>
  );
}

export function InfoCard({
  icon: Icon,
  title,
  description,
  eyebrow,
  children,
  className,
  tone = "light",
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  children?: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl p-7 transition-all duration-300",
        dark
          ? "text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)]"
          : "border border-[var(--color-text-primary)]/8 bg-white shadow-[0_1px_2px_rgba(16,24,25,0.03)] hover:-translate-y-1 hover:border-[var(--color-primary-500)]/25 hover:shadow-[0_18px_44px_-22px_rgba(16,24,25,0.18)]",
        className,
      )}
      style={dark ? { background: "linear-gradient(145deg, var(--dp-from), var(--dp-to))" } : undefined}
    >
      {dark ? <div className="grain-overlay" /> : null}
      <div className="relative">
        {Icon ? (
          <span
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-xl",
              dark ? "bg-white/10 text-white" : "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]",
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        {eyebrow ? (
          <div className={cn("ledger-index mt-5", dark && "text-white/55")}>{eyebrow}</div>
        ) : null}
        <h3
          className={cn(
            "mt-4 text-h3",
            dark ? "text-white" : "text-[var(--color-text-primary)]",
          )}
        >
          {title}
        </h3>
        {description ? (
          <p
            className={cn(
              "mt-3 text-sm leading-relaxed",
              dark ? "text-white/68" : "text-[var(--color-text-secondary)]",
            )}
          >
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  metrics,
  aside,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  actions?: Action[];
  metrics?: Metric[];
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("page-hero", className)}>
      <div className="container-max relative z-10">
        <div className={cn("page-hero-grid", !aside && "max-w-4xl")}>
          <div>
            {eyebrow ? <LedgerEyebrow>{eyebrow}</LedgerEyebrow> : null}
            <h1 className="display-page mt-6 text-[var(--color-text-primary)]">
              <DisplayTitle title={title} maxLines={3} />
            </h1>
            <p className="body-large mt-6 max-w-2xl text-pretty">{description}</p>

            {actions?.length ? (
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {actions.map((action, i) => (
                  <ActionButton
                    key={action.href + action.label}
                    action={action}
                    magnetic={i === 0}
                  />
                ))}
              </div>
            ) : null}

            {metrics?.length ? (
              <div className="mt-12 max-w-2xl">
                <LedgerRule />
                <div className={cn("grid gap-x-8 gap-y-6 pt-6", aside ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
                  {metrics.map((metric, index) => (
                    <RevealUp key={`${metric.label}-${metric.value}`} delay={index * 0.06}>
                      <div className="ledger-index mb-1.5">{String(index + 1).padStart(2, "0")}</div>
                      <div className="display-section leading-none text-[var(--color-primary-600)]">
                        {metric.value}
                      </div>
                      <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                        {metric.label}
                      </div>
                      {metric.detail ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                          {metric.detail}
                        </p>
                      ) : null}
                    </RevealUp>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {aside ? <RevealUp delay={0.12}>{aside}</RevealUp> : null}
        </div>
      </div>
    </section>
  );
}

export function PageCta({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  actions: Action[];
  className?: string;
}) {
  return (
    <section className={cn("page-section", className)}>
      <div className="container-max">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-text-primary)]/8 bg-[var(--color-surface-card)] px-8 py-[clamp(3rem,5vw,4.5rem)] lg:px-14">
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              {eyebrow ? <LedgerEyebrow>{eyebrow}</LedgerEyebrow> : null}
              <h2 className="section-title mt-5 text-[var(--color-text-primary)]">
                <DisplayTitle title={title} />
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
                {description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {actions.map((action, i) => (
                <ActionButton
                  key={action.href + action.label}
                  action={action}
                  magnetic={i === 0}
                  className={
                    action.variant === "outline"
                      ? "border-[var(--color-text-primary)]/12 bg-white text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)]/25"
                      : ""
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
