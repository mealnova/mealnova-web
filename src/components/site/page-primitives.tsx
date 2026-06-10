"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  Button,
  type ButtonProps,
} from "@/components/ui/button";
import { getPathLocale, localizeHref } from "@/lib/locale-paths";
import { cn } from "@/lib/utils";

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

export function ActionButton({
  action,
  size = "lg",
  className,
}: {
  action: Action;
  size?: ButtonProps["size"];
  className?: string;
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

  if (isInternal) {
    return (
      <Button
        variant={action.variant ?? "primary"}
        size={size}
        className={className}
        asChild
      >
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      variant={action.variant ?? "primary"}
      size={size}
      className={className}
      asChild
    >
      <a href={href}>{content}</a>
    </Button>
  );
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
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h2 className="section-title mt-4 text-[var(--color-text-primary)]">{title}</h2>
      {description ? (
        <p className="body-large mt-4 text-pretty">{description}</p>
      ) : null}
    </div>
  );
}

export function MetricGrid({
  items,
  className,
}: {
  items: Metric[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="site-panel-static p-5">
          <div className="text-3xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)]">
            {item.value}
          </div>
          <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
            {item.label}
          </div>
          {item.detail ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {item.detail}
            </p>
          ) : null}
        </div>
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
        dark ? "site-panel-dark" : "card-interactive gradient-border",
        "h-full p-6 lg:p-7",
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-lg border",
            dark
              ? "border-white/10 bg-white/5 text-white"
              : "border-black/10 bg-[var(--color-surface)] text-[var(--color-primary-500)]",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      {eyebrow ? (
        <div
          className={cn(
            "muted-label mt-5",
            dark && "text-[var(--color-secondary-500)]",
          )}
        >
          {eyebrow}
        </div>
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
            dark ? "text-white/65" : "text-[var(--color-text-secondary)]",
          )}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
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
  const metricGridClass = aside
    ? "sm:grid-cols-2"
    : "sm:grid-cols-2 xl:grid-cols-4";

  const metricValueClass = (value: ReactNode) => {
    const text =
      typeof value === "string" || typeof value === "number" ? String(value) : "";

    if (text.length > 18) {
      return "text-[clamp(1rem,1.55vw,1.35rem)] break-words leading-tight";
    }

    if (text.length > 10) {
      return "text-[clamp(1.15rem,1.8vw,1.65rem)] break-words leading-tight";
    }

    return "text-[2.2rem]";
  };

  return (
    <section className={cn("page-hero", className)}>
      <div className="container-max">
        <div className={cn("page-hero-grid", !aside && "max-w-4xl")}>
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h1 className="display-page mt-5 text-[var(--color-text-primary)]">{title}</h1>
            <p className="body-large mt-5 max-w-2xl text-pretty">
              {description}
            </p>

            {actions?.length ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {actions.map((action) => (
                  <ActionButton key={action.href + action.label} action={action} />
                ))}
              </div>
            ) : null}

            {metrics?.length ? (
              <div className={cn("mt-10 grid gap-4", metricGridClass)}>
                {metrics.map((metric, index) => (
                  <motion.div
                    key={`${metric.label}-${metric.value}`}
                    className="site-panel-static flex min-h-[8.25rem] flex-col justify-center px-5 py-5 text-center"
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
                  >
                    <div
                      className={cn(
                        "mx-auto max-w-full font-bold tracking-[-0.04em] text-[var(--color-text-primary)]",
                        metricValueClass(metric.value),
                      )}
                    >
                      {metric.value}
                    </div>
                    <div className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                      {metric.label}
                    </div>
                    {metric.detail ? (
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {metric.detail}
                      </p>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            ) : null}
          </motion.div>

          {aside ? (
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {aside}
            </motion.div>
          ) : null}
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
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[linear-gradient(145deg,var(--dp-from),var(--dp-to))] px-8 py-10 lg:px-14 lg:py-14">
          {/* Subtle gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-secondary-500)] to-transparent opacity-60" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              {eyebrow ? <div className="eyebrow text-[var(--color-secondary-500)]">{eyebrow}</div> : null}
              <h2 className="section-title mt-4 text-white">{title}</h2>
              <p className="mt-4 text-base leading-relaxed text-white/55">
                {description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {actions.map((action) => (
                <ActionButton
                  key={action.href + action.label}
                  action={action}
                  className={action.variant === "outline" ? "border-white/15 bg-white/5 text-white hover:bg-white/10" : ""}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
