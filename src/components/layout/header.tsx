"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, PhoneCall, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPathLocale, localizeHref } from "@/lib/locale-paths";
import { cn } from "@/lib/utils";
import { useBrandSettings } from "@/lib/hooks/use-content";
import { useResolvedStructuredPageContent } from "@/lib/page-content";

interface HeaderContent {
  navItems: Array<{ href: string; label: string }>;
  sinceLabel?: string;
  quoteLabel?: string;
  quoteHref?: string;
  mobileMenuLabel?: string;
  mobile?: {
    reachUsLabel?: string;
    description?: string;
  };
}

function resolveHeaderContent(content?: HeaderContent | null): HeaderContent {
  return {
    navItems: content?.navItems?.filter((item) => item?.href?.trim() && item?.label?.trim()) ?? [],
    sinceLabel: content?.sinceLabel?.trim() || undefined,
    quoteLabel: content?.quoteLabel?.trim() || undefined,
    quoteHref: content?.quoteHref?.trim() || undefined,
    mobileMenuLabel: content?.mobileMenuLabel?.trim() || undefined,
    mobile: {
      reachUsLabel: content?.mobile?.reachUsLabel?.trim() || undefined,
      description: content?.mobile?.description?.trim() || undefined,
    },
  };
}

function siteInitials(siteName: string) {
  const initials = siteName
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "??";
}

export function Header() {
  const { data: brand } = useBrandSettings();
  const { data: content } = useResolvedStructuredPageContent<HeaderContent>("site-header");
  const resolvedContent = resolveHeaderContent(content);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const locale = getPathLocale(pathname);

  const navItems = resolvedContent.navItems;
  const phone = brand?.phone?.trim() ?? "";
  const siteName = brand?.siteName?.trim() ?? "";
  const tagline = brand?.tagline?.trim() ?? "";
  const initials = siteInitials(siteName);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    const clean = pathname?.replace(/^\/(en|hi|mr)/, "") || "/";
    return clean === href || clean.startsWith(href + "/");
  };

  return (
    <>
      <header className="sticky top-0 z-50">
        <motion.div
          className={cn(
            "mx-auto flex max-w-[var(--container-max)] items-center justify-between gap-6 px-6 transition-all duration-300 lg:px-8",
            scrolled
              ? "border-b border-black/10 bg-white/95 py-3 shadow-[var(--shadow-header)] backdrop-blur-xl"
              : "border-b border-transparent bg-white/80 py-4 backdrop-blur-sm",
          )}
          initial={false}
          animate={{ borderColor: scrolled ? "rgba(226,232,240,1)" : "rgba(226,232,240,0)" }}
        >
          {/* Logo */}
          <Link href={localizeHref("/", locale)} className="group flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-700)] text-xs font-bold tracking-wider text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                {resolvedContent.sinceLabel ?? ""}
              </div>
              <div className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
                {siteName}
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={localizeHref(item.href, locale)}
                prefetch={false}
                className={cn(
                  "relative px-4 py-2 text-[13px] font-medium transition-colors duration-200",
                  isActive(item.href)
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-[var(--color-secondary-500)]"
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={phone ? `tel:${phone.replace(/[\s-]/g, "")}` : "#"}
              aria-disabled={!phone}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              {phone}
            </a>
            {resolvedContent.quoteLabel ? (
              <Button size="sm" asChild>
                <Link href={localizeHref(resolvedContent.quoteHref ?? "/corporate", locale)} prefetch={false}>
                  {resolvedContent.quoteLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : null}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#334155] lg:hidden cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </motion.div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-[color:var(--color-surface-dark)]/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 flex w-[min(85vw,24rem)] flex-col border-l border-black/10 bg-white p-6 shadow-[var(--shadow-dropdown)] lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                    {resolvedContent.mobileMenuLabel ?? ""}
                  </div>
                  {tagline ? (
                    <div className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
                      {tagline}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-white text-[var(--color-text-secondary)] cursor-pointer"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.04 }}
                  >
                    <Link
                      href={localizeHref(item.href, locale)}
                      prefetch={false}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-[var(--color-surface-warm)] text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {resolvedContent.mobile?.reachUsLabel ||
              resolvedContent.mobile?.description ||
              phone ||
              resolvedContent.quoteLabel ? (
                <div className="mt-auto space-y-4 border-t border-black/10 pt-8">
                  {resolvedContent.mobile?.reachUsLabel ||
                  resolvedContent.mobile?.description ||
                  phone ? (
                    <div className="rounded-lg border border-black/10 bg-[var(--color-surface)] p-4">
                      {resolvedContent.mobile?.reachUsLabel ? (
                        <div className="muted-label">{resolvedContent.mobile.reachUsLabel}</div>
                      ) : null}
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="mt-2 block text-lg font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]"
                        >
                          {phone}
                        </a>
                      ) : null}
                      {resolvedContent.mobile?.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          {resolvedContent.mobile.description}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {resolvedContent.quoteLabel ? (
                    <Button className="h-11 w-full" asChild>
                      <Link
                        href={localizeHref(resolvedContent.quoteHref ?? "/corporate", locale)}
                        prefetch={false}
                        onClick={() => setMobileOpen(false)}
                      >
                        {resolvedContent.quoteLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
