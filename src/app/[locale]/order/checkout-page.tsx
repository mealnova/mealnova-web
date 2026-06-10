"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageHero } from "@/components/site/page-primitives";
import { useBrandSettings } from "@/lib/hooks/use-content";
import { useMenuItems } from "@/lib/hooks/use-menu";
import {
  createApprovedClientOrder,
  resolveCorporateOrderAccess,
  type CorporateOrderAccessResponse,
} from "@/lib/api";
import { useCartStore } from "@/lib/stores/cart-store";
import {
  type CmsAction,
  type CmsHeroContent,
  mapCmsActionVariant,
  useResolvedStructuredPageContent,
} from "@/lib/page-content";

type StepKey = "schedule" | "items" | "details" | "review";

interface OrderPageContent {
  hero: CmsHeroContent;
  gate: {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: CmsAction;
    secondaryAction: CmsAction;
  };
  flow: {
    steps: string[];
    locationLabel: string;
    mealSlotLabel: string;
    deliveryDateLabel: string;
    detailsTitle: string;
    nameLabel: string;
    phoneLabel: string;
    emailLabel: string;
    specialInstructionsLabel: string;
    submitLabel: string;
    submittingLabel: string;
    successTitle: string;
    successDescription: string;
    reviewTitle: string;
    reviewDescription: string;
    emptyMenuTitle: string;
    emptyMenuDescription: string;
  };
}

const FALLBACK_CONTENT: OrderPageContent = {
  hero: {
    eyebrow: "Approved client ordering",
    title: "Place a meal order with your approved client access link",
    description:
      "Ordering is available only for approved clients. Use the access link issued after onboarding review to place daily meal requests online.",
  },
  gate: {
    eyebrow: "Ordering access required",
    title: "Online ordering is available only for approved clients.",
    description:
      "Public visitors can browse the menu, request event quotes, or submit a corporate onboarding request. Ordering links are issued after approval.",
    primaryAction: { href: "/corporate", label: "Request client onboarding" },
    secondaryAction: { href: "/menu", label: "Browse menu", variant: "outline" },
  },
  flow: {
    steps: ["Schedule", "Items", "Details", "Review"],
    locationLabel: "Delivery location",
    mealSlotLabel: "Meal slot",
    deliveryDateLabel: "Delivery date",
    detailsTitle: "Contact details",
    nameLabel: "Contact name",
    phoneLabel: "Phone number",
    emailLabel: "Email address",
    specialInstructionsLabel: "Special instructions",
    submitLabel: "Submit order",
    submittingLabel: "Submitting order...",
    successTitle: "Order submitted",
    successDescription:
      "Your approved-client meal order has been submitted successfully. Our team will review the request and confirm service details shortly.",
    reviewTitle: "Review order",
    reviewDescription:
      "Confirm the schedule, items, and contact details before submitting this approved-client order request.",
    emptyMenuTitle: "No menu items are available right now.",
    emptyMenuDescription:
      "The public catalog is currently empty. Please try again later or contact the team through your onboarding channel.",
  },
};

const FALLBACK_STEPS = ["Schedule", "Items", "Details", "Review"];
const MEAL_SLOTS = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"] as const;

function StepBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="mb-10 flex items-center justify-between">
      {steps.map((label, index) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                index < current
                  ? "bg-[var(--color-primary-500)] text-white"
                  : index === current
                    ? "bg-[var(--color-secondary-500)] text-white"
                    : "border border-gray-200 bg-[var(--color-surface-card)] text-[var(--color-text-secondary)]"
              }`}
            >
              {index < current ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={`mt-1 hidden text-[10px] font-medium sm:block ${
                index === current
                  ? "text-[var(--color-secondary-500)]"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              {label}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <div
              className={`mx-1 mb-4 h-0.5 w-8 sm:w-16 ${
                index < current ? "bg-[var(--color-primary-500)]" : "bg-gray-200"
              }`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function CheckoutPage() {
  const searchParams = useSearchParams();
  const accessToken = searchParams?.get("access")?.trim() ?? "";
  const { data: brand, isPending: brandPending } = useBrandSettings();
  const {
    data: cmsContent,
    isPending: contentPending,
  } = useResolvedStructuredPageContent<OrderPageContent>("order", { brand });
  const content = cmsContent ?? FALLBACK_CONTENT;
  const steps = content.flow.steps.length >= 4 ? content.flow.steps : FALLBACK_STEPS;

  const [accessData, setAccessData] = useState<CorporateOrderAccessResponse | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [resolvingAccess, setResolvingAccess] = useState(true);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    total: number;
  } | null>(null);

  const {
    locationId,
    mealSlot,
    deliveryDate,
    items,
    customerName,
    customerPhone,
    customerEmail,
    specialInstructions,
    setLocation,
    setMealSlot,
    setDeliveryDate,
    setSpecialInstructions,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomerDetails,
    total,
  } = useCartStore();

  const { data: menuData } = useMenuItems();
  const menuItems = useMemo(() => {
    const raw = ((menuData as { data?: { data?: any[] } })?.data?.data ??
      (menuData as { data?: any[] })?.data ??
      []) as Array<{
      id: string;
      name: string;
      description?: string;
      price: number;
      isJain?: boolean;
      isVegan?: boolean;
    }>;
    return raw.filter((item) => item);
  }, [menuData]);

  useEffect(() => {
    let cancelled = false;

    async function resolveAccess() {
      if (!accessToken) {
        setAccessData(null);
        setAccessError(null);
        setResolvingAccess(false);
        return;
      }

      setResolvingAccess(true);
      try {
        const data = await resolveCorporateOrderAccess(accessToken);
        if (cancelled) return;
        setAccessData(data);
        setAccessError(null);
      } catch (error) {
        if (cancelled) return;
        setAccessData(null);
        setAccessError(error instanceof Error ? error.message : "Failed to resolve ordering access");
      } finally {
        if (!cancelled) setResolvingAccess(false);
      }
    }

    void resolveAccess();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessData) return;
    setCustomerDetails({
      name: customerName || accessData.request.contactName,
      phone: customerPhone || accessData.request.phone,
      email: customerEmail || accessData.request.email,
      companyName: accessData.request.companyName,
    });
  }, [accessData, customerEmail, customerName, customerPhone, setCustomerDetails]);

  const allowedLocations = accessData?.locations ?? [];
  const selectedLocation = allowedLocations.find((location) => location.id === locationId) ?? null;
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  function getItemQty(menuItemId: string) {
    return items.find((item) => item.menuItemId === menuItemId)?.quantity ?? 0;
  }

  function handleQtyChange(
    menuItemId: string,
    name: string,
    price: number,
    isJain?: boolean,
    isVegan?: boolean,
    delta = 1,
  ) {
    const current = getItemQty(menuItemId);
    const next = current + delta;
    if (next <= 0) {
      removeItem(menuItemId);
      return;
    }

    if (current === 0) {
      addItem({ menuItemId, name, price, isJain, isVegan });
      return;
    }

    updateQuantity(menuItemId, next);
  }

  async function placeOrder() {
    if (!accessToken) {
      toast.error("This ordering link is missing or invalid.");
      return;
    }
    if (!locationId || !deliveryDate || !mealSlot || items.length === 0) {
      toast.error("Please complete the schedule and menu selection before submitting.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please provide the main contact details.");
      return;
    }

    setLoading(true);
    try {
      const order = await createApprovedClientOrder({
        accessToken,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        locationId,
        mealSlot: mealSlot as (typeof MEAL_SLOTS)[number],
        deliveryDate,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
        specialInstructions: specialInstructions.trim() || undefined,
      });

      setConfirmedOrder({
        orderNumber: order.orderNumber,
        total: order.total,
      });
      clearCart();
      setStep(4);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit order.");
    } finally {
      setLoading(false);
    }
  }

  if (brandPending || contentPending || resolvingAccess) {
    return <ContentLoading />;
  }

  if (!content) {
    return <ContentUnavailable />;
  }

  if (!accessData) {
    return (
      <>
        <PageHero
          eyebrow={content.gate.eyebrow}
          title={content.gate.title}
          description={accessError ?? content.gate.description}
          actions={[
            {
              href: content.gate.primaryAction.href,
              label: content.gate.primaryAction.label,
              variant: mapCmsActionVariant(content.gate.primaryAction.variant),
            },
            {
              href: content.gate.secondaryAction.href,
              label: content.gate.secondaryAction.label,
              variant: mapCmsActionVariant(content.gate.secondaryAction.variant),
            },
          ]}
        />

        <section className="page-section">
          <div className="container-max">
            <div className="grid gap-6 lg:grid-cols-3">
              <InfoCard
                icon={Building2}
                title="Approved clients only"
                description="Ordering links are issued after the admin team reviews and approves a corporate onboarding request."
              />
              <InfoCard
                icon={ShoppingCart}
                title="Menu stays public"
                description="Visitors can still browse the public menu and meal packages before requesting access."
              />
              <InfoCard
                icon={ArrowRight}
                title="Use the onboarding flow"
                description="Submit your requirements through the corporate onboarding page to receive an access link."
              />
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-12">
      <div className="container-max">
        <PageHero
          eyebrow={content.hero.eyebrow}
          title={content.hero.title}
          description={content.hero.description}
          metrics={[
            { value: accessData.request.companyName, label: "Approved client" },
            { value: accessData.locations.length.toString(), label: "Available locations" },
            {
              value: accessData.request.accessTokenExpiresAt
                ? new Date(accessData.request.accessTokenExpiresAt).toLocaleDateString("en-IN")
                : "No expiry",
              label: "Access valid until",
            },
          ]}
        />

        <div className="mx-auto mt-8 max-w-5xl">
          <StepBar current={Math.min(step, steps.length - 1)} steps={steps} />

          {step === 0 ? (
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <InfoCard
                icon={Building2}
                eyebrow="Approved access"
                title={accessData.request.companyName}
                description="This link is tied to your approved client onboarding request."
              >
                <div className="space-y-3 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{accessData.request.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{accessData.request.email}</span>
                  </div>
                  {accessData.request.reviewNotes ? (
                    <div className="rounded-xl border border-black/[0.06] bg-white/80 px-4 py-3 text-sm text-text-secondary">
                      {accessData.request.reviewNotes}
                    </div>
                  ) : null}
                </div>
              </InfoCard>

              <div className="site-panel rounded-2xl p-8 space-y-5">
                <h2 className="text-h3 text-[var(--color-text-primary)]">Schedule your order</h2>

                <div>
                  <label className="muted-label block mb-1.5">{content.flow.locationLabel}</label>
                  <select
                    value={locationId ?? ""}
                    onChange={(event) => setLocation(event.target.value)}
                    className="input-shell w-full"
                  >
                    <option value="">Select a delivery location</option>
                    {allowedLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} · {location.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="muted-label block mb-1.5">{content.flow.mealSlotLabel}</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {MEAL_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setMealSlot(slot)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                          mealSlot === slot
                            ? "border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white"
                            : "border-gray-200 bg-white text-[var(--color-text-primary)] hover:border-[var(--color-primary-500)]"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="muted-label block mb-1.5">{content.flow.deliveryDateLabel}</label>
                  <input
                    type="date"
                    value={deliveryDate ?? ""}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                    className="input-shell w-full"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(1)}
                    disabled={!locationId || !mealSlot || !deliveryDate}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="site-panel rounded-2xl p-5 flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {selectedLocation?.name ?? "No location selected"} · {mealSlot} · {deliveryDate}
                </span>
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary-500)]">
                  <ShoppingCart className="h-4 w-4" />
                  {cartItemCount} item{cartItemCount !== 1 ? "s" : ""}
                </div>
              </div>

              {menuItems.length === 0 ? (
                <div className="site-panel rounded-2xl p-10 text-center text-[var(--color-text-secondary)]">
                  <p className="text-lg font-semibold text-text-primary">{content.flow.emptyMenuTitle}</p>
                  <p className="mt-2 text-sm">{content.flow.emptyMenuDescription}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="site-panel rounded-2xl p-5 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--color-text-primary)]">{item.name}</p>
                        {item.description ? (
                          <p className="mt-0.5 line-clamp-1 text-sm text-[var(--color-text-secondary)]">
                            {item.description}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-3">
                          <span className="font-bold text-[var(--color-primary-500)]">₹{item.price}</span>
                          {item.isVegan ? <Badge variant="vegan">Vegan</Badge> : null}
                          {item.isJain ? <Badge variant="jain">Jain</Badge> : null}
                          {!item.isVegan && !item.isJain ? <Badge variant="veg">Pure Veg</Badge> : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {getItemQty(item.id) > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleQtyChange(item.id, item.name, item.price, item.isJain, item.isVegan, -1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center font-semibold text-sm">{getItemQty(item.id)}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleQtyChange(item.id, item.name, item.price, item.isJain, item.isVegan, 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-white hover:opacity-90"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, item.name, item.price, item.isJain, item.isVegan, 1)}
                            className="rounded-lg bg-[var(--color-primary-500)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(2)} disabled={items.length === 0}>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="site-panel rounded-2xl p-8 space-y-5">
              <h2 className="text-h3 text-[var(--color-text-primary)]">{content.flow.detailsTitle}</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="muted-label block mb-1.5">{content.flow.nameLabel}</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) =>
                      setCustomerDetails({
                        name: event.target.value,
                        phone: customerPhone,
                        email: customerEmail,
                        companyName: accessData.request.companyName,
                      })
                    }
                    className="input-shell w-full"
                  />
                </div>
                <div>
                  <label className="muted-label block mb-1.5">{content.flow.phoneLabel}</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) =>
                      setCustomerDetails({
                        name: customerName,
                        phone: event.target.value,
                        email: customerEmail,
                        companyName: accessData.request.companyName,
                      })
                    }
                    className="input-shell w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="muted-label block mb-1.5">{content.flow.emailLabel}</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(event) =>
                      setCustomerDetails({
                        name: customerName,
                        phone: customerPhone,
                        email: event.target.value,
                        companyName: accessData.request.companyName,
                      })
                    }
                    className="input-shell w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="muted-label block mb-1.5">{content.flow.specialInstructionsLabel}</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(event) => setSpecialInstructions(event.target.value)}
                    className="textarea-shell"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!customerName.trim() || !customerPhone.trim()}>
                  Review
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="site-panel rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-h3 text-[var(--color-text-primary)]">{content.flow.reviewTitle}</h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {content.flow.reviewDescription}
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.menuItemId} className="rounded-xl border border-black/[0.06] bg-white px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">{item.name}</p>
                        <p className="text-sm text-text-secondary">Qty {item.quantity}</p>
                      </div>
                      <div className="font-semibold text-text-primary">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-black/[0.06] bg-[var(--color-surface-card)] p-5">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Location</span>
                      <span className="font-medium text-text-primary">{selectedLocation?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Meal slot</span>
                      <span className="font-medium text-text-primary">{mealSlot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Delivery date</span>
                      <span className="font-medium text-text-primary">{deliveryDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Contact</span>
                      <span className="font-medium text-text-primary">{customerName}</span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-black/[0.06] pt-4 flex justify-between text-base font-bold">
                    <span>Total (incl. 5% GST)</span>
                    <span className="text-[var(--color-primary-500)]">₹{total.toFixed(2)}</span>
                  </div>

                  <Button className="mt-5 w-full" onClick={placeOrder} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {content.flow.submittingLabel}
                      </>
                    ) : (
                      <>
                        {content.flow.submitLabel}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          ) : null}

          {step === 4 && confirmedOrder ? (
            <div className="site-panel rounded-2xl p-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <h2 className="section-title mb-3">{content.flow.successTitle}</h2>
              <p className="mx-auto mb-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
                {content.flow.successDescription}
              </p>
              <p className="mb-2 text-[var(--color-text-secondary)]">Order Number:</p>
              <p className="mb-4 font-mono text-2xl font-bold text-[var(--color-primary-500)]">
                {confirmedOrder.orderNumber}
              </p>
              <p className="mb-8 text-sm text-[var(--color-text-secondary)]">
                Total submitted: ₹{confirmedOrder.total.toFixed(2)}
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={() => setStep(0)}>Place another order</Button>
                <Button variant="outline" asChild>
                  <Link href="/menu">Browse menu</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
