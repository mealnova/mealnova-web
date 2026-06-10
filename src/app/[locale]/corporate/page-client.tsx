"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero, SectionHeader } from "@/components/site/page-primitives";
import { getApiErrorMessage, submitCorporateInquiry } from "@/lib/api";
import { useBrandSettings, useClientLogos, usePricingTiers } from "@/lib/hooks/use-content";
import {
  type CmsCardItem,
  type CmsCtaContent,
  type CmsHeroContent,
  type CmsSectionHeader,
  mapCmsActionVariant,
  useResolvedStructuredPageContent,
} from "@/lib/page-content";

type MealSlotValue = "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER";

const challengeIcons = [Users, ShieldCheck, BarChart3] as const;
const processIcons = [ClipboardList, ChefHat, Building2, BadgeCheck] as const;
const DEFAULT_CORPORATE_STEPS = [
  "Company profile",
  "Service design",
  "Launch plan",
  "Review",
  "Submitted",
];
const DEFAULT_MEAL_SLOT_OPTIONS: Array<{ value: MealSlotValue; label: string }> = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "SNACKS", label: "Snacks" },
  { value: "DINNER", label: "Dinner" },
];
const DEFAULT_SERVICE_DAY_OPTIONS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
];
const DEFAULT_BUDGET_OPTIONS = [
  { value: "UNDER_75", label: "Under Rs. 75 per meal" },
  { value: "75_TO_110", label: "Rs. 75 to Rs. 110 per meal" },
  { value: "110_TO_160", label: "Rs. 110 to Rs. 160 per meal" },
  { value: "160_PLUS", label: "Above Rs. 160 per meal" },
];
const DEFAULT_BILLING_OPTIONS = [
  { value: "MONTHLY_INVOICE", label: "Monthly invoice" },
  { value: "SUBSIDY_PLUS_EMPLOYEE", label: "Company subsidy plus employee recovery" },
  { value: "PER_MEAL_BILLING", label: "Per-meal billing" },
];
const CORPORATE_SEARCH_FAQS = [
  {
    icon: Building2,
    title: "Do you handle corporate catering in Pune for offices and campuses?",
    description:
      "Mealnova positions corporate catering in Pune around recurring office meals, cafeteria operations, and team dining for workplaces, campuses, and business parks.",
  },
  {
    icon: Users,
    title: "Can a company start office catering onboarding online?",
    description:
      "Yes. The corporate flow collects company details, expected meal volume, service days, meal slots, launch timing, and billing preferences before review.",
  },
  {
    icon: ShieldCheck,
    title: "What makes the service production-ready for business buyers?",
    description:
      "The site now exposes structured onboarding, approval-based ordering access, GST-ready billing context, and clearer public content for corporate catering buyers in Pune.",
  },
] as const;

export interface CorporatePageContent {
  hero: CmsHeroContent;
  challenges: {
    header: CmsSectionHeader;
    items: CmsCardItem[];
  };
  process: {
    header: CmsSectionHeader;
    trustedByEyebrow: string;
    trustedByEmptyTitle: string;
    trustedByEmptyDescription: string;
    steps: CmsCardItem[];
  };
  capabilities: {
    header: CmsSectionHeader;
    items: string[];
  };
  pricing: {
    header: CmsSectionHeader;
    emptyState?: {
      title: string;
      description: string;
    };
  };
  form: {
    eyebrow: string;
    title: string;
    description: string;
    companyTitle: string;
    companyDescription: string;
    serviceTitle: string;
    serviceDescription: string;
    launchTitle: string;
    launchDescription: string;
    reviewTitle: string;
    reviewDescription: string;
    successMessage: string;
    steps: string[];
    nextLabel: string;
    backLabel: string;
    submitLabel: string;
    submittingLabel: string;
    fields: {
      companyName: string;
      contactName: string;
      email: string;
      phone: string;
      city: string;
      locationsCount: string;
      estimatedDailyMeals: string;
      goLiveDate: string;
      notes: string;
      budgetBand: string;
      billingModel: string;
    };
    labels: {
      mealSlots: string;
      serviceDays: string;
      locationsCount: string;
      estimatedDailyMeals: string;
      budgetBand: string;
      billingModel: string;
    };
    options?: {
      mealSlots?: Array<{ value: MealSlotValue; label: string }>;
      serviceDays?: Array<{ value: string; label: string }>;
      budgetBands?: Array<{ value: string; label: string }>;
      billingModels?: Array<{ value: string; label: string }>;
    };
  };
  phoneCard: {
    eyebrow: string;
    title: string;
    description: string;
    summary: string;
  };
  cta: CmsCtaContent;
}

interface PricingCardTier {
  id: string | number;
  name: string;
  description?: string;
  price?: string | number;
  features: string[];
  isPopular?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

interface CorporateFormState {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  locationsCount: string;
  estimatedDailyMeals: string;
  mealSlots: MealSlotValue[];
  serviceDays: string[];
  goLiveDate: string;
  budgetBand: string;
  billingModel: string;
  notes: string;
}

function FlowSteps({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="mb-10 flex items-center justify-between">
      {steps.map((label, index) => (
        <div key={`${label}-${index}`} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                index < current
                  ? "bg-[var(--color-primary-500)] text-white"
                  : index === current
                    ? "bg-[var(--color-secondary-500)] text-white"
                    : "border border-white/15 bg-white/5 text-white/65"
              }`}
            >
              {index < current ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={`mt-1 hidden text-[10px] font-medium sm:block ${
                index === current ? "text-[var(--color-secondary-500)]" : "text-white/55"
              }`}
            >
              {label}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <div
              className={`mx-1 mb-4 h-0.5 w-8 sm:w-16 ${
                index < current ? "bg-[var(--color-primary-500)]" : "bg-white/12"
              }`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SelectionPills<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: Array<{ value: T; label: string }>;
  values: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = values.includes(option.value);

        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={active ? "white" : "ghost"}
            onClick={() => onToggle(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function OnboardingSummaryCard({
  content,
  form,
  mealSlotOptions,
  serviceDayOptions,
}: {
  content: CorporatePageContent["form"];
  form: CorporateFormState;
  mealSlotOptions: Array<{ value: MealSlotValue; label: string }>;
  serviceDayOptions: Array<{ value: string; label: string }>;
}) {
  const mealSlotMap = new Map(mealSlotOptions.map((option) => [option.value, option.label]));
  const serviceDayMap = new Map(serviceDayOptions.map((option) => [option.value, option.label]));

  return (
    <InfoCard
      eyebrow={content.reviewTitle}
      title={content.labels.estimatedDailyMeals}
      description={content.reviewDescription}
    >
      <div className="grid gap-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white/76 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Company
          </div>
          <div className="mt-2 text-lg font-semibold text-text-primary">
            {form.companyName.trim() || "Pending"}
          </div>
          <div className="mt-1 text-sm text-text-secondary">
            {[form.contactName.trim(), form.city.trim()].filter(Boolean).join(" • ") || "No details yet"}
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white/76 px-4 py-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 text-text-secondary">
              <span>{content.labels.locationsCount}</span>
              <span className="font-semibold text-text-primary">
                {form.locationsCount || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-text-secondary">
              <span>{content.labels.estimatedDailyMeals}</span>
              <span className="font-semibold text-text-primary">
                {form.estimatedDailyMeals || "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 text-text-secondary">
              <span>{content.labels.mealSlots}</span>
              <span className="text-right font-semibold text-text-primary">
                {form.mealSlots.length > 0
                  ? form.mealSlots.map((value) => mealSlotMap.get(value) ?? value).join(", ")
                  : "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 text-text-secondary">
              <span>{content.labels.serviceDays}</span>
              <span className="text-right font-semibold text-text-primary">
                {form.serviceDays.length > 0
                  ? form.serviceDays.map((value) => serviceDayMap.get(value) ?? value).join(", ")
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-text-secondary">
              <span>{content.fields.goLiveDate}</span>
              <span className="font-semibold text-text-primary">{form.goLiveDate || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-text-secondary">
              <span>{content.labels.budgetBand}</span>
              <span className="font-semibold text-text-primary">
                {form.budgetBand || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-text-secondary">
              <span>{content.labels.billingModel}</span>
              <span className="font-semibold text-text-primary">
                {form.billingModel || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </InfoCard>
  );
}

export default function CorporatePage({
  locale = "en",
  initialContent,
}: {
  locale?: string;
  initialContent?: CorporatePageContent | null;
}) {
  const { data: pricingData } = usePricingTiers("corporate");
  const { data: clientLogos } = useClientLogos();
  const { data: brandSettings, isPending: brandPending } = useBrandSettings();
  const { data: content, isPending: contentPending } =
    useResolvedStructuredPageContent<CorporatePageContent>("corporate", {
      brand: brandSettings,
    }, {
      initialData: initialContent ?? undefined,
    });

  const [form, setForm] = useState<CorporateFormState>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    locationsCount: "",
    estimatedDailyMeals: "",
    mealSlots: [],
    serviceDays: [],
    goLiveDate: "",
    budgetBand: "",
    billingModel: "",
    notes: "",
  });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const phone = brandSettings?.phone?.trim() ?? "";
  const phoneHref = phone ? `tel:${phone.replace(/[\s-]/g, "")}` : "#";
  const pricing = pricingData ?? [];
  const clients = useMemo(
    () => (clientLogos ?? []).slice(0, 6).map((client) => client.name),
    [clientLogos],
  );

  const mealSlotOptions = content?.form.options?.mealSlots?.length
    ? content.form.options.mealSlots
    : DEFAULT_MEAL_SLOT_OPTIONS;
  const serviceDayOptions = content?.form.options?.serviceDays?.length
    ? content.form.options.serviceDays
    : DEFAULT_SERVICE_DAY_OPTIONS;
  const budgetOptions = content?.form.options?.budgetBands?.length
    ? content.form.options.budgetBands
    : DEFAULT_BUDGET_OPTIONS;
  const billingOptions = content?.form.options?.billingModels?.length
    ? content.form.options.billingModels
    : DEFAULT_BILLING_OPTIONS;
  const flowSteps = content?.form.steps?.length ? content.form.steps : DEFAULT_CORPORATE_STEPS;

  function updateField<Key extends keyof CorporateFormState>(
    key: Key,
    value: CorporateFormState[Key],
  ) {
    setSubmitError(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleMealSlot(value: MealSlotValue) {
    setSubmitError(null);
    setForm((current) => ({
      ...current,
      mealSlots: current.mealSlots.includes(value)
        ? current.mealSlots.filter((item) => item !== value)
        : [...current.mealSlots, value],
    }));
  }

  function toggleServiceDay(value: string) {
    setSubmitError(null);
    setForm((current) => ({
      ...current,
      serviceDays: current.serviceDays.includes(value)
        ? current.serviceDays.filter((item) => item !== value)
        : [...current.serviceDays, value],
    }));
  }

  function validateCompanyStep() {
    if (
      !form.companyName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.city.trim()
    ) {
      setSubmitError("Complete the company profile before continuing.");
      return false;
    }

    if ((Number(form.locationsCount) || 0) < 1) {
      setSubmitError("Share the number of locations that need meal service.");
      return false;
    }

    return true;
  }

  function validateServiceStep() {
    if ((Number(form.estimatedDailyMeals) || 0) < 1) {
      setSubmitError("Share the estimated daily meal volume.");
      return false;
    }

    if (form.mealSlots.length === 0 || form.serviceDays.length === 0) {
      setSubmitError("Select the meal slots and service days you want us to support.");
      return false;
    }

    return true;
  }

  function validateLaunchStep() {
    if (!form.goLiveDate || !form.budgetBand || !form.billingModel) {
      setSubmitError("Complete the launch timing, budget band, and billing preference.");
      return false;
    }

    return true;
  }

  function nextStep() {
    if (!content) return;

    if (step === 0 && !validateCompanyStep()) return;
    if (step === 1 && !validateServiceStep()) return;
    if (step === 2 && !validateLaunchStep()) return;

    setSubmitError(null);
    setStep((current) => Math.min(current + 1, flowSteps.length - 1));
  }

  function previousStep() {
    setSubmitError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    if (!validateCompanyStep() || !validateServiceStep() || !validateLaunchStep()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const onboardingSummary = [
        form.notes.trim(),
        `Onboarding snapshot: ${form.companyName.trim()} in ${form.city.trim()}, ${form.locationsCount} locations, ${form.estimatedDailyMeals} daily meals, ${form.mealSlots.join(", ")} on ${form.serviceDays.join(", ")}, target go-live ${form.goLiveDate}.`,
      ]
        .filter(Boolean)
        .join("\n\n");

      await submitCorporateInquiry({
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        locationsCount: Number(form.locationsCount) || undefined,
        estimatedDailyMeals: Number(form.estimatedDailyMeals) || undefined,
        mealSlots: form.mealSlots,
        serviceDays: form.serviceDays,
        goLiveDate: form.goLiveDate || undefined,
        budgetBand: form.budgetBand.trim() || undefined,
        billingModel: form.billingModel.trim() || undefined,
        message: onboardingSummary,
      });

      setSubmitted(true);
      setStep(flowSteps.length - 1);
      setForm({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        city: "",
        locationsCount: "",
        estimatedDailyMeals: "",
        mealSlots: [],
        serviceDays: [],
        goLiveDate: "",
        budgetBand: "",
        billingModel: "",
        notes: "",
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Failed to submit the onboarding request."));
    } finally {
      setSubmitting(false);
    }
  }

  if (brandPending || contentPending) {
    return <ContentLoading />;
  }

  if (!content) {
    return <ContentUnavailable />;
  }

  return (
    <>
      <PageHero
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        description={content.hero.description}
        actions={(content.hero.actions ?? []).map((action) => ({
          href: action.href,
          label: action.label,
          variant: mapCmsActionVariant(action.variant),
          icon: <ArrowRight className="h-4 w-4" />,
        }))}
        metrics={content.hero.metrics}
        aside={
          content.hero.aside ? (
            <InfoCard
              tone="dark"
              eyebrow={content.hero.aside.eyebrow}
              title={content.hero.aside.title}
              description={content.hero.aside.description}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {(content.hero.aside.badges ?? []).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm font-semibold text-white/80"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </InfoCard>
          ) : undefined
        }
      />

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.challenges.header.eyebrow}
            title={content.challenges.header.title}
            description={content.challenges.header.description}
            align={content.challenges.header.align}
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {content.challenges.items.map((point, index) => (
              <InfoCard
                key={point.title}
                icon={challengeIcons[index] ?? Users}
                title={point.title}
                description={point.description}
                eyebrow={content.challenges.header.eyebrow}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container-max">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <SectionHeader
                eyebrow={content.process.header.eyebrow}
                title={content.process.header.title}
                description={content.process.header.description}
              />
              <div className="site-panel mt-8 p-6">
                <div className="muted-label">{content.process.trustedByEyebrow}</div>
                {clients.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {clients.map((client) => (
                      <div
                        key={client}
                        className="rounded-2xl border border-black/[0.06] bg-white/76 px-4 py-3 text-sm font-semibold text-text-primary"
                      >
                        {client}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <InfoCard
                      title={content.process.trustedByEmptyTitle}
                      description={content.process.trustedByEmptyDescription}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {content.process.steps.map((processStep, index) => (
                <InfoCard
                  key={processStep.title}
                  icon={processIcons[index] ?? BadgeCheck}
                  title={processStep.title}
                  description={processStep.description}
                  eyebrow={`Step ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.capabilities.header.eyebrow}
            title={content.capabilities.header.title}
            description={content.capabilities.header.description}
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {content.capabilities.items.map((feature, index) => (
              <InfoCard
                key={feature}
                icon={index % 2 === 0 ? ShieldCheck : Sparkles}
                title={feature}
                description=""
                eyebrow={content.capabilities.header.eyebrow}
              />
            ))}
          </div>
        </div>
      </section>

      {locale === "en" ? (
        <section className="page-section bg-[#fcfbf7]">
          <div className="container-max">
            <SectionHeader
              eyebrow="Corporate catering FAQ"
              title="What companies usually ask before choosing corporate catering in Pune"
              description="Get answers to common questions about meal plans, pricing, delivery schedules, and how Mealnova partners with offices across Pune."
              align="center"
            />
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {CORPORATE_SEARCH_FAQS.map((item) => (
                <InfoCard
                  key={item.title}
                  icon={item.icon}
                  eyebrow="Buyer questions"
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.pricing.header.eyebrow}
            title={content.pricing.header.title}
            description={content.pricing.header.description}
            align={content.pricing.header.align}
          />

          {pricing.length > 0 ? (
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {pricing.map((tier) => (
                <PricingCard key={tier.id} tier={tier} />
              ))}
            </div>
          ) : content.pricing.emptyState ? (
            <div className="mt-12">
              <InfoCard
                title={content.pricing.emptyState.title}
                description={content.pricing.emptyState.description}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section id="onboarding" className="page-section">
        <div className="container-max">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <InfoCard
              tone="dark"
              eyebrow={content.form.eyebrow}
              title={content.form.title}
              description={content.form.description}
            >
              {!submitted ? (
                <>
                  <FlowSteps current={step} steps={flowSteps} />

                  {step === 0 ? (
                    <div className="space-y-6">
                      <div>
                        <div className="text-xl font-semibold tracking-[-0.03em] text-white">
                          {content.form.companyTitle}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/65">
                          {content.form.companyDescription}
                        </p>
                      </div>

                      <label className="grid gap-2 text-sm font-medium text-white">
                        {content.form.fields.companyName}
                        <input
                          className="input-shell"
                          placeholder={content.form.fields.companyName}
                          required
                          value={form.companyName}
                          onChange={(event) => updateField("companyName", event.target.value)}
                        />
                      </label>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.form.fields.contactName}
                          <input
                            className="input-shell"
                            placeholder={content.form.fields.contactName}
                            required
                            value={form.contactName}
                            onChange={(event) => updateField("contactName", event.target.value)}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.form.fields.email}
                          <input
                            className="input-shell"
                            placeholder={content.form.fields.email}
                            type="email"
                            required
                            value={form.email}
                            onChange={(event) => updateField("email", event.target.value)}
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.form.fields.phone}
                          <input
                            className="input-shell"
                            placeholder={content.form.fields.phone}
                            type="tel"
                            required
                            value={form.phone}
                            onChange={(event) => updateField("phone", event.target.value)}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.form.fields.city}
                          <input
                            className="input-shell"
                            placeholder={content.form.fields.city}
                            required
                            value={form.city}
                            onChange={(event) => updateField("city", event.target.value)}
                          />
                        </label>
                      </div>

                      <label className="grid gap-2 text-sm font-medium text-white">
                        {content.form.fields.locationsCount}
                        <input
                          className="input-shell"
                          placeholder={content.form.fields.locationsCount}
                          type="number"
                          min="1"
                          required
                          value={form.locationsCount}
                          onChange={(event) => updateField("locationsCount", event.target.value)}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="space-y-6">
                      <div>
                        <div className="text-xl font-semibold tracking-[-0.03em] text-white">
                          {content.form.serviceTitle}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/65">
                          {content.form.serviceDescription}
                        </p>
                      </div>

                      <label className="grid gap-2 text-sm font-medium text-white">
                        {content.form.fields.estimatedDailyMeals}
                        <input
                          className="input-shell"
                          placeholder={content.form.fields.estimatedDailyMeals}
                          type="number"
                          min="1"
                          required
                          value={form.estimatedDailyMeals}
                          onChange={(event) => updateField("estimatedDailyMeals", event.target.value)}
                        />
                      </label>

                      <div className="grid gap-2">
                        <div className="text-sm font-medium text-white">
                          {content.form.labels.mealSlots}
                        </div>
                        <SelectionPills
                          options={mealSlotOptions}
                          values={form.mealSlots}
                          onToggle={toggleMealSlot}
                        />
                      </div>

                      <div className="grid gap-2">
                        <div className="text-sm font-medium text-white">
                          {content.form.labels.serviceDays}
                        </div>
                        <SelectionPills
                          options={serviceDayOptions}
                          values={form.serviceDays}
                          onToggle={toggleServiceDay}
                        />
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-6">
                      <div>
                        <div className="text-xl font-semibold tracking-[-0.03em] text-white">
                          {content.form.launchTitle}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/65">
                          {content.form.launchDescription}
                        </p>
                      </div>

                      <label className="grid gap-2 text-sm font-medium text-white">
                        {content.form.fields.goLiveDate}
                        <input
                          className="input-shell"
                          type="date"
                          required
                          value={form.goLiveDate}
                          onChange={(event) => updateField("goLiveDate", event.target.value)}
                        />
                      </label>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.form.fields.budgetBand}
                          <select
                            className="select-shell"
                            required
                            value={form.budgetBand}
                            onChange={(event) => updateField("budgetBand", event.target.value)}
                          >
                            <option value="">{content.form.fields.budgetBand}</option>
                            {budgetOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.form.fields.billingModel}
                          <select
                            className="select-shell"
                            required
                            value={form.billingModel}
                            onChange={(event) => updateField("billingModel", event.target.value)}
                          >
                            <option value="">{content.form.fields.billingModel}</option>
                            {billingOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="grid gap-2 text-sm font-medium text-white">
                        {content.form.fields.notes}
                        <textarea
                          className="textarea-shell"
                          placeholder={content.form.fields.notes}
                          value={form.notes}
                          onChange={(event) => updateField("notes", event.target.value)}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-6">
                      <div>
                        <div className="text-xl font-semibold tracking-[-0.03em] text-white">
                          {content.form.reviewTitle}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/65">
                          {content.form.reviewDescription}
                        </p>
                      </div>

                      <div className="grid gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                            Primary contact
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-white/72">
                            <div>
                              <div className="font-semibold text-white">{form.companyName}</div>
                              <div>{form.contactName}</div>
                              <div>{form.city}</div>
                            </div>
                            <div>
                              <div>{form.email}</div>
                              <div>{form.phone}</div>
                              <div>{form.locationsCount} locations</div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                            Service setup
                          </div>
                          <div className="mt-4 space-y-3 text-sm text-white/72">
                            <div className="flex items-center justify-between gap-3">
                              <span>{content.form.labels.estimatedDailyMeals}</span>
                              <span className="font-semibold text-white">
                                {form.estimatedDailyMeals}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span>{content.form.labels.mealSlots}</span>
                              <span className="text-right font-semibold text-white">
                                {form.mealSlots
                                  .map(
                                    (value) =>
                                      mealSlotOptions.find((option) => option.value === value)?.label ??
                                      value,
                                  )
                                  .join(", ")}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span>{content.form.labels.serviceDays}</span>
                              <span className="text-right font-semibold text-white">
                                {form.serviceDays
                                  .map(
                                    (value) =>
                                      serviceDayOptions.find((option) => option.value === value)?.label ??
                                      value,
                                  )
                                  .join(", ")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>{content.form.fields.goLiveDate}</span>
                              <span className="font-semibold text-white">{form.goLiveDate}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>{content.form.labels.budgetBand}</span>
                              <span className="font-semibold text-white">{form.budgetBand}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>{content.form.labels.billingModel}</span>
                              <span className="font-semibold text-white">{form.billingModel}</span>
                            </div>
                          </div>
                          {form.notes.trim() ? (
                            <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-white/72">
                              <span className="font-semibold text-white">Notes:</span>{" "}
                              {form.notes.trim()}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {submitError ? <p className="text-sm text-red-300">{submitError}</p> : null}

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={previousStep}
                      disabled={step === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {content.form.backLabel}
                    </Button>

                    {step < 3 ? (
                      <Button type="button" variant="white" onClick={nextStep}>
                        {content.form.nextLabel}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="button" variant="white" disabled={submitting} onClick={handleSubmit}>
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {content.form.submittingLabel}
                          </>
                        ) : (
                          <>
                            {content.form.submitLabel}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <FlowSteps current={flowSteps.length - 1} steps={flowSteps} />
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-medium text-white">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{content.form.successMessage}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 text-sm leading-7 text-white/72">
                    The onboarding request is now waiting for admin review. The team can approve,
                    reject, or request changes, and approved clients can be issued an ordering
                    access link directly from the admin panel.
                  </div>
                </div>
              )}
            </InfoCard>

            <div className="grid gap-6">
              <OnboardingSummaryCard
                content={content.form}
                form={form}
                mealSlotOptions={mealSlotOptions}
                serviceDayOptions={serviceDayOptions}
              />

              <InfoCard
                eyebrow={content.phoneCard.eyebrow}
                icon={PhoneCall}
                title={content.phoneCard.title}
                description={content.phoneCard.description}
              >
                {phone ? (
                  <a
                    href={phoneHref}
                    className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-text-primary"
                  >
                    {phone}
                  </a>
                ) : null}
                <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white/76 px-4 py-4 text-sm leading-7 text-text-secondary">
                  {content.phoneCard.summary}
                </div>
              </InfoCard>
            </div>
          </div>
        </div>
      </section>

      <PageCta
        eyebrow={content.cta.eyebrow}
        title={content.cta.title}
        description={content.cta.description}
        actions={content.cta.actions.map((action) => ({
          href: action.href,
          label: action.label,
          variant: mapCmsActionVariant(action.variant),
        }))}
      />
    </>
  );
}

function PricingCard({ tier }: { tier: PricingCardTier }) {
  return (
    <InfoCard
      tone={tier.isPopular ? "dark" : "light"}
      title={tier.name}
      description={tier.description ?? "Custom plan for your needs."}
      eyebrow={tier.isPopular ? "Most Popular" : "Plan"}
    >
      <div
        className={
          tier.isPopular
            ? "text-2xl font-bold tracking-tight text-white"
            : "text-2xl font-bold tracking-tight text-text-primary"
        }
      >
        {tier.price}
      </div>
      <div className="mt-5 space-y-3">
        {tier.features.map((feature) => (
          <div
            key={feature}
            className={
              tier.isPopular
                ? "text-sm leading-7 text-white/72"
                : "text-sm leading-7 text-text-secondary"
            }
          >
            {feature}
          </div>
        ))}
      </div>
      <Button
        variant={tier.isPopular ? "white" : "outline"}
        className="mt-6 w-full"
        asChild
      >
        <a href={tier.ctaLink ?? "#onboarding"}>{tier.ctaText ?? "Start onboarding"}</a>
      </Button>
    </InfoCard>
  );
}
