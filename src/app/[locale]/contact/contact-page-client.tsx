"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MessageSquareText,
  MapPin,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { PageCta } from "@/components/site/page-primitives";
import { getApiErrorMessage, submitContactInquiry } from "@/lib/api";
import { useBrandSettings } from "@/lib/hooks/use-content";
import {
  type CmsCardItem,
  type CmsCtaContent,
  type CmsHeroContent,
  type CmsSectionHeader,
  type CmsUnavailableContent,
  mapCmsActionVariant,
  useResolvedStructuredPageContent,
} from "@/lib/page-content";

export interface ContactPageContent {
  hero: CmsHeroContent;
  methodsSection: {
    header: CmsSectionHeader;
    methods: CmsCardItem[];
  };
  form: {
    eyebrow: string;
    title: string;
    description: string;
    successMessage: string;
    fields: {
      name: string;
      email: string;
      phone: string;
      company: string;
      message: string;
    };
    submitLabel: string;
    submittingLabel: string;
  };
  office: {
    eyebrow: string;
    title: string;
    description: string;
    notes: string[];
  };
  hours: {
    eyebrow: string;
    title: string;
    description: string;
  };
  cta: CmsCtaContent;
  unavailable?: CmsUnavailableContent;
}

function methodIcon(item: CmsCardItem, index: number) {
  if (item.href?.startsWith("tel:")) return PhoneCall;
  if (item.href?.startsWith("mailto:")) return Mail;
  if (item.href?.startsWith("/locations")) return MapPin;
  return [PhoneCall, Mail, MapPin][index] ?? PhoneCall;
}

export function ContactPageClient({
  initialContent,
}: {
  initialContent?: ContactPageContent | null;
}) {
  const { data: brandSettings, isPending: brandPending } = useBrandSettings();
  const phone = brandSettings?.phone?.trim() ?? "";
  const email = brandSettings?.email?.trim() ?? "";
  const phoneHref = phone ? `tel:${phone.replace(/[\s-]/g, "")}` : "#";
  const emailHref = email ? `mailto:${email}` : "#";
  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<ContactPageContent>(
    "contact",
    {
      brand: brandSettings,
    },
    {
      initialData: initialContent,
    },
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const contactMethods = useMemo(
    () =>
      (content?.methodsSection.methods ?? []).map((method, index) => ({
        ...method,
        href:
          method.href === "tel:{{brand.phone}}"
            ? phoneHref
            : method.href === "mailto:{{brand.email}}"
              ? emailHref
              : method.href,
        icon: methodIcon(method, index),
      })),
    [content, emailHref, phoneHref],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitContactInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || undefined,
        message: formData.company
          ? `Company: ${formData.company}\n\n${formData.message}`
          : formData.message,
      });
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, ""));
    } finally {
      setIsSubmitting(false);
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
      <section className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-warm)] px-4 py-[clamp(5rem,8vw,7rem)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[10%] top-28 h-64 w-64 rounded-full bg-[var(--color-secondary-500)]/5 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-32 right-[8%] h-80 w-80 rounded-full bg-[var(--color-primary-500)]/5 blur-3xl"
        />

        <div className="container-max relative z-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="eyebrow justify-center">
              <Sparkles className="h-4 w-4" />
              {content.hero.eyebrow}
            </span>
            <h1 className="mt-4 font-display text-[clamp(2.75rem,6vw,5rem)] font-normal leading-none tracking-[-0.02em] text-[var(--color-text-primary)]">
              {content.hero.title}
            </h1>
            <div className="mt-6 h-[3px] w-24 rounded-full bg-[var(--color-secondary-500)]" />
            <p className="body-large mt-8 max-w-2xl text-pretty text-center">
              {content.hero.description}
            </p>
          </div>

          {content.hero.metrics?.length ? (
            <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {content.hero.metrics.map((metric) => (
                <div
                  key={`${metric.label}-${metric.value}`}
                  className="rounded-lg border border-[rgba(15,23,42,0.08)] bg-white/55 px-4 py-4 text-center shadow-sm backdrop-blur"
                >
                  <div className={`${contactMetricValueClass(metric.value)} mx-auto max-w-full font-bold tracking-[-0.04em] text-[var(--color-text-primary)]`}>
                    {metric.value}
                  </div>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(360px,1.05fr)_minmax(0,0.82fr)] lg:items-start xl:gap-10">
            <div className="order-2 space-y-5 lg:order-none">
              <div className="mb-7">
                <div className="eyebrow">{content.methodsSection.header.eyebrow}</div>
                <h2 className="text-h3 mt-3 text-[var(--color-text-primary)]">
                  {content.methodsSection.header.title}
                </h2>
                {content.methodsSection.header.description ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
                    {content.methodsSection.header.description}
                  </p>
                ) : null}
              </div>

              {contactMethods.map((method) => (
                <ContactPathCard
                  key={`${method.title}-${method.href ?? method.value ?? method.description ?? ""}`}
                  description={method.description}
                  eyebrow={content.methodsSection.header.eyebrow}
                  href={method.href}
                  icon={method.icon}
                  title={method.title}
                  value={method.value}
                />
              ))}
            </div>

            <div className="site-panel-dark relative order-1 overflow-hidden p-6 lg:order-none lg:p-8">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-secondary-500)] to-transparent opacity-70" />
              <div className="eyebrow text-[var(--color-secondary-500)]">
                <MessageSquareText className="h-4 w-4" />
                {content.form.eyebrow}
              </div>
              <h2 className="section-title mt-4 text-white">{content.form.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/62">
                {content.form.description}
              </p>
              <div className="mt-7">
                {submitSuccess ? (
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-5 py-4 text-sm font-medium text-white">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    {content.form.successMessage}
                  </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      id="contact-name"
                      name="name"
                      aria-label={content.form.fields.name}
                      className="input-shell"
                      placeholder={content.form.fields.name}
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                    />
                    <input
                      id="contact-email"
                      name="email"
                      aria-label={content.form.fields.email}
                      className="input-shell"
                      placeholder={content.form.fields.email}
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      id="contact-phone"
                      name="phone"
                      aria-label={content.form.fields.phone}
                      className="input-shell"
                      placeholder={content.form.fields.phone}
                      type="tel"
                      autoComplete="tel"
                      required
                      value={formData.phone}
                      onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                    />
                    <input
                      id="contact-company"
                      name="company"
                      aria-label={content.form.fields.company}
                      className="input-shell"
                      placeholder={content.form.fields.company}
                      autoComplete="organization"
                      value={formData.company}
                      onChange={(event) => setFormData((current) => ({ ...current, company: event.target.value }))}
                    />
                  </div>
                  <textarea
                    id="contact-message"
                    name="message"
                    aria-label={content.form.fields.message}
                    className="textarea-shell"
                    placeholder={content.form.fields.message}
                    required
                    value={formData.message}
                    onChange={(event) => setFormData((current) => ({ ...current, message: event.target.value }))}
                  />
                  {submitError ? <p className="text-sm text-red-300">{submitError}</p> : null}
                  <Button variant="secondary" className="w-full sm:w-fit" disabled={isSubmitting}>
                    {isSubmitting ? (
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
                </form>
              )}
              </div>
            </div>

            <div className="order-3 space-y-5 lg:order-none">
              <ContactDetailCard
                icon={Building2}
                eyebrow={content.office.eyebrow}
                title={content.office.title}
                description={content.office.description}
              >
                {content.office.notes.length > 0 ? (
                  <div className="space-y-3">
                    {content.office.notes.map((note) => (
                      <div
                        key={note}
                        className="rounded-lg border border-[rgba(15,23,42,0.08)] bg-white/60 px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)]"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                ) : null}
              </ContactDetailCard>

              <ContactDetailCard
                icon={Clock3}
                eyebrow={content.hours.eyebrow}
                title={content.hours.title}
                description={content.hours.description}
              />

              {content.hero.aside ? (
                <ContactDetailCard
                  icon={Sparkles}
                  eyebrow={content.hero.aside.eyebrow}
                  title={content.hero.aside.title}
                  description={content.hero.aside.description}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <PageCta
        eyebrow={content.cta.eyebrow}
        title={content.cta.title}
        description={content.cta.description}
        actions={content.cta.actions.map((action) => ({
          href: action.href === "tel:{{brand.phone}}" ? phoneHref : action.href,
          label: action.label,
          variant: mapCmsActionVariant(action.variant),
        }))}
      />
    </>
  );
}

function ContactPathCard({
  description,
  eyebrow,
  href,
  icon: Icon,
  title,
  value,
}: {
  description?: string;
  eyebrow?: string;
  href?: string;
  icon: typeof PhoneCall;
  title: string;
  value?: string;
}) {
  const content = (
    <>
      <div className="mb-5 flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[rgba(15,23,42,0.08)] bg-white/55 text-[var(--color-secondary-600)] shadow-sm transition-colors duration-300 group-hover:bg-[var(--color-secondary-50)]">
          <Icon className="h-6 w-6" />
          <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-[var(--color-primary-300)]" />
        </div>
        <div className="min-w-0">
          {eyebrow ? (
            <p className="muted-label mb-1 text-[var(--color-secondary-600)]">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="text-h3 text-[var(--color-text-primary)]">{title}</h3>
        </div>
      </div>
      {description ? (
        <p className="pl-0 text-sm leading-7 text-[var(--color-text-secondary)] sm:pl-[4.5rem]">
          {description}
        </p>
      ) : null}
      {value ? (
        <div className="mt-3 pl-0 text-sm font-semibold text-[var(--color-text-primary)] sm:pl-[4.5rem]">
          {value}
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a href={href} className="group block min-w-0">
        {content}
      </a>
    );
  }

  return <div className="group min-w-0">{content}</div>;
}

function contactMetricValueClass(value: string) {
  if (value.length > 18) {
    return "break-words text-[clamp(0.85rem,1.25vw,1.05rem)] leading-tight";
  }

  if (value.length > 10) {
    return "break-words text-[clamp(1rem,1.6vw,1.25rem)] leading-tight";
  }

  return "text-2xl";
}

function ContactDetailCard({
  children,
  description,
  eyebrow,
  icon: Icon,
  title,
}: {
  children?: React.ReactNode;
  description?: string;
  eyebrow?: string;
  icon: typeof Building2;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-[rgba(15,23,42,0.08)] bg-white/55 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[rgba(15,23,42,0.08)] bg-[var(--color-secondary-50)] text-[var(--color-secondary-600)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {eyebrow ? <p className="muted-label">{eyebrow}</p> : null}
          <h3 className="text-h3 mt-1 text-[var(--color-text-primary)]">{title}</h3>
        </div>
      </div>
      {description ? (
        <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}
