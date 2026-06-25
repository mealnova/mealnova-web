"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarRange,
  ChefHat,
  ClipboardCheck,
  Clock3,
  Leaf,
  ShieldCheck,
  Sparkles as SparklesIcon,
  UtensilsCrossed,
  CheckCircle2,
  Star,
  Quote,
  Minus,
  Play,
  Award,
  Users,
  MapPin,
  TrendingUp,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Testimonial } from "@/lib/api";
import type { ClientLogo, ServiceOffering } from "@/lib/cms-api";
import { Badge } from "@/components/ui/badge";
import { AnimatedHeroText } from "@/components/ui/animated-hero";
import { Button } from "@/components/ui/button";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { Sparkles } from "@/components/ui/sparkles";
import { MeshBackdrop } from "@/components/ui/mesh-backdrop";
import { StatCounter } from "@/components/ui/stat-counter";
import {
  MaskedLines,
  LedgerRule,
  MagneticButton,
  RevealUp,
} from "@/components/ui/motion-primitives";
import { InfoCard, PageCta, SectionHeader } from "@/components/site/page-primitives";
import { StatsSection } from "@/components/sections/stats";
import {
  useClientLogos,
  useServiceOfferings,
  useTestimonials,
} from "@/lib/hooks/use-content";
import {
  type CmsCardItem,
  type CmsCtaContent,
  type CmsHeroContent,
  type CmsMetric,
  type CmsSectionHeader,
  mapCmsActionVariant,
  useStructuredPageContent,
} from "@/lib/page-content";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { localizeHref } from "@/lib/locale-paths";

type DisplayService = Omit<ServiceOffering, "icon"> & { icon: LucideIcon };

const fallbackClientNames: string[] = [];
const fallbackTestimonials: Testimonial[] = [];
const searchServiceHighlights = [
  {
    icon: Building2,
    title: "Corporate catering services in Pune",
    description:
      "Managed corporate catering, office lunch programs, cafeteria operations, and employee meal plans for Pune workplaces and tech parks.",
  },
  {
    icon: CalendarRange,
    title: "Event catering and vegetarian menus",
    description:
      "Wedding catering, corporate event catering, buffet planning, and pure vegetarian menus for launches, conferences, and celebrations.",
  },
  {
    icon: MapPin,
    title: "Service coverage across Pune",
    description:
      "Mealnova supports Baner, Balewadi, Hinjewadi, Wakad, Kharadi, Magarpatta, and nearby business districts with scheduled catering operations.",
  },
] as const;
const searchFaqs = [
  {
    title: "Do you provide corporate catering services in Pune?",
    description:
      "Mealnova supports corporate catering in Pune with office lunch programs, employee meal plans, managed cafeteria operations, and recurring service for workplaces and business parks.",
  },
  {
    title: "Which Pune locations do you cover for catering?",
    description:
      "The service footprint highlighted on the public site includes Baner, Balewadi, Hinjewadi, Wakad, Kharadi, and Magarpatta, with routing planned around supported business districts.",
  },
  {
    title: "Can companies onboard and request event catering online?",
    description:
      "Yes. Companies can start onboarding online through the corporate flow, and event clients can build a catering request online before the team reviews the brief and issues the next steps.",
  },
] as const;
const SEO_HERO_TITLE = "Corporate catering services in Pune for teams and events";
const SEO_HERO_DESCRIPTION =
  "Mealnova provides corporate catering services in Pune, office meal programs, cafeteria management, and vegetarian event catering for workplaces and celebrations across Baner, Balewadi, Hinjewadi, Wakad, Kharadi, and Magarpatta.";

export interface HomePageContent {
  hero: CmsHeroContent;
  services: {
    header: CmsSectionHeader;
    cardEyebrow?: string;
    linkLabel?: string;
    logoEyebrow?: string;
    emptyState?: { title: string; description: string };
  };
  howItWorks: {
    header: CmsSectionHeader;
    steps: Array<{ title: string; description: string }>;
  };
  stats: Array<{
    target: number;
    suffix?: string;
    label: string;
    description: string;
  }>;
  todaysMenu: {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: { href: string; label: string };
    secondaryAction: { href: string; label: string; variant?: "outline" };
    itemCategoryFallback?: string;
    emptyState?: { title: string; description: string };
  };
  testimonials: {
    header: CmsSectionHeader;
  };
  corporate: {
    visualEyebrow: string;
    visualTitle: string;
    visualDescription: string;
    visualPoints: string[];
    contentEyebrow: string;
    contentTitle: string;
    contentDescription: string;
    features: Array<{ label: string; detail: string }>;
    primaryAction: { href: string; label: string };
    secondaryAction: { href: string; label: string; variant?: "outline" };
  };
  cta: CmsCtaContent;
}

function resolveSectionHeader(header: CmsSectionHeader | undefined): CmsSectionHeader {
  return {
    eyebrow: header?.eyebrow?.trim() || "",
    title: header?.title?.trim() || "",
    description: header?.description?.trim() || "",
    align: header?.align || "left",
  };
}

function resolveAction(
  action:
    | { href?: string; label?: string; variant?: "default" | "outline" | "white" | "ghost" }
    | undefined,
) {
  return {
    href: action?.href?.trim() || "",
    label: action?.label?.trim() || "",
    ...(action?.variant ? { variant: action.variant } : {}),
  };
}

function resolveActionList(
  actions: CmsHeroContent["actions"] | CmsCtaContent["actions"] | undefined,
) {
  return actions?.filter((action) => action?.href?.trim() && action?.label?.trim()) ?? [];
}

function resolveMetricList(metrics: CmsMetric[] | undefined) {
  return metrics?.filter((metric) => metric?.value?.trim() && metric?.label?.trim()) ?? [];
}

function resolveHomePageContent(source: HomePageContent): HomePageContent {
  return {
    hero: {
      eyebrow: source.hero?.eyebrow?.trim() || "",
      title: source.hero?.title?.trim() || "",
      description: source.hero?.description?.trim() || "",
      actions: resolveActionList(source.hero?.actions),
      metrics: resolveMetricList(source.hero?.metrics),
      aside: {
        eyebrow: source.hero?.aside?.eyebrow?.trim() || "",
        title: source.hero?.aside?.title?.trim() || "",
        description: source.hero?.aside?.description?.trim() || "",
        badges: source.hero?.aside?.badges?.filter((badge) => badge?.trim()) ?? [],
        panels:
          source.hero?.aside?.panels?.filter(
            (panel) => panel?.label?.trim() && panel?.description?.trim(),
          ) ?? [],
      },
    },
    services: {
      header: resolveSectionHeader(source.services?.header),
      cardEyebrow: source.services?.cardEyebrow?.trim() || "",
      linkLabel: source.services?.linkLabel?.trim() || "",
      logoEyebrow: source.services?.logoEyebrow?.trim() || "",
      emptyState: {
        title: source.services?.emptyState?.title?.trim() || "",
        description: source.services?.emptyState?.description?.trim() || "",
      },
    },
    howItWorks: {
      header: resolveSectionHeader(source.howItWorks?.header),
      steps:
        source.howItWorks?.steps?.filter((step) => step?.title?.trim() && step?.description?.trim()) ??
        [],
    },
    stats:
      source.stats?.filter(
        (stat) =>
          Number.isFinite(stat?.target) &&
          Boolean(stat?.label?.trim()) &&
          Boolean(stat?.description?.trim()),
      ) ?? [],
    todaysMenu: {
      eyebrow: source.todaysMenu?.eyebrow?.trim() || "",
      title: source.todaysMenu?.title?.trim() || "",
      description: source.todaysMenu?.description?.trim() || "",
      primaryAction: resolveAction(source.todaysMenu?.primaryAction),
      secondaryAction: resolveAction(
        source.todaysMenu?.secondaryAction,
      ) as HomePageContent["todaysMenu"]["secondaryAction"],
      itemCategoryFallback: source.todaysMenu?.itemCategoryFallback?.trim() || "",
      emptyState: {
        title: source.todaysMenu?.emptyState?.title?.trim() || "",
        description: source.todaysMenu?.emptyState?.description?.trim() || "",
      },
    },
    testimonials: {
      header: resolveSectionHeader(source.testimonials?.header),
    },
    corporate: {
      visualEyebrow: source.corporate?.visualEyebrow?.trim() || "",
      visualTitle: source.corporate?.visualTitle?.trim() || "",
      visualDescription: source.corporate?.visualDescription?.trim() || "",
      visualPoints: source.corporate?.visualPoints?.filter((point) => point?.trim()) ?? [],
      contentEyebrow: source.corporate?.contentEyebrow?.trim() || "",
      contentTitle: source.corporate?.contentTitle?.trim() || "",
      contentDescription: source.corporate?.contentDescription?.trim() || "",
      features:
        source.corporate?.features?.filter(
          (feature) => feature?.label?.trim() && feature?.detail?.trim(),
        ) ?? [],
      primaryAction: resolveAction(source.corporate?.primaryAction),
      secondaryAction: resolveAction(
        source.corporate?.secondaryAction,
      ) as HomePageContent["corporate"]["secondaryAction"],
    },
    cta: {
      eyebrow: source.cta?.eyebrow?.trim() || "",
      title: source.cta?.title?.trim() || "",
      description: source.cta?.description?.trim() || "",
      actions: resolveActionList(source.cta?.actions),
    },
  };
}

/* ══════════════════════════════════════════════════════════════════
   ANIMATED COMPONENTS
   ══════════════════════════════════════════════════════════════════ */

/* 3D tilt card on mouse move */
function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(y * -8);
    rotateY.set(x * 8);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}

/* Animated SVG decorative ring */
function AnimatedRing({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.circle
        cx="100"
        cy="100"
        r="80"
        stroke="url(#goldGrad)"
        strokeWidth="0.5"
        strokeDasharray="502"
        initial={{ strokeDashoffset: 502 }}
        animate={{ strokeDashoffset: 0, rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.circle
        cx="100"
        cy="100"
        r="60"
        stroke="url(#goldGrad)"
        strokeWidth="0.3"
        strokeDasharray="377"
        initial={{ strokeDashoffset: 377 }}
        animate={{ strokeDashoffset: 0, rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="var(--color-secondary-500)" stopOpacity="0.4" />
          <stop offset="50%" stopColor="var(--color-secondary-100)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--color-secondary-500)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* Animated horizontal line that draws on scroll */
function DrawLine({ className }: { className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className={className}>
      <motion.div
        className="h-[1px] bg-gradient-to-r from-transparent via-[var(--color-secondary-500)]/40 to-transparent"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "left" }}
      />
    </div>
  );
}

/* Stagger container */
function StaggerGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Reveal wrapper */
function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const initial =
    direction === "left"
      ? { opacity: 0, x: -50 }
      : direction === "right"
        ? { opacity: 0, x: 50 }
        : { opacity: 0, y: 50 };

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Animated counter with morphing number */
function MorphNumber({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={false}
      animate={isInView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {count.toLocaleString("en-IN")}
      {suffix}
    </motion.span>
  );
}

function serviceIcon(service: ServiceOffering): LucideIcon {
  const target =
    `${service.title} ${service.description} ${service.ctaLink ?? ""}`.toLowerCase();
  if (target.includes("corporate") || target.includes("cafeteria"))
    return Building2;
  if (target.includes("event") || target.includes("wedding")) return SparklesIcon;
  return UtensilsCrossed;
}

/* Food photography (design assets in /public/images/food) */
const FOOD_STRIP = [
  { src: "/images/food/biryani.jpg", alt: "Vegetable biryani served in copper handis" },
  { src: "/images/food/paneer-tikka.jpg", alt: "Paneer tikka masala in a kadai" },
  { src: "/images/food/dosa.jpg", alt: "Crisp dosa with chutneys and sambar" },
  { src: "/images/food/thali-real.jpg", alt: "Mealnova daily thali with dal, rice, sabzi and roti" },
  { src: "/images/food/spice-table.jpg", alt: "Slow-cooked masala with naan" },
  { src: "/images/food/chaat.jpg", alt: "Samosas with green chutney" },
];

const FOOD_GALLERY = [
  { src: "/images/food/feast-overhead.jpg", caption: "Pav bhaji nights", span: "md:col-span-7 md:row-span-2", h: "h-72 md:h-full" },
  { src: "/images/food/dosa.jpg", caption: "South Indian mornings", span: "md:col-span-5", h: "h-64" },
  { src: "/images/food/chai-time.jpg", caption: "Chai, brewed slow", span: "md:col-span-5", h: "h-64" },
  { src: "/images/food/spread-table.jpg", caption: "Thali, the classic way", span: "md:col-span-4", h: "h-60" },
  { src: "/images/food/paneer-tikka.jpg", caption: "From the kadai", span: "md:col-span-4", h: "h-60" },
  { src: "/images/food/thali-real.jpg", caption: "Served fresh, daily", span: "md:col-span-4", h: "h-60" },
];

const PATH_PHOTOS = [
  "/images/food/thali-real.jpg",
  "/images/food/biryani.jpg",
  "/images/food/spice-table.jpg",
];

/* ══════════════════════════════════════════════════════════════════
   MAIN HOMEPAGE
   ══════════════════════════════════════════════════════════════════ */

export function HomePage({
  locale = "en",
  initialContent,
  initialServices,
  initialClientLogos,
  initialTestimonials,
}: {
  locale?: string;
  initialContent?: HomePageContent | null;
  initialServices?: ServiceOffering[];
  initialClientLogos?: ClientLogo[];
  initialTestimonials?: Testimonial[];
}) {
  const { data: fetchedContent, isPending } =
    useStructuredPageContent<HomePageContent>("home", {
      initialData: initialContent ?? undefined,
    });
  const sourceContent = fetchedContent ?? initialContent ?? null;
  const { data: servicesData } = useServiceOfferings(initialServices);
  const { data: clientLogos } = useClientLogos(initialClientLogos);
  const { data: testimonialsData } = useTestimonials(initialTestimonials);

  const services =
    servicesData && servicesData.length > 0
      ? servicesData.slice(0, 3).map((service) => ({
          ...service,
          icon: serviceIcon(service),
        }))
      : [];

  const clientNames =
    clientLogos && clientLogos.length > 0
      ? clientLogos.slice(0, 8).map((client) => client.name)
      : fallbackClientNames;

  const testimonials =
    testimonialsData && testimonialsData.length > 0
      ? testimonialsData.slice(0, 3)
      : fallbackTestimonials;
  const orderingPrimaryAction =
    sourceContent?.todaysMenu.primaryAction.href && sourceContent.todaysMenu.primaryAction.label
      ? sourceContent.todaysMenu.primaryAction
      : { href: "/corporate", label: "Start onboarding" };
  const orderingSecondaryAction =
    sourceContent?.todaysMenu.secondaryAction.href && sourceContent.todaysMenu.secondaryAction.label
      ? sourceContent.todaysMenu.secondaryAction
      : { href: "/menu", label: "Browse menu", variant: "outline" as const };

  // SIGNATURE #1 — sticky-pinned scroll-scrubbed hero
  const heroPinRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroPinRef,
    offset: ["start start", "end start"],
  });
  const heroPlateY = useTransform(heroProgress, [0, 1], ["0%", "16%"]);
  const heroPlateScale = useTransform(heroProgress, [0, 1], [1.04, 1.12]);
  const heroAsideOpacity = useTransform(heroProgress, [0, 0.5, 0.92], [1, 1, 0]);

  if (sourceContent == null) {
    if (isPending) {
      return <ContentLoading />;
    }

    return (
      <ContentUnavailable
        content={{
          title: "Content unavailable",
          description:
            "Home page content is missing from the CMS. Publish the home structured page to restore this route.",
        }}
      />
    );
  }

  const content = resolveHomePageContent(sourceContent);
  const heroTitle =
    locale === "en" && !/(corporate|office|cafeteria|pune)/i.test(content.hero.title)
      ? SEO_HERO_TITLE
      : content.hero.title;
  const heroDescription =
    locale === "en" && !/(corporate|office|cafeteria|pune)/i.test(content.hero.description)
      ? SEO_HERO_DESCRIPTION
      : content.hero.description;
  const showOperationsScroll =
    Boolean(content.corporate.visualTitle) &&
    Boolean(content.corporate.visualDescription);

  const heroActions = resolveActionList(content.hero.actions);
  const heroMetrics = resolveMetricList(content.hero.metrics);
  const ctaActions = resolveActionList(content.cta.actions);

  const howItWorks = content.howItWorks.steps.map((step, index) => ({
    ...step,
    icon: [ClipboardCheck, ChefHat, Clock3, BadgeCheck][index] ?? BadgeCheck,
  }));

  const heroLines = (() => {
    const words = heroTitle.trim().split(/\s+/);
    if (words.length <= 3) return [heroTitle];
    const per = Math.ceil(words.length / 3);
    return [
      words.slice(0, per).join(" "),
      words.slice(per, per * 2).join(" "),
      words.slice(per * 2).join(" "),
    ].filter(Boolean);
  })();

  return (
    <>
      {/* ══════════════ 1 · HERO — editorial service ledger (SIGNATURE) ══════════════ */}
      <section
        ref={heroPinRef}
        className="relative isolate overflow-hidden bg-[var(--color-surface)]"
      >
        <MeshBackdrop tone="light" />

        {/* LCP plate — full-height cinematic photography on the right */}
        <motion.div
          style={{ y: heroPlateY, scale: heroPlateScale }}
          className="absolute right-0 top-0 hidden h-full w-[44%] origin-center lg:block"
        >
          <Image
            src="/images/food/thali-real.jpg"
            alt="Mealnova daily thali — dal, rice, sabzi, roti served fresh"
            fill
            priority
            sizes="44vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-surface)]/55 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-px bg-[var(--color-secondary-500)]/30" />
        </motion.div>

        <div className="container-max relative z-10 grid min-h-[clamp(34rem,82vh,52rem)] items-center pb-16 pt-[clamp(7rem,12vh,9rem)]">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <span className="ledger-index">{content.hero.eyebrow || "Est. 2009 · Pune"}</span>
              <LedgerRule className="max-w-[6rem]" />
            </div>

            <h1 className="display-hero mt-7 text-[var(--color-text-primary)]">
              <MaskedLines lines={heroLines} />
            </h1>

            <motion.div style={{ opacity: heroAsideOpacity }}>
              <p className="mt-7 max-w-xl text-[1.075rem] leading-relaxed text-[var(--color-text-secondary)]">
                {heroDescription}
              </p>

              {heroActions.length > 0 ? (
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  {heroActions.map((action, index) =>
                    index === 0 ? (
                      <MagneticButton key={action.href}>
                        <Button variant="primary" size="lg" asChild>
                          <Link href={localizeHref(action.href, locale)}>
                            {action.label}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </MagneticButton>
                    ) : (
                      <Link
                        key={action.href}
                        href={localizeHref(action.href, locale)}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-text-primary)]/12 bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition-colors duration-200 hover:border-[var(--color-text-primary)]/25"
                      >
                        {action.label}
                      </Link>
                    ),
                  )}
                </div>
              ) : null}

              {heroMetrics.length > 0 ? (
                <div className="mt-14 max-w-2xl">
                  <LedgerRule />
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-6 sm:grid-cols-4">
                    {heroMetrics.map((metric, i) => (
                      <div key={metric.label}>
                        <div className="ledger-index mb-2">{String(i + 1).padStart(2, "0")}</div>
                        <StatCounter
                          value={metric.value}
                          className="display-section block leading-none text-[var(--color-primary-600)]"
                        />
                        <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        </div>

        {/* Trusted-by marquee — quiet, neutral */}
        <div className="relative z-10 border-t border-[var(--color-text-primary)]/8 bg-white/70 py-5 backdrop-blur-sm">
          <div className="container-max">
            {content.services.logoEyebrow ? (
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                {content.services.logoEyebrow}
              </div>
            ) : null}
            <div className="relative mt-3 h-9 overflow-hidden">
              <InfiniteSlider className="flex h-full w-full items-center" duration={32} durationOnHover={70} gap={48}>
                {clientNames.map((client) => (
                  <div
                    key={client}
                    className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm font-semibold tracking-wide text-[var(--color-text-muted)] transition-colors duration-200 hover:text-[var(--color-text-primary)]"
                  >
                    {client}
                    <span className="h-1 w-1 rounded-full bg-[var(--color-text-primary)]/15" />
                  </div>
                ))}
              </InfiniteSlider>
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 1b · TASTE STRIP — seamless food ribbon (edge-to-edge, no frames) ══════════════ */}
      <section className="overflow-hidden bg-white">
        <InfiniteSlider className="flex w-full items-stretch" duration={60} durationOnHover={140} gap={0}>
          {FOOD_STRIP.map((photo) => (
            <figure key={photo.src} className="shrink-0 overflow-hidden">
              <Image
                src={photo.src}
                alt={photo.alt}
                width={420}
                height={520}
                className="h-[240px] w-[190px] object-cover sm:h-[300px] sm:w-[240px]"
              />
            </figure>
          ))}
        </InfiniteSlider>
      </section>

      {/* ══════════════ 2 · INDUSTRY PATHS — white cards, hairline borders ══════════════ */}
      <section className="bg-white pb-[clamp(4rem,7vw,6rem)] pt-[clamp(4rem,7vw,6rem)]">
        <div className="container-max">
          <div className="grid items-end gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
            <div>
              {content.services.header.eyebrow ? (
                <div className="eyebrow text-[var(--color-primary-600)]">
                  {content.services.header.eyebrow}
                </div>
              ) : null}
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.1] font-normal text-[var(--color-text-primary)]">
                {content.services.header.title}
              </h2>
            </div>
            {content.services.header.description ? (
              <p className="text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
                {content.services.header.description}
              </p>
            ) : null}
          </div>

          {services.length > 0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Reveal key={service.id} className="h-full">
                    <article className="group relative h-full overflow-hidden rounded-2xl border border-[var(--color-text-primary)]/8 bg-white shadow-[0_1px_2px_rgba(16,24,25,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary-500)]/25 hover:shadow-[0_16px_40px_-20px_rgba(16,24,25,0.18)]">
                      <div className="relative h-44 overflow-hidden">
                        <Image
                          src={PATH_PHOTOS[index % PATH_PHOTOS.length]}
                          alt={service.title}
                          fill
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <span className="absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1 font-[family-name:var(--font-display)] text-lg leading-none text-[var(--color-primary-600)] backdrop-blur-sm">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="p-7 pt-6">
                      <span className="inline-flex rounded-xl bg-[var(--color-primary-50)] p-3">
                        <Icon className="h-5 w-5 text-[var(--color-primary-600)]" />
                      </span>
                      <h3 className="mt-5 text-[1.05rem] font-bold text-[var(--color-text-primary)]">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {service.description}
                      </p>
                      {service.ctaLink?.trim() ? (
                        <Link
                          href={localizeHref(service.ctaLink, locale)}
                          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary-600)]"
                        >
                          {service.ctaText?.trim() || content.services.linkLabel || ""}
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      ) : null}
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          ) : content.services.emptyState ? (
            <div className="mt-12 rounded-2xl border border-[var(--color-text-primary)]/8 bg-white p-10 text-center">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {content.services.emptyState.title}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
                {content.services.emptyState.description}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ══════════════ 3 · OPERATIONS STORY — editorial split, light ══════════════ */}
      <section className="relative overflow-hidden bg-[var(--color-surface)] py-[clamp(4rem,7vw,6.5rem)]">
        <div className="container-max grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            {content.corporate.contentEyebrow ? (
              <div className="eyebrow text-[var(--color-primary-600)]">
                {content.corporate.contentEyebrow}
              </div>
            ) : null}
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.08] font-normal text-[var(--color-text-primary)]">
              {content.corporate.contentTitle}
            </h2>
            <p className="mt-4 max-w-xl text-[1rem] leading-relaxed text-[var(--color-text-secondary)]">
              {content.corporate.contentDescription}
            </p>

            <div className="mt-8 space-y-5">
              {content.corporate.features.map((feature) => (
                <div key={feature.label}>
                  <DrawLine className="mb-3.5" />
                  <div className="flex items-baseline justify-between gap-6">
                    <div className="text-[0.92rem] font-bold text-[var(--color-text-primary)]">
                      {feature.label}
                    </div>
                    <div className="text-right text-sm text-[var(--color-text-muted)]">
                      {feature.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              {content.corporate.primaryAction.href ? (
                <Button variant="primary" size="lg" asChild>
                  <Link href={localizeHref(content.corporate.primaryAction.href, locale)}>
                    {content.corporate.primaryAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              {content.corporate.secondaryAction.href ? (
                <Link
                  href={localizeHref(content.corporate.secondaryAction.href, locale)}
                  className="inline-flex items-center rounded-full border border-[var(--color-text-primary)]/12 bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition-colors duration-200 hover:border-[var(--color-text-primary)]/25"
                >
                  {content.corporate.secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>

          <TiltCard className="relative">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--color-primary-500)]/15 bg-[var(--color-primary-50)] p-9">
              <AnimatedRing className="absolute -right-20 -top-20 h-64 w-64 opacity-40" />
              <div className="relative">
                {content.corporate.visualEyebrow ? (
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-600)]/70">
                    {content.corporate.visualEyebrow}
                  </div>
                ) : null}
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.55rem] leading-snug font-normal text-[var(--color-text-primary)]">
                  {content.corporate.visualTitle}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {content.corporate.visualDescription}
                </p>
                <ul className="mt-6 space-y-3">
                  {content.corporate.visualPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-500)]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ══════════════ 3b · EDITORIAL BAND — full-bleed photography ══════════════ */}
      <section aria-hidden className="relative h-[clamp(16rem,40vw,26rem)] overflow-hidden">
        <Image
          src="/images/food/feast-overhead.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white opacity-30" />
        <div className="grain-overlay" />
      </section>

      {/* ══════════════ 4 · HOW IT WORKS — bento, one emerald accent tile ══════════════ */}
      <section className="bg-white py-[clamp(4rem,7vw,6.5rem)]">
        <div className="container-max">
          <div className="mx-auto max-w-2xl text-center">
            {content.howItWorks.header.eyebrow ? (
              <div className="eyebrow text-[var(--color-primary-600)]">
                {content.howItWorks.header.eyebrow}
              </div>
            ) : null}
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.1] font-normal text-[var(--color-text-primary)]">
              {content.howItWorks.header.title}
            </h2>
            {content.howItWorks.header.description ? (
              <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
                {content.howItWorks.header.description}
              </p>
            ) : null}
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            {howItWorks.map((step, index) => {
              const spans = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];
              const accent = index === 0;
              return (
                <Reveal key={step.title} className={spans[index] ?? "lg:col-span-6"}>
                  <div
                    className={
                      accent
                        ? "relative h-full overflow-hidden rounded-2xl p-8 text-white"
                        : "relative h-full overflow-hidden rounded-2xl border border-[var(--color-text-primary)]/8 bg-[var(--color-surface)] p-8"
                    }
                    style={
                      accent
                        ? { background: "linear-gradient(145deg, var(--dp-from), var(--dp-to))" }
                        : undefined
                    }
                  >
                    {accent ? <div className="grain-overlay" /> : null}
                    <div className="relative">
                      <span
                        className={
                          accent
                            ? "font-[family-name:var(--font-display)] text-6xl leading-none text-white/20"
                            : "font-[family-name:var(--font-display)] text-6xl leading-none text-[var(--color-text-primary)]/[0.06]"
                        }
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3
                        className={
                          accent
                            ? "mt-4 text-[1.05rem] font-bold text-white"
                            : "mt-4 text-[1.05rem] font-bold text-[var(--color-text-primary)]"
                        }
                      >
                        {step.title}
                      </h3>
                      <p
                        className={
                          accent
                            ? "mt-2 max-w-md text-sm leading-relaxed text-white/75"
                            : "mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]"
                        }
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {content.stats.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {content.stats.map((stat) => (
                <Reveal key={stat.label} className="h-full">
                  <div className="h-full rounded-2xl border border-[var(--color-text-primary)]/8 bg-white px-6 py-6 text-center shadow-[0_1px_2px_rgba(16,24,25,0.03)]">
                    <StatCounter
                      value={`${stat.target}${stat.suffix ?? ""}`}
                      className="font-[family-name:var(--font-display)] text-[2.1rem] leading-none text-[var(--color-primary-600)]"
                    />
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                      {stat.label}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      {stat.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ══════════════ 4b · TASTE GALLERY — bento photo mosaic ══════════════ */}
      <section className="bg-[var(--color-surface)] py-[clamp(4rem,7vw,6.5rem)]">
        <div className="container-max">
          <div className="grid items-end gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
            <div>
              <div className="eyebrow text-[var(--color-primary-600)]">From our kitchens</div>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.1] font-normal text-[var(--color-text-primary)]">
                Made fresh. Plated with pride.
              </h2>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-0 overflow-hidden rounded-[1.75rem] md:grid-cols-12 md:[grid-auto-rows:1fr]">
            {FOOD_GALLERY.map((photo) => (
              <Reveal key={photo.src} className={photo.span}>
                <figure className={`group relative overflow-hidden ${photo.h} w-full cursor-pointer`}>
                  <Image
                    src={photo.src}
                    alt={photo.caption}
                    fill
                    sizes="(min-width: 768px) 40vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,24,25,0.55)] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <figcaption className="absolute inset-x-0 bottom-0 translate-y-3 p-5 font-[family-name:var(--font-display)] text-lg text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {photo.caption}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 5 · ORDERING GATE — the single dark band (approved) ══════════════ */}
      <section className="bg-white px-4 pb-[clamp(3rem,5vw,4.5rem)] lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[var(--color-surface-dark)] px-6 py-[clamp(3.5rem,6vw,5.5rem)] text-center">
          <div aria-hidden className="absolute inset-0">
            <Image
              src="/images/food/spice-table.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[var(--color-surface-dark)]/82" />
            <div className="grain-overlay grain-overlay-strong" />
          </div>
          <div className="relative z-10">
            {content.todaysMenu.eyebrow ? (
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
                {content.todaysMenu.eyebrow}
              </div>
            ) : null}
            <h2 className="mx-auto mt-4 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(1.9rem,3.8vw,2.9rem)] leading-[1.08] font-normal text-white">
              {content.todaysMenu.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-white/65">
              {content.todaysMenu.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button variant="white" size="lg" asChild>
                <Link href={localizeHref(orderingPrimaryAction.href, locale)}>
                  {orderingPrimaryAction.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Link
                href={localizeHref(orderingSecondaryAction.href, locale)}
                className="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/5"
              >
                {orderingSecondaryAction.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ 6 · PROOF WALL — white cards ══════════════ */}
      <section className="bg-white py-[clamp(4rem,7vw,6.5rem)]">
        <div className="container-max">
          <div className="mx-auto max-w-2xl text-center">
            {content.testimonials.header.eyebrow ? (
              <div className="eyebrow text-[var(--color-primary-600)]">
                {content.testimonials.header.eyebrow}
              </div>
            ) : null}
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.1] font-normal text-[var(--color-text-primary)]">
              {content.testimonials.header.title}
            </h2>
            {content.testimonials.header.description ? (
              <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
                {content.testimonials.header.description}
              </p>
            ) : null}
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Reveal key={testimonial.id} className="h-full">
                <figure className="relative h-full rounded-2xl border border-[var(--color-text-primary)]/8 bg-[var(--color-surface)] p-7">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={
                          starIndex < (testimonial.rating ?? 5)
                            ? "h-3.5 w-3.5 fill-[var(--color-secondary-500)] text-[var(--color-secondary-500)]"
                            : "h-3.5 w-3.5 text-[var(--color-text-primary)]/15"
                        }
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-[0.92rem] leading-relaxed text-[var(--color-text-secondary)]">
                    &ldquo;{testimonial.text}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 border-t border-[var(--color-text-primary)]/8 pt-4">
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">
                      {testimonial.name}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {[testimonial.role, testimonial.company].filter(Boolean).join(" · ")}
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ 7 · CLOSING CTA — light, calm ══════════════ */}
      <section className="relative overflow-hidden bg-[var(--color-surface)] py-[clamp(4.5rem,8vw,7rem)]">
        <MeshBackdrop tone="light" />
        <div className="container-max relative z-10 text-center">
          {content.cta.eyebrow ? (
            <div className="eyebrow text-[var(--color-primary-600)]">{content.cta.eyebrow}</div>
          ) : null}
          <h2 className="mx-auto mt-4 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.06] font-normal tracking-[-0.01em] text-[var(--color-text-primary)]">
            {content.cta.title}
          </h2>
          {content.cta.description ? (
            <p className="mx-auto mt-4 max-w-2xl text-[1rem] leading-relaxed text-[var(--color-text-secondary)]">
              {content.cta.description}
            </p>
          ) : null}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {ctaActions.map((action, index) =>
              index === 0 ? (
                <Button key={action.href} variant="primary" size="lg" asChild>
                  <Link href={localizeHref(action.href, locale)}>
                    {action.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Link
                  key={action.href}
                  href={localizeHref(action.href, locale)}
                  className="inline-flex items-center rounded-full border border-[var(--color-text-primary)]/12 bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition-colors duration-200 hover:border-[var(--color-text-primary)]/25"
                >
                  {action.label}
                </Link>
              ),
            )}
          </div>
          {locale === "en" ? (
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <Link href={localizeHref("/corporate", locale)} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors duration-200 hover:text-[var(--color-text-primary)]">
                Corporate catering in Pune
              </Link>
              <Link href={localizeHref("/events", locale)} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors duration-200 hover:text-[var(--color-text-primary)]">
                Event catering services in Pune
              </Link>
              <Link href={localizeHref("/menu", locale)} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors duration-200 hover:text-[var(--color-text-primary)]">
                Browse the menu
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
