import { getRuntimeApiBaseUrl } from "@/lib/api-origin";
import { getFallbackBrandSettings } from "@/lib/brand-fallback";
import { getClientPreviewRoutePath, getServerPreviewSession } from "@/lib/cms-preview";

const REQUEST_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 8000);

// ---------------------------------------------------------------------------
// Generic fetch wrapper
// ---------------------------------------------------------------------------

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

function buildRequestSignal(signal?: AbortSignal | null): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const data = error.data as
      | { message?: string | string[]; error?: string }
      | null
      | undefined;

    if (Array.isArray(data?.message)) return data.message.join(", ");
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, params, headers: customHeaders, signal, ...rest } = options;
  const apiBaseUrl = getRuntimeApiBaseUrl();

  // Build URL with query params
  let url = `${apiBaseUrl}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...customHeaders,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: buildRequestSignal(signal),
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${endpoint}`);
    }
    throw error;
  }

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    throw new ApiError(response.status, response.statusText, data);
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API Response Wrapper (global interceptor wraps all responses)
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export interface MenuCategory {
  id: string;
  name: string;
  nameHi?: string;
  nameMr?: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
}

export interface PricingSlab {
  fromQty: number;
  toQty: number | null;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  nameHi?: string;
  nameMr?: string;
  slug: string;
  description?: string;
  price: number;
  categoryId: string;
  gstRate: number;
  imageUrl?: string;
  isJain?: boolean;
  isVegan?: boolean;
  isAvailable: boolean;
  spiceLevel: number;
  allergens?: string[];
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  category?: MenuCategory;
  pricingSlabs?: PricingSlab[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MenuItemsParams {
  categoryId?: string;
  isJain?: boolean;
  isVegan?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DailyMenu {
  date: string;
  locationId?: string;
  items: MenuItem[];
}

export interface WeeklyMenu {
  weekStart: string;
  days: { date: string; items: MenuItem[] }[];
}

export function getMenuCategories() {
  return apiFetch<ApiResponse<MenuCategory[]>>("/menu/categories");
}

export function getMenuItems(params?: MenuItemsParams) {
  return apiFetch<ApiResponse<PaginatedResponse<MenuItem>>>("/menu/items", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export function getMenuItem(slug: string) {
  return apiFetch<ApiResponse<MenuItem>>(`/menu/items/${encodeURIComponent(slug)}`);
}

export interface TodaysMenuResponse {
  id?: string;
  weekStart?: string;
  weekEnd?: string;
  status?: string;
  items?: {
    id: string;
    menuItemId: string;
    dayOfWeek: number;
    mealSlot: string;
    menuItem: MenuItem;
  }[];
}

export function getTodaysMenu(locationId: string) {
  return apiFetch<ApiResponse<TodaysMenuResponse | null>>("/menu/today", {
    params: { locationId },
  });
}

export function getWeeklyMenu(weekStart: string) {
  return apiFetch<ApiResponse<WeeklyMenu>>("/menu/weekly", {
    params: { weekStart },
  });
}

// ---------------------------------------------------------------------------
// Public inquiries
// ---------------------------------------------------------------------------

export interface ContactInquiryPayload {
  name: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
}

export interface CorporateInquiryPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  employeeCount?: number;
  city?: string;
  locationsCount?: number;
  estimatedDailyMeals?: number;
  mealSlots?: Array<"BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER">;
  serviceDays?: string[];
  goLiveDate?: string;
  budgetBand?: string;
  billingModel?: string;
  message: string;
}

export interface EventInquiryPayload {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  guestCount: number;
  eventDate: string;
  venueAddress: string;
  message: string;
  items?: Array<{
    menuItemId: string;
    quantityPerPlate: number;
  }>;
}

export function submitContactInquiry(payload: ContactInquiryPayload) {
  return apiFetch<ApiResponse<{ id: string; status: string }>>("/leads/contact", {
    method: "POST",
    body: payload,
  });
}

export function submitCorporateInquiry(payload: CorporateInquiryPayload) {
  return apiFetch<ApiResponse<{ id: string; status: string }>>("/leads/corporate", {
    method: "POST",
    body: payload,
  });
}

export function submitEventInquiry(payload: EventInquiryPayload) {
  return apiFetch<ApiResponse<{ id: string; status: string }>>("/leads/event", {
    method: "POST",
    body: payload,
  });
}

export interface CorporateOrderAccessLocation {
  id: string;
  name: string;
  slug: string;
  city: string;
  type: string;
  isRestricted: boolean;
}

export interface CorporateOrderAccessResponse {
  request: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    reviewStatus: string;
    reviewNotes?: string | null;
    accessTokenExpiresAt?: string | null;
  };
  locations: CorporateOrderAccessLocation[];
}

export interface ApprovedClientOrderRequest {
  accessToken: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  locationId: string;
  mealSlot: "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER";
  deliveryDate: string;
  items: { menuItemId: string; quantity: number }[];
  specialInstructions?: string;
}

export async function resolveCorporateOrderAccess(token: string) {
  const res = await apiFetch<ApiResponse<CorporateOrderAccessResponse>>(
    "/leads/corporate/access/resolve",
    {
      method: "POST",
      body: { token },
    },
  );

  return res.data;
}

export async function createApprovedClientOrder(data: ApprovedClientOrderRequest) {
  const res = await apiFetch<ApiResponse<GuestOrderResponse>>("/orders/approved-client", {
    method: "POST",
    body: data,
  });
  return res.data;
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export type LocationType =
  | "CORPORATE_CAFETERIA"
  | "HOSTEL"
  | "EVENT_VENUE"
  | "CLOUD_KITCHEN"
  | "CENTRAL_KITCHEN";

export interface Location {
  id: string;
  name: string;
  nameHi?: string | null;
  nameMr?: string | null;
  slug: string;
  type: LocationType;
  address: string;
  city: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  isRestricted?: boolean;
  dailyCapacity: number;
  openTime: string;
  closeTime: string;
  imageUrl?: string | null;
  corporateAccountId?: string | null;
  corporateAccount?: { id: string; companyName: string } | null;
  menuAssignments?: {
    menuItem: {
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      price: number;
      isVegan: boolean;
      isJain: boolean;
      allergens: string[];
      category: { id: string; name: string; slug: string };
    };
  }[];
}

export interface LocationsParams {
  type?: LocationType;
  city?: string;
}

export function getLocations(params?: LocationsParams) {
  return apiFetch<ApiResponse<Location[]>>("/locations", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export function getLocationBySlug(slug: string) {
  return apiFetch<ApiResponse<Location>>(`/locations/${encodeURIComponent(slug)}`);
}

export async function getLocation(slug: string): Promise<Location | null> {
  try {
    const res = await apiFetch<ApiResponse<Location>>(`/locations/${encodeURIComponent(slug)}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export function getLocationMenu(slug: string) {
  return apiFetch<ApiResponse<MenuItem[]>>(`/locations/${encodeURIComponent(slug)}/menu`);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface CreateOrderPayload {
  locationId: string;
  mealSlot: string;
  deliveryDate: string;
  specialInstructions?: string;
  items: { menuItemId: string; quantity: number }[];
}

export interface Order {
  id: string;
  status: string;
  locationId: string;
  mealSlot: string;
  deliveryDate: string;
  specialInstructions?: string;
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  gstAmount: number;
  total: number;
  createdAt: string;
}

export interface OrdersParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export function createOrder(data: CreateOrderPayload) {
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: data,
  });
}

export function getOrder(id: string) {
  return apiFetch<Order>(`/orders/${encodeURIComponent(id)}`);
}

export function getOrders(params?: OrdersParams) {
  return apiFetch<PaginatedResponse<Order>>("/orders", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

// ---------------------------------------------------------------------------
// Content (FAQs, Testimonials)
// ---------------------------------------------------------------------------

export interface FAQ {
  id: string;
  questionEn: string;
  questionHi?: string;
  questionMr?: string;
  answerEn: string;
  answerHi?: string;
  answerMr?: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  text: string;
  imageUrl?: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface FAQsParams {
  category?: string;
}

export function getFaqs(params?: FAQsParams) {
  return apiFetch<ApiResponse<FAQ[]>>("/cms/faqs", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export function getTestimonials() {
  return apiFetch<ApiResponse<Testimonial[]>>("/cms/testimonials");
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
  videoUrl?: string;
  eventDate?: string;
  location?: string;
  isFeatured: boolean;
  sortOrder: number;
}

export function getGalleryItems(category?: string) {
  return apiFetch<ApiResponse<GalleryItem[]>>("/cms/gallery", {
    params: { category },
  });
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export interface BlogPost {
  id: string;
  slug: string;
  titleEn: string;
  excerptEn?: string;
  contentEn: string;
  author: string;
  imageUrl?: string;
  tags: string[];
  category: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export function getBlogPosts(category?: string) {
  return apiFetch<ApiResponse<BlogPost[]>>("/cms/blog", {
    params: { category },
  });
}

export function getBlogPost(slug: string) {
  return apiFetch<ApiResponse<BlogPost>>(`/cms/blog/${encodeURIComponent(slug)}`);
}

// ---------------------------------------------------------------------------
// Careers
// ---------------------------------------------------------------------------

export interface CareerOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
  experience?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  isActive: boolean;
}

export function getCareerOpenings() {
  return apiFetch<ApiResponse<CareerOpening[]>>("/cms/careers");
}

// ---------------------------------------------------------------------------
// Client Logos
// ---------------------------------------------------------------------------

export interface ClientLogo {
  id: string;
  name: string;
  imageUrl?: string;
  website?: string;
  sortOrder: number;
}

export function getClientLogos() {
  return apiFetch<ApiResponse<ClientLogo[]>>("/cms/client-logos");
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export interface ServiceOffering {
  id: string;
  title: string;
  description: string;
  icon?: string;
  features: string[];
  ctaText?: string;
  ctaLink?: string;
  colorTheme: string;
  sortOrder: number;
}

export function getServiceOfferings() {
  return apiFetch<ApiResponse<ServiceOffering[]>>("/cms/services");
}

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

export interface EventType {
  id: string;
  name: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  minGuests?: number;
  maxGuests?: number;
  priceRange?: string;
  sortOrder: number;
}

export function getEventTypes() {
  return apiFetch<ApiResponse<EventType[]>>("/cms/event-types");
}

// ---------------------------------------------------------------------------
// Cuisines
// ---------------------------------------------------------------------------

export interface CuisineOption {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  pricePerPlate?: number;
  isLiveCounter: boolean;
  sortOrder: number;
}

export function getCuisineOptions() {
  return apiFetch<ApiResponse<CuisineOption[]>>("/cms/cuisines");
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export interface PricingTier {
  id: string;
  name: string;
  description?: string;
  price: string;
  features: string[];
  isPopular: boolean;
  ctaText?: string;
  ctaLink?: string;
  category: string;
  sortOrder: number;
}

export function getPricingTiers(category?: string) {
  return apiFetch<ApiResponse<PricingTier[]>>("/cms/pricing", {
    params: { category },
  });
}

// ---------------------------------------------------------------------------
// CMS Pages
// ---------------------------------------------------------------------------

export interface ContentPage {
  id: string;
  slug: string;
  titleEn: string;
  titleHi?: string | null;
  titleMr?: string | null;
  contentEn: string;
  contentHi?: string | null;
  contentMr?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getPageBySlug(
  slug: string,
  options?: { routePath?: string | null },
): Promise<ContentPage | null> {
  try {
    const previewSession = await getServerPreviewSession(options?.routePath);
    const clientPreviewRoute = !previewSession ? getClientPreviewRoutePath(options?.routePath) : null;
    const res = await apiFetch<ApiResponse<ContentPage>>(`/content/pages/${slug}`, {
      ...(previewSession
        ? {
            cache: "no-store",
            headers: {
              "x-cms-preview-token": previewSession.token,
              "x-cms-preview-route": previewSession.routePath,
            },
          }
        : clientPreviewRoute
          ? {
              headers: {
                "x-cms-preview-route": clientPreviewRoute,
              },
            }
        : {
            next: { tags: ["content:pages", `content:page:${slug}`], revalidate: 60 },
          }),
    } as RequestInit & { next?: { tags?: string[]; revalidate?: number } });
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    const detail =
      error instanceof ApiError
        ? `${error.status} ${error.statusText}`
        : error instanceof Error
          ? error.message
          : "unknown error";
    throw new Error(`Failed to load CMS page '${slug}': ${detail}`);
  }
}

// ---------------------------------------------------------------------------
// Brand Settings (CMS-controlled colors, fonts, site identity)
// ---------------------------------------------------------------------------

export interface BrandSettings {
  id: string;
  // Site identity
  siteName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  fssaiNumber: string;
  // Business / tax details
  gstin: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankUpi: string;
  // Primary color
  colorPrimary500: string;
  colorPrimary600: string;
  colorPrimary400: string;
  colorPrimary100: string;
  colorPrimary50: string;
  // Secondary color
  colorSecondary500: string;
  colorSecondary600: string;
  colorSecondary100: string;
  colorSecondary50: string;
  // Dark panel
  colorDarkPanelFrom: string;
  colorDarkPanelTo: string;
  // Footer
  colorFooterBg: string;
  // Surfaces
  colorSurface: string;
  colorSurfaceCard: string;
  // Text
  colorTextPrimary: string;
  colorTextSecondary: string;
  colorTextMuted: string;
  // Typography
  fontDisplay: string;
  fontBody: string;
  updatedAt: string;
}

export async function getBrandSettings(): Promise<BrandSettings> {
  try {
    const res = await apiFetch<BrandSettings | ApiResponse<BrandSettings>>(
      "/content/brand-settings",
      {
        next: { tags: ["content:brand"], revalidate: 60 },
      } as RequestInit & { next?: { tags?: string[]; revalidate?: number } },
    );
    // Handle both wrapped and unwrapped responses
    const data = (res as ApiResponse<BrandSettings>).data ?? (res as BrandSettings);
    if (!data) {
      throw new Error("Brand settings payload was empty.");
    }

    return data;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    console.error(`[brand-settings] live fetch failed (${detail}); serving fallback.`);
    return getFallbackBrandSettings();
  }
}

// ─── Guest Order / Checkout ───────────────────────────────────────────────

export interface GuestOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  companyName?: string;
  locationId: string;
  mealSlot: string;
  deliveryDate: string;
  items: { menuItemId: string; quantity: number }[];
  paymentMethod: "RAZORPAY" | "PAY_LATER";
  specialInstructions?: string;
}

export interface GuestOrderResponse {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
}

export interface CheckoutOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function createGuestOrder(data: GuestOrderRequest): Promise<GuestOrderResponse> {
  const res = await apiFetch<ApiResponse<GuestOrderResponse>>("/orders/guest", {
    method: "POST",
    body: data, // apiFetch already calls JSON.stringify internally
  });
  return res.data;
}

export async function createCheckoutOrder(orderId: string): Promise<CheckoutOrderResponse> {
  const res = await apiFetch<ApiResponse<CheckoutOrderResponse>>(`/payments/checkout/${orderId}`, {
    method: "POST",
  });
  return res.data;
}

export async function verifyPayment(data: VerifyPaymentRequest): Promise<{ success: boolean }> {
  // API expects snake_case Razorpay field names; map from our camelCase interface
  const res = await apiFetch<ApiResponse<{ success: boolean }>>("/payments/verify", {
    method: "POST",
    body: {
      razorpay_order_id: data.razorpayOrderId,
      razorpay_payment_id: data.razorpayPaymentId,
      razorpay_signature: data.razorpaySignature,
    },
  });
  return res.data;
}

/**
 * Converts BrandSettings into an inline CSS :root block.
 * Injected into <head> by layout.tsx at request time.
 * Overrides the Tailwind @theme defaults without a rebuild.
 */
export function brandSettingsToCss(s: BrandSettings): string {
  const primary700 = s.colorPrimary600;
  const primary800 = s.colorPrimary600;
  const primary900 = s.colorTextPrimary;
  const secondary400 = s.colorSecondary500;
  const gold = s.colorSecondary500;
  const goldLight = s.colorSecondary100;
  const goldDark = s.colorSecondary600;
  const surfaceWarm = s.colorSurface;
  const textOnDark = "#f8fafc";

  return `
    --color-primary-50:  ${s.colorPrimary50};
    --color-primary-100: ${s.colorPrimary100};
    --color-primary-400: ${s.colorPrimary400};
    --color-primary-500: ${s.colorPrimary500};
    --color-primary-600: ${s.colorPrimary600};
    --color-primary-700: ${primary700};
    --color-primary-800: ${primary800};
    --color-primary-900: ${primary900};
    --color-secondary-50:  ${s.colorSecondary50};
    --color-secondary-100: ${s.colorSecondary100};
    --color-secondary-400: ${secondary400};
    --color-secondary-500: ${s.colorSecondary500};
    --color-secondary-600: ${s.colorSecondary600};
    --color-surface:      ${s.colorSurface};
    --color-surface-warm: ${surfaceWarm};
    --color-surface-card: ${s.colorSurfaceCard};
    --color-surface-elevated: ${s.colorSurfaceCard};
    --color-surface-dark: ${s.colorFooterBg};
    --color-surface-dark-card: ${s.colorDarkPanelFrom};
    --color-surface-dark-elevated: ${s.colorDarkPanelTo};
    --color-text-primary:   ${s.colorTextPrimary};
    --color-text-secondary: ${s.colorTextSecondary};
    --color-text-muted:     ${s.colorTextMuted};
    --color-text-on-dark: ${textOnDark};
    --color-gold: ${gold};
    --color-gold-light: ${goldLight};
    --color-gold-dark: ${goldDark};
    --dp-from: ${s.colorDarkPanelFrom};
    --dp-to:   ${s.colorDarkPanelTo};
    --font-display: "${s.fontDisplay}", Georgia, serif;
    --font-body: "${s.fontBody}", "Noto Sans Devanagari", system-ui, sans-serif;
  `.trim();
}
