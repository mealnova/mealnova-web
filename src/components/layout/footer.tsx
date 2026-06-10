"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  Clock3,
  Mail,
  MapPin,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { useBrandSettings } from "@/lib/hooks/use-content";
import { getPathLocale, localizeHref } from "@/lib/locale-paths";
import { useResolvedStructuredPageContent } from "@/lib/page-content";

interface FooterContent {
  hero?: {
    eyebrow?: string;
    title: string;
    description?: string;
    linkLabel?: string;
    linkHref?: string;
  };
  serviceHeading?: string;
  companyHeading?: string;
  contactHeading?: string;
  serviceLinks?: Array<{ href: string; label: string }>;
  companyLinks?: Array<{ href: string; label: string }>;
  policyLinks?: Array<{ href: string; label: string }>;
  coverage?: string[];
  sinceLabel?: string;
  brandDescription?: string;
  locationText?: string;
  hoursText?: string;
  copyrightText?: string;
}

function resolveFooterContent(
  content: FooterContent | null | undefined,
  brandTagline: string,
): FooterContent {
  const safeLinks = (
    links: FooterContent["serviceLinks"] | FooterContent["companyLinks"] | FooterContent["policyLinks"],
  ) =>
    links?.filter((link) => link?.href?.trim() && link?.label?.trim())?.length
      ? links.filter((link) => link?.href?.trim() && link?.label?.trim())
      : [];

  return {
    hero: {
      eyebrow: content?.hero?.eyebrow?.trim() || undefined,
      title: content?.hero?.title?.trim() || "",
      description: content?.hero?.description?.trim() || undefined,
      linkLabel: content?.hero?.linkLabel?.trim() || undefined,
      linkHref: content?.hero?.linkHref?.trim() || undefined,
    },
    serviceHeading: content?.serviceHeading?.trim() || undefined,
    companyHeading: content?.companyHeading?.trim() || undefined,
    contactHeading: content?.contactHeading?.trim() || undefined,
    serviceLinks: safeLinks(content?.serviceLinks),
    companyLinks: safeLinks(content?.companyLinks),
    policyLinks: safeLinks(content?.policyLinks),
    coverage: content?.coverage?.filter((area) => area?.trim()) ?? [],
    sinceLabel: content?.sinceLabel?.trim() || undefined,
    brandDescription: content?.brandDescription?.trim() || brandTagline || undefined,
    locationText: content?.locationText?.trim() || undefined,
    hoursText: content?.hoursText?.trim() || undefined,
    copyrightText: content?.copyrightText?.trim() || undefined,
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

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: brand } = useBrandSettings();
  const { data: content } = useResolvedStructuredPageContent<FooterContent>("site-footer", {
    brand,
    date: { year: currentYear },
  });
  const phone = brand?.phone?.trim() ?? "";
  const email = brand?.email?.trim() ?? "";
  const siteName = brand?.siteName?.trim() ?? "";
  const brandTagline = brand?.tagline?.trim() ?? "";
  const initials = siteInitials(siteName);
  const resolvedContent = resolveFooterContent(content, brandTagline);
  const pathname = usePathname();
  const locale = getPathLocale(pathname);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <footer className="relative bg-[var(--color-surface-dark)] pb-8 pt-0 text-white">
      {/* CTA Banner */}
      <div className="border-b border-white/[0.06]">
        {resolvedContent.hero?.title ? (
          <div className="container-max py-12 lg:py-16">
            <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[linear-gradient(145deg,var(--dp-from),var(--dp-to))] px-8 py-8 lg:px-12 lg:py-10">
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-secondary-500)]/50 to-transparent" />

              <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="max-w-2xl">
                  {resolvedContent.hero?.eyebrow ? (
                    <div className="eyebrow text-[var(--color-secondary-500)]">
                      {resolvedContent.hero.eyebrow}
                    </div>
                  ) : null}
                  <h2
                    className="mt-4 text-[clamp(1.5rem,3vw,2.5rem)] leading-tight font-normal tracking-[-0.02em] text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {resolvedContent.hero.title}
                  </h2>
                  {resolvedContent.hero?.description ? (
                    <p className="mt-4 text-sm leading-relaxed text-white/45 lg:text-base">
                      {resolvedContent.hero.description}
                    </p>
                  ) : null}
                </div>
                {resolvedContent.hero?.linkLabel ? (
                  <Link
                    href={localizeHref(resolvedContent.hero?.linkHref ?? "/corporate", locale)}
                    prefetch={false}
                    className="group inline-flex items-center gap-2 rounded-lg bg-[var(--color-secondary-500)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-secondary-600)] cursor-pointer"
                  >
                    {resolvedContent.hero.linkLabel}
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main footer grid */}
      <div className="container-max py-12">
        <div className="grid gap-10 border-b border-white/[0.06] pb-10 lg:grid-cols-[1.2fr_.8fr_.8fr_.9fr]">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xs font-bold tracking-wider text-[var(--color-primary-700)]">
                {initials}
              </span>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">
                  {resolvedContent.sinceLabel ?? ""}
                </div>
                <div className="text-sm font-semibold tracking-[-0.02em] text-white">
                  {siteName}
                </div>
              </div>
            </div>
            {resolvedContent.brandDescription ? (
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/40">
                {resolvedContent.brandDescription}
              </p>
            ) : null}
            {(resolvedContent.coverage ?? []).length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {(resolvedContent.coverage ?? []).map((area) => (
                  <span
                    key={area}
                    className="rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white/50 cursor-default"
                  >
                    {area}
                  </span>
                ))}
              </div>
            ) : null}
            {brand?.fssaiNumber?.trim() ? (
              <div className="mt-5 flex items-center gap-1.5 text-[11px] text-white/30">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-white/25" />
                <span>FSSAI Lic. No: {brand.fssaiNumber.trim()}</span>
              </div>
            ) : null}
          </div>

          {/* Service links */}
          {(resolvedContent.serviceLinks ?? []).length > 0 ? (
            <div>
              {resolvedContent.serviceHeading ? (
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30">
                  {resolvedContent.serviceHeading}
                </div>
              ) : null}
              <div className="mt-5 space-y-3">
                {(resolvedContent.serviceLinks ?? []).map((link) => (
                  <Link
                    key={link.href}
                    href={localizeHref(link.href, locale)}
                    prefetch={false}
                    className="block text-sm text-white/50 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Company links */}
          {(resolvedContent.companyLinks ?? []).length > 0 ? (
            <div>
              {resolvedContent.companyHeading ? (
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30">
                  {resolvedContent.companyHeading}
                </div>
              ) : null}
              <div className="mt-5 space-y-3">
                {(resolvedContent.companyLinks ?? []).map((link) => (
                  <Link
                    key={link.href}
                    href={localizeHref(link.href, locale)}
                    prefetch={false}
                    className="block text-sm text-white/50 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Contact info */}
          <div>
            {resolvedContent.contactHeading ? (
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30">
                {resolvedContent.contactHeading}
              </div>
            ) : null}
            <div className="mt-5 space-y-4 text-sm text-white/45">
              {phone ? (
                <a
                  href={`tel:${phone.replace(/[\s-]/g, "")}`}
                  className="flex items-start gap-3 transition-colors hover:text-white"
                >
                  <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />
                  <span>{phone}</span>
                </a>
              ) : null}
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="flex items-start gap-3 transition-colors hover:text-white"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />
                  <span>{email}</span>
                </a>
              ) : null}
              {resolvedContent.locationText ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />
                  <span>{resolvedContent.locationText}</span>
                </div>
              ) : null}
              {resolvedContent.hoursText ? (
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />
                  <span>{resolvedContent.hoursText}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 pt-6 text-xs text-white/25 lg:flex-row lg:items-center lg:justify-between">
          {resolvedContent.copyrightText ? <p>{resolvedContent.copyrightText}</p> : <span />}
          {(resolvedContent.policyLinks ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {(resolvedContent.policyLinks ?? []).map((link) => (
                <Link
                  key={link.href}
                  href={localizeHref(link.href, locale)}
                  prefetch={false}
                  className="transition-colors duration-200 hover:text-white/50"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[var(--dp-to)] text-white shadow-lg transition-colors duration-200 hover:bg-[var(--color-primary-500)] cursor-pointer"
            aria-label="Scroll to top"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
