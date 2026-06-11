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
const operationsScrollImage =
  "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1600&q=80";
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

  // Parallax for hero
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], ["0%", "20%"]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.95]);
  const heroBlur = useTransform(heroScroll, [0, 0.8], [0, 6]);

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

  const howItWorks = content.howItWorks.steps.map((step, index) => ({
    ...step,
    icon: [ClipboardCheck, ChefHat, Clock3, BadgeCheck][index] ?? BadgeCheck,
  }));

  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO — Full viewport, parallax, animated graphics
          ══════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex min-h-[80vh] items-center overflow-hidden lg:min-h-[90vh]"
      >
        {/* Morphing emerald gradient mesh + film grain */}
        <MeshBackdrop tone="light" />

        {/* Animated grid lines */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,40,30,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,40,30,0.03) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
          animate={{ backgroundPosition: ["0px 0px", "80px 80px"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Decorative animated ring — top right */}
        <div className="absolute -top-10 -right-10 w-[400px] h-[400px] opacity-40 pointer-events-none hidden lg:block">
          <AnimatedRing className="w-full h-full" />
        </div>

        {/* Floating gold accent blob */}
        <motion.div
          className="absolute top-[20%] right-[5%] w-[500px] h-[500px] rounded-full pointer-events-none hidden lg:block"
          style={{
            background:
              "radial-gradient(circle, rgba(173,111,62,0.07), transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Navy blob bottom-left */}
        <motion.div
          className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full pointer-events-none hidden lg:block"
          style={{
            background:
              "radial-gradient(circle, rgba(16,40,30,0.05), transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="container-max relative z-10 py-12 lg:py-0"
          style={{ y: heroY, scale: heroScale }}
        >
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            {/* Left — Text content */}
            <div>
              {/* Animated badge */}
              <motion.div
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
                className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-secondary-500)]/20 bg-white/80 backdrop-blur-sm px-4 py-2 shadow-sm"
              >
                <motion.span
                  className="h-2 w-2 rounded-full bg-[var(--color-secondary-500)]"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs font-semibold text-[var(--color-secondary-600)] tracking-wide uppercase">
                  {content.hero.eyebrow}
                </span>
              </motion.div>

              {/* Hero title — word-by-word reveal */}
              <h1 className="display-hero mt-7 text-[var(--color-text-primary)]">
                <AnimatedHeroText text={String(heroTitle)} />
              </h1>

              {/* Description with fade */}
              <motion.p
                className="mt-7 max-w-lg text-lg leading-[1.75] text-[var(--color-text-secondary)]"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.7 }}
              >
                {heroDescription}
              </motion.p>

              {/* CTA buttons with stagger */}
              <motion.div
                className="mt-9 flex flex-col gap-3 sm:flex-row"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                {(content.hero.actions ?? []).map((action, i) => (
                  <motion.div
                    key={action.href + action.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={
                        action.variant === "outline" ? "outline" : i === 0 ? "primary" : "secondary"
                      }
                      size="lg"
                      asChild
                    >
                      <Link href={action.href}>
                        {action.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>

              {/* Inline metrics — horizontal strip */}
              {(content.hero.metrics ?? []).length > 0 && (
                <motion.div
                  className="mt-12 flex flex-wrap gap-8 border-t border-[var(--color-primary-100)] pt-8"
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                >
                  {(content.hero.metrics ?? []).map((metric, i) => (
                    <motion.div
                      key={`${metric.label}-${metric.value}`}
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3 + i * 0.1 }}
                      className="glass-panel rounded-2xl px-5 py-4"
                    >
                      <div className="text-3xl font-bold tracking-tight text-[var(--color-primary-600)]">
                        <StatCounter value={metric.value} />
                      </div>
                      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted,#6b7a80)]">
                        {metric.label}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Right — Bento card grid */}
            {content.hero.aside && (
              <motion.div
                initial={false}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{
                  duration: 0.9,
                  delay: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative"
                style={{ perspective: 1000 }}
              >
                <TiltCard className="rounded-2xl border border-[var(--color-primary-600)]/10 bg-[var(--color-surface-dark)] p-7 shadow-[0_30px_60px_-15px_rgba(16,40,30,0.3)]">
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full opacity-10"
                    >
                      <motion.path
                        d="M100,0 L100,100 L0,100"
                        fill="none"
                        stroke="var(--color-secondary-500)"
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 2,
                          delay: 1,
                          ease: "easeInOut",
                        }}
                      />
                    </svg>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary-500)]">
                    <Award className="h-3.5 w-3.5" />
                    {content.hero.aside.eyebrow}
                  </div>
                  <h3
                    className="mt-4 text-xl font-normal text-white tracking-[-0.02em]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {content.hero.aside.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/45">
                    {content.hero.aside.description}
                  </p>

                  <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {(content.hero.aside.badges ?? []).map((item, i) => (
                      <motion.div
                        key={item}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-[13px] font-medium text-white/65 backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
                        initial={false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.1 }}
                      >
                        <Star className="h-3.5 w-3.5 shrink-0 text-[var(--color-secondary-500)]" />
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </TiltCard>

                {/* Floating mini stat cards */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(content.hero.aside.panels ?? []).map((panel, i) => (
                    <motion.div
                      key={panel.label}
                      className="rounded-xl border border-[var(--color-primary-100)] bg-white p-4 shadow-sm"
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + i * 0.15 }}
                      whileHover={{
                        y: -3,
                        boxShadow: "0 12px 24px -6px rgba(16,40,30,0.1)",
                      }}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-secondary-500)]">
                        {panel.label}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {panel.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <motion.div
            className="w-[1px] h-8 bg-gradient-to-b from-[var(--color-secondary-500)]/50 to-transparent"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          TRUSTED BY — Infinite marquee
          ══════════════════════════════════════════════ */}
      {clientNames.length > 0 && (
        <section
          id="trusted-organisations"
          className="relative scroll-mt-20 overflow-hidden border-y border-[var(--color-primary-100)] bg-white py-8"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 -bottom-24 h-72 [mask-image:radial-gradient(60%_55%,white,transparent)]">
              <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,var(--color-secondary-500),transparent_68%)] before:opacity-[0.10]" />
              <div className="absolute -left-1/2 top-1/2 z-10 aspect-[1/0.24] w-[200%] rounded-[100%] border-t border-[var(--color-secondary-500)]/15 bg-white" />
              <Sparkles
                density={260}
                speed={0.45}
                opacity={0.22}
                opacitySpeed={1.8}
                size={1.1}
                color="var(--color-secondary-500)"
                className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_82%)]"
              />
            </div>
          </div>

          <div className="container-max relative z-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
              {content.services.logoEyebrow ?? ""}
            </div>
            <div className="relative mt-4 h-[4.75rem]">
              <InfiniteSlider
                className="flex h-full w-full items-center"
                duration={30}
                durationOnHover={60}
                gap={16}
              >
                {clientNames.map((client) => (
                  <div
                    key={client}
                    className="flex h-12 min-w-[10.5rem] shrink-0 items-center justify-center rounded-lg border border-[var(--color-primary-100)] bg-white/82 px-6 text-sm font-semibold whitespace-nowrap text-[var(--color-text-secondary)] shadow-sm backdrop-blur-md transition-colors duration-200 hover:border-[var(--color-secondary-500)]/25 hover:text-[var(--color-text-primary)]"
                  >
                    {client}
                  </div>
                ))}
              </InfiniteSlider>
              <ProgressiveBlur
                className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-28"
                direction="left"
                blurIntensity={0.75}
              />
              <ProgressiveBlur
                className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-28"
                direction="right"
                blurIntensity={0.75}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 w-24 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-24 bg-gradient-to-l from-white to-transparent" />
            </div>
          </div>
        </section>
      )}

      {showOperationsScroll ? (
        <section id="operations-scroll" className="scroll-mt-20 bg-[var(--color-surface)]">
          <ContainerScroll
            titleComponent={
              <div className="mx-auto max-w-4xl px-2">
                {content.corporate.visualEyebrow ? (
                  <div className="eyebrow justify-center">
                    {content.corporate.visualEyebrow}
                  </div>
                ) : null}
                <h2 className="section-title mx-auto mt-4 max-w-3xl text-[var(--color-text-primary)]">
                  {content.corporate.visualTitle}
                </h2>
                <p className="body-large mx-auto mt-4 max-w-2xl">
                  {content.corporate.visualDescription}
                </p>
              </div>
            }
          >
            <div className="relative h-full w-full">
              <Image
                src={operationsScrollImage}
                alt={content.corporate.visualTitle}
                fill
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-dark)]/82 via-[var(--color-surface-dark)]/18 to-transparent" />
              {content.corporate.visualPoints.length > 0 ? (
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                  <div className="grid gap-2 md:grid-cols-3">
                    {content.corporate.visualPoints.slice(0, 3).map((point) => (
                      <div
                        key={point}
                        className="flex items-start gap-2 rounded-md border border-white/12 bg-white/10 px-3 py-3 text-sm leading-relaxed text-white backdrop-blur-md"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-secondary-500)]" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </ContainerScroll>
        </section>
      ) : null}

      {/* ══════════════════════════════════════════════
          SERVICES — Bento-style cards with 3D tilt
          ══════════════════════════════════════════════ */}
      <section className="relative py-[clamp(5rem,9vw,8rem)] bg-white overflow-hidden">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 decorative-dots pointer-events-none" />

        <div className="container-max relative z-10">
          <Reveal>
            <SectionHeader
              eyebrow={content.services.header.eyebrow}
              title={content.services.header.title}
              description={content.services.header.description}
              align="center"
            />
          </Reveal>

          <DrawLine className="mt-10 mb-0 mx-auto max-w-md" />

          {services.length > 0 ? (
            <StaggerGrid className="mt-14 grid gap-6 lg:grid-cols-3">
              {services.map((service, i) => (
                <motion.div
                  key={service.id}
                  variants={{
                    hidden: { opacity: 0, y: 40, rotateX: 5 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: {
                        duration: 0.6,
                        delay: i * 0.12,
                        ease: [0.22, 1, 0.36, 1] as const,
                      },
                    },
                  }}
                  style={{ transformPerspective: 800 }}
                >
                  <TiltCard className="group relative h-full rounded-2xl border border-[var(--color-primary-100)] bg-white p-8 transition-shadow duration-400 hover:shadow-[0_25px_50px_-12px_rgba(16,40,30,0.12)]">
                    {/* Animated gold top line */}
                    <motion.div
                      className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-[var(--color-secondary-500)] via-[var(--color-secondary-100)] to-[var(--color-secondary-500)]"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ transformOrigin: "left" }}
                    />

                    {/* Icon with glow effect on hover */}
                    <div className="relative">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-primary-100)] text-[var(--color-text-secondary)] transition-all duration-300 group-hover:bg-[var(--color-surface-dark)] group-hover:text-white group-hover:border-[var(--color-primary-600)] group-hover:shadow-[0_0_30px_rgba(16,40,30,0.2)]">
                        <service.icon className="h-6 w-6" />
                      </span>
                    </div>

                    <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-secondary-500)]">
                      {service.ctaText ?? content.services.cardEyebrow ?? ""}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-[1.7] text-[var(--color-text-secondary)]">
                      {service.description}
                    </p>

                    <div className="mt-6 space-y-3">
                      {(service.features ?? []).slice(0, 3).map((feature, fi) => (
                        <motion.div
                          key={feature}
                          className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + fi * 0.08 }}
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-secondary-500)]" />
                          <span>{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    <Link
                      href={service.ctaLink ?? "/corporate"}
                      className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] transition-all duration-250 group-hover:text-[var(--color-secondary-500)] group-hover:gap-3 cursor-pointer"
                    >
                      {service.ctaText ?? content.services.linkLabel ?? ""}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </TiltCard>
                </motion.div>
              ))}
            </StaggerGrid>
          ) : content.services.emptyState ? (
            <div className="mt-12">
              <InfoCard
                title={content.services.emptyState.title}
                description={content.services.emptyState.description}
              />
            </div>
          ) : null}
        </div>
      </section>

      {locale === "en" ? (
        <section className="border-y border-[var(--color-primary-100)] bg-[#fcfbf7] py-[clamp(4.5rem,8vw,6rem)]">
          <div className="container-max">
            <Reveal>
              <SectionHeader
                eyebrow="Pune catering services"
                title="Corporate catering, office meals, and vegetarian catering services across Pune"
                description="Mealnova serves offices, campuses, tech parks, and events with corporate catering, cafeteria management, and event catering across Baner, Balewadi, Hinjewadi, Wakad, Kharadi, and Magarpatta."
                align="center"
              />
            </Reveal>

            <StaggerGrid className="mt-12 grid gap-5 lg:grid-cols-3">
              {searchServiceHighlights.map((item) => (
                <InfoCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  eyebrow="Our Services"
                />
              ))}
            </StaggerGrid>
          </div>
        </section>
      ) : null}

      {locale === "en" ? (
        <section className="bg-white py-[clamp(4.5rem,8vw,6rem)]">
          <div className="container-max">
            <Reveal>
              <SectionHeader
                eyebrow="Corporate catering FAQ"
                title="Questions people ask before choosing a catering service in Pune"
                description="Find answers to the most common questions about our catering services, delivery areas, menu options, and how to get started with Mealnova."
                align="center"
              />
            </Reveal>

            <StaggerGrid className="mt-12 grid gap-5 lg:grid-cols-3">
              {searchFaqs.map((item) => (
                <InfoCard
                  key={item.title}
                  icon={Search}
                  eyebrow="Common Questions"
                  title={item.title}
                  description={item.description}
                />
              ))}
            </StaggerGrid>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href={localizeHref("/corporate", locale)}>Corporate catering in Pune</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={localizeHref("/events", locale)}>Event catering services in Pune</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={localizeHref("/menu", locale)}>Browse the menu</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* ══════════════════════════════════════════════
          HOW IT WORKS — Timeline with animated connectors
          ══════════════════════════════════════════════ */}
      <section className="py-[clamp(5rem,9vw,8rem)] bg-[var(--color-surface)] relative overflow-hidden">
        <div className="container-max">
          <Reveal>
            <SectionHeader
              eyebrow={content.howItWorks.header.eyebrow}
              title={content.howItWorks.header.title}
              description={content.howItWorks.header.description}
              align="center"
            />
          </Reveal>

          <div className="mt-16 relative">
            {/* Connecting line — desktop only */}
            <div className="hidden lg:block absolute top-[40px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-[1px]">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--color-secondary-500)]/30 via-[var(--color-secondary-500)]/60 to-[var(--color-secondary-500)]/30"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 1.5,
                  delay: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformOrigin: "left" }}
              />
            </div>

            <StaggerGrid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    variants={{
                      hidden: { opacity: 0, y: 30, scale: 0.95 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          duration: 0.5,
                          delay: index * 0.15,
                          ease: [0.22, 1, 0.36, 1] as const,
                        },
                      },
                    }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className="group relative text-center"
                  >
                    {/* Step circle */}
                    <div className="relative mx-auto mb-6">
                      <motion.div
                        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white border-2 border-[var(--color-primary-100)] shadow-md transition-all duration-300 group-hover:border-[var(--color-secondary-500)] group-hover:shadow-[0_0_0_4px_rgba(173,111,62,0.1)]"
                        whileHover={{ rotate: 5, scale: 1.05 }}
                      >
                        <div className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-secondary-500)] transition-colors">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                      </motion.div>
                      {/* Pulse ring on hover */}
                      <div className="absolute inset-0 rounded-full border border-[var(--color-secondary-500)]/0 group-hover:border-[var(--color-secondary-500)]/20 group-hover:scale-125 transition-all duration-500" />
                    </div>

                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)] max-w-[240px] mx-auto">
                      {step.description}
                    </p>
                  </motion.div>
                );
              })}
            </StaggerGrid>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATISTICS — Full-width dark with animated glow
          ══════════════════════════════════════════════ */}
      <StatsSection stats={content.stats} />

      {/* ══════════════════════════════════════════════
          ORDERING ACCESS — Dark premium section
          ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[var(--color-surface-dark)] py-[clamp(5rem,9vw,8rem)]">
        <MeshBackdrop tone="dark" />
        {/* Animated gradient blob */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 40% 50% at 70% 50%, rgba(173,111,62,0.06), transparent 70%)",
          }}
          animate={{
            background: [
              "radial-gradient(ellipse 40% 50% at 70% 50%, rgba(173,111,62,0.06), transparent 70%)",
              "radial-gradient(ellipse 50% 40% at 30% 50%, rgba(173,111,62,0.08), transparent 70%)",
              "radial-gradient(ellipse 40% 50% at 70% 50%, rgba(173,111,62,0.06), transparent 70%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-secondary-500)]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

        <div className="container-max relative z-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <Reveal className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-secondary-500)]/20 bg-[var(--color-secondary-500)]/10 px-4 py-1.5">
                <SparklesIcon className="h-3 w-3 text-[var(--color-secondary-500)]" />
                <span className="text-xs font-semibold text-[var(--color-secondary-500)] tracking-wide uppercase">
                  {content.todaysMenu.eyebrow || "Approved client ordering"}
                </span>
              </div>
              <h2
                className="mt-6 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.02em] text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Location-specific menus unlock after client approval
              </h2>
              <p className="mt-4 text-[15px] leading-[1.7] text-white/40">
                Public visitors can browse signature dishes and start corporate onboarding. Approved
                clients receive an ordering link after review, with access scoped to supported
                locations and service rules.
              </p>
            </Reveal>

            <motion.div
              className="flex shrink-0 flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button variant="secondary" size="lg" asChild>
                  <Link href={orderingPrimaryAction.href}>
                    {orderingPrimaryAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
              >
                <Link href={orderingSecondaryAction.href}>
                  {orderingSecondaryAction.label}
                </Link>
              </Button>
            </motion.div>
          </div>

          <div className="mt-12">
            <InfoCard
              tone="dark"
              eyebrow="Ordering gate"
              title="Daily menus are shared through approved-client access"
              description="After onboarding review, approved clients receive a managed ordering link tied to eligible locations, meal slots, and operating rules."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Location-specific menus are released only after account approval.",
                  "Public visitors can still browse the signature menu before onboarding.",
                  "Approved-client links open the order workspace without exposing public checkout.",
                  "Operations can keep daily availability and billing rules aligned per client.",
                ].map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-secondary-500)]" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </InfoCard>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIALS — Cards with large quote and avatars
          ══════════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="py-[clamp(5rem,9vw,8rem)] bg-[var(--color-surface)] relative overflow-hidden">
          <div className="container-max">
            <Reveal>
              <SectionHeader
                eyebrow={content.testimonials.header.eyebrow}
                title={content.testimonials.header.title}
                description={content.testimonials.header.description}
                align="center"
              />
            </Reveal>

            <DrawLine className="mt-8 mx-auto max-w-sm" />

            <StaggerGrid className="mt-14 grid gap-6 lg:grid-cols-3">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={testimonial.id}
                  variants={{
                    hidden: { opacity: 0, y: 30, rotateX: 3 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: {
                        duration: 0.6,
                        delay: i * 0.12,
                        ease: [0.22, 1, 0.36, 1] as const,
                      },
                    },
                  }}
                  whileHover={{
                    y: -6,
                    boxShadow: "0 20px 40px -12px rgba(16,40,30,0.1)",
                  }}
                  className="group relative h-full rounded-2xl border border-[var(--color-primary-100)] bg-white p-8 transition-shadow duration-300"
                  style={{ transformPerspective: 800 }}
                >
                  {/* Huge decorative quote mark */}
                  <div
                    className="absolute -top-2 -left-1 text-[120px] leading-none font-serif text-[var(--color-secondary-500)]/[0.06] select-none pointer-events-none"
                  >
                    &ldquo;
                  </div>

                  {/* Star rating with animation */}
                  <div className="relative z-10 flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map(
                      (_, index) => (
                        <motion.div
                          key={`${testimonial.id}-${index}`}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            delay: 0.5 + index * 0.05,
                            type: "spring",
                            stiffness: 300,
                          }}
                        >
                          <Star className="h-4 w-4 text-[var(--color-secondary-500)] fill-[var(--color-secondary-500)]" />
                        </motion.div>
                      ),
                    )}
                  </div>

                  <p className="relative z-10 mt-5 text-[15px] leading-[1.75] text-[var(--color-text-secondary)] italic">
                    {testimonial.text}
                  </p>

                  <div className="relative z-10 mt-6 flex items-center gap-3 border-t border-[var(--color-primary-50)] pt-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--dp-from)] to-[var(--dp-to)] text-sm font-bold text-white shadow-md">
                      {testimonial.name?.charAt(0) ?? ""}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted,#6b7a80)]">
                        {testimonial.role}
                        {testimonial.company
                          ? ` · ${testimonial.company}`
                          : ""}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </StaggerGrid>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          CORPORATE — Split with animated graphics
          ══════════════════════════════════════════════ */}
      <section className="py-[clamp(5rem,9vw,8rem)] bg-white overflow-hidden">
        <div className="container-max">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            {/* Left — dark visual panel */}
            <Reveal direction="left">
              <div className="relative overflow-hidden rounded-2xl p-8 lg:p-10 min-h-[440px]" style={{ background: "linear-gradient(155deg, var(--dp-from) 0%, var(--dp-to) 100%)" }}>
                {/* Animated scanning line */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, var(--color-secondary-500) 50%, transparent 100%)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />

                {/* Animated decorative ring */}
                <div className="absolute -bottom-16 -right-16 w-[250px] h-[250px] opacity-20">
                  <AnimatedRing className="w-full h-full" />
                </div>

                {/* Floating grid dots */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-secondary-500)]">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {content.corporate.visualEyebrow}
                  </div>
                  <h3
                    className="mt-5 text-[clamp(1.5rem,3vw,2.25rem)] font-normal leading-[1.15] tracking-[-0.02em] text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {content.corporate.visualTitle}
                  </h3>
                  <p className="mt-4 text-[15px] leading-[1.7] text-white/40">
                    {content.corporate.visualDescription}
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {content.corporate.visualPoints.map((item, i) => (
                      <motion.div
                        key={item}
                        className="flex items-center gap-3 text-sm text-white/55"
                        initial={{ opacity: 0, x: -15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--color-secondary-500)]/15">
                          <CheckCircle2 className="h-3 w-3 text-[var(--color-secondary-500)]" />
                        </div>
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Right — content */}
            <Reveal direction="right">
              <div className="eyebrow">
                {content.corporate.contentEyebrow}
              </div>
              <h2
                className="mt-4 text-[clamp(1.5rem,2.5vw,2.25rem)] font-normal leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {content.corporate.contentTitle}
              </h2>
              <p className="mt-4 text-[15px] leading-[1.7] text-[var(--color-text-secondary)]">
                {content.corporate.contentDescription}
              </p>

              <div className="mt-8 space-y-5">
                {content.corporate.features.map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    className="flex items-start gap-4 group"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <motion.span
                      className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fefce8] border border-[var(--color-secondary-500)]/10"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-secondary-500)]" />
                    </motion.span>
                    <div>
                      <div className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {feature.label}
                      </div>
                      <div className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {feature.detail}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button size="lg" asChild>
                    <Link href={content.corporate.primaryAction.href}>
                      {content.corporate.primaryAction.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
                <Button variant="outline" size="lg" asChild>
                  <Link href={content.corporate.secondaryAction.href}>
                    {content.corporate.secondaryAction.label}
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <PageCta
        eyebrow={content.cta.eyebrow}
        title={content.cta.title}
        description={content.cta.description}
        actions={content.cta.actions.map((action) => ({
          href: action.href,
          label: action.label,
          variant: mapCmsActionVariant(action.variant),
          icon:
            action.href === "/events" ? (
              <CalendarRange className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            ),
        }))}
      />
    </>
  );
}
