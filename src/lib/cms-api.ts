import type {
  CareerOpening,
  FAQ,
  Location,
  MenuCategory,
  MenuItem,
  PricingSlab,
  Testimonial,
} from "@/lib/api";
import { normalizeBlogCategoryId } from "@mealnova/shared";
import { getRuntimeApiBaseUrl } from "@/lib/api-origin";
import { getClientPreviewRoutePath, getServerPreviewSession } from "@/lib/cms-preview";

const REQUEST_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 8000);
const loggedFetchFailures = new Set<string>();

type CmsFetchOptions = {
  tags?: string[];
  routePath?: string | null;
};

function logFetchFailure(path: string, detail: string) {
  if (loggedFetchFailures.has(path)) return;
  loggedFetchFailures.add(path);
  console.error(`[content-fetch] ${path}: ${detail}`);
}

function buildFetchError(path: string, detail: string) {
  return new Error(`CMS request failed for ${path}: ${detail}`);
}

function nextFetchOptions(tags?: string[]) {
  return tags?.length ? { revalidate: 300, tags } : { revalidate: 300 };
}

function extractArrayPayload<T>(path: string, json: unknown): T[] {
  if (!json || typeof json !== "object") {
    throw buildFetchError(path, "invalid JSON payload");
  }

  const payload = (json as { data?: unknown }).data;
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }

  throw buildFetchError(path, "invalid collection payload");
}

function extractSinglePayload<T>(path: string, json: unknown): T | null {
  if (!json || typeof json !== "object" || !("data" in json)) {
    throw buildFetchError(path, "invalid item payload");
  }

  return ((json as { data?: T | null }).data ?? null) as T | null;
}

async function apiFetch<T>(path: string, options: CmsFetchOptions = {}): Promise<T[]> {
  const apiBaseUrl = getRuntimeApiBaseUrl();
  try {
    const previewSession = await getServerPreviewSession(options.routePath);
    const clientPreviewRoute = !previewSession ? getClientPreviewRoutePath(options.routePath) : null;
    const res = await fetch(`${apiBaseUrl}${path}`, {
      ...(previewSession
        ? {
            cache: "no-store" as const,
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
            next: nextFetchOptions(options.tags),
          }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = `upstream returned ${res.status} ${res.statusText}`;
      logFetchFailure(path, detail);
      throw buildFetchError(path, detail);
    }
    const json = await res.json();
    return extractArrayPayload<T>(path, json);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CMS request failed for")) {
      throw error;
    }

    const detail =
      error instanceof Error && error.name === "AbortError"
        ? `request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : "request failed";
    logFetchFailure(path, detail);
    throw buildFetchError(path, detail);
  }
}

async function apiFetchOne<T>(path: string, options: CmsFetchOptions = {}): Promise<T | null> {
  const apiBaseUrl = getRuntimeApiBaseUrl();
  try {
    const previewSession = await getServerPreviewSession(options.routePath);
    const clientPreviewRoute = !previewSession ? getClientPreviewRoutePath(options.routePath) : null;
    const res = await fetch(`${apiBaseUrl}${path}`, {
      ...(previewSession
        ? {
            cache: "no-store" as const,
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
            next: nextFetchOptions(options.tags),
          }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const detail = `upstream returned ${res.status} ${res.statusText}`;
      logFetchFailure(path, detail);
      throw buildFetchError(path, detail);
    }
    const json = await res.json();
    return extractSinglePayload<T>(path, json);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CMS request failed for")) {
      throw error;
    }

    const detail =
      error instanceof Error && error.name === "AbortError"
        ? `request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : "request failed";
    logFetchFailure(path, detail);
    throw buildFetchError(path, detail);
  }
}

interface NCategory {
  id: string | number;
  name: string;
  nameHi?: string;
  nameMr?: string;
  slug: string;
  sortOrder?: number;
  menuType?: string;
  isActive?: boolean;
}

interface NPricingSlab {
  fromQty: number;
  toQty: number | null;
  price: number;
  sortOrder?: number;
}

interface NItem {
  id: string | number;
  name: string;
  nameHi?: string;
  nameMr?: string;
  slug: string;
  description?: string;
  category?: NCategory | null;
  basePrice?: string | number;
  price?: string | number;
  isJain?: boolean;
  isVegan?: boolean;
  spiceLevel?: number;
  allergens?: string[];
  tags?: string[];
  isAvailable?: boolean;
  isSignature?: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  servingSize?: string;
  isPublished?: boolean;
  pricingSlabs?: NPricingSlab[];
}

interface NLocation {
  id: string | number;
  name: string;
  slug: string;
  type?: string;
  address?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactPerson?: string;
  isActive?: boolean;
  dailyCapacity?: number;
  openTime?: string;
  closeTime?: string;
  imageUrl?: string;
  isRestricted?: boolean;
  fssaiLicense?: string;
}

function mapLocationType(t?: string): Location["type"] {
  if (t === "HOSTEL") return "HOSTEL";
  if (t === "EVENT_VENUE") return "EVENT_VENUE";
  if (t === "CENTRAL_KITCHEN") return "CENTRAL_KITCHEN";
  if (t === "CLOUD_KITCHEN") return "CLOUD_KITCHEN";
  return "CORPORATE_CAFETERIA";
}

function mapCategory(d: NCategory): MenuCategory {
  return {
    id: String(d.id),
    name: d.name,
    nameHi: d.nameHi,
    nameMr: d.nameMr,
    slug: d.slug,
    sortOrder: d.sortOrder ?? 0,
  };
}

function mapPricingSlabs(slabs?: NPricingSlab[]): PricingSlab[] | undefined {
  if (!slabs || slabs.length === 0) return undefined;
  return slabs
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((s) => ({ fromQty: s.fromQty, toQty: s.toQty, price: s.price }));
}

function mapItem(d: NItem): MenuItem {
  const cat = d.category ? mapCategory(d.category) : undefined;
  return {
    id: String(d.id),
    name: d.name,
    nameHi: d.nameHi,
    nameMr: d.nameMr,
    slug: d.slug,
    description: d.description,
    price: Number(d.basePrice ?? d.price ?? 0),
    categoryId: cat ? cat.id : "",
    category: cat,
    gstRate: 0.05,
    isAvailable: d.isAvailable !== false,
    isJain: d.isJain ?? false,
    isVegan: d.isVegan ?? false,
    spiceLevel: d.spiceLevel ?? 0,
    allergens: d.allergens ?? [],
    calories: d.calories,
    protein: d.protein,
    carbohydrates: d.carbohydrates ?? d.carbs,
    fat: d.fat,
    pricingSlabs: mapPricingSlabs(d.pricingSlabs),
  };
}

function mapLocation(d: NLocation): Location {
  return {
    id: String(d.id),
    name: d.name,
    slug: d.slug,
    type: mapLocationType(d.type),
    address: d.address ?? "",
    city: d.city ?? "Pune",
    pincode: d.pincode ?? "",
    latitude: d.latitude,
    longitude: d.longitude,
    contactPerson: d.contactPerson,
    contactPhone: d.contactPhone,
    isActive: d.isActive !== false,
    dailyCapacity: d.dailyCapacity ?? 0,
    openTime: d.openTime ?? "08:00",
    closeTime: d.closeTime ?? "20:00",
    imageUrl: d.imageUrl,
  };
}

export async function cmsMenuCategories(): Promise<MenuCategory[]> {
  const raw = await apiFetch<NCategory>("/menu/categories", { tags: ["menu:categories"] });
  return raw.map(mapCategory);
}

export async function cmsMenuItems(params?: {
  categorySlug?: string;
  isJain?: boolean;
  isVegan?: boolean;
  search?: string;
}): Promise<MenuItem[]> {
  const qs = new URLSearchParams();

  if (params?.isJain) qs.set("isJain", "true");
  else if (params?.isVegan) qs.set("isVegan", "true");
  if (params?.search) qs.set("search", params.search);

  const query = qs.toString() ? `?${qs.toString()}` : "";
  const raw = await apiFetch<NItem>(`/menu/items${query}`, { tags: ["menu:items"] });
  let items = raw.map(mapItem);

  if (params?.categorySlug && params.categorySlug !== "all") {
    items = items.filter((item) => item.category?.slug === params.categorySlug);
  }

  return items;
}

export async function cmsLocations(): Promise<Location[]> {
  const raw = await apiFetch<NLocation>("/locations", { tags: ["locations"] });
  return raw.map(mapLocation);
}

interface NTestimonial {
  id: string | number;
  name: string;
  role?: string;
  company?: string;
  rating?: number;
  text?: string;
  imageUrl?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export async function cmsTestimonials(routePath?: string | null): Promise<Testimonial[]> {
  const raw = await apiFetch<NTestimonial>("/cms/testimonials", {
    tags: ["content:testimonials"],
    routePath,
  });
  return raw.map((d) => ({
    id: String(d.id),
    name: d.name,
    role: d.role ?? "",
    company: d.company ?? "",
    rating: Number(d.rating ?? 5),
    text: d.text ?? "",
    isPublished: d.isPublished !== false,
    sortOrder: d.sortOrder ?? 0,
  }));
}

interface NFAQ {
  id: string | number;
  questionEn: string;
  questionHi?: string;
  answerEn?: string;
  category?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

export async function cmsFaqs(
  category?: string,
  routePath?: string | null,
): Promise<FAQ[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const raw = await apiFetch<NFAQ>(`/cms/faqs${query}`, {
    tags: ["content:faqs"],
    routePath,
  });
  return raw.map((d) => ({
    id: String(d.id),
    questionEn: d.questionEn,
    questionHi: d.questionHi,
    answerEn: d.answerEn ?? "",
    category: d.category ?? "General",
    sortOrder: d.sortOrder ?? 0,
    isPublished: d.isPublished !== false,
  }));
}

export async function cmsCareerOpenings(routePath?: string | null): Promise<CareerOpening[]> {
  return apiFetch<CareerOpening>("/cms/careers", {
    tags: ["content:careers"],
    routePath,
  });
}

export async function cmsBanners(_placement?: string) {
  throw new Error("Banners CMS endpoint is not implemented.");
}

export interface GalleryItem {
  id: string;
  title: string;
  titleHi?: string;
  image: string;
  category: string;
  type: string;
  isFeatured: boolean;
}

interface NGalleryItem {
  id: string | number;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
  videoUrl?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
}

export async function cmsGalleryItems(
  category?: string,
  routePath?: string | null,
): Promise<GalleryItem[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const raw = await apiFetch<NGalleryItem>(`/cms/gallery${query}`, {
    tags: ["content:gallery"],
    routePath,
  });
  return raw.map((d) => ({
    id: String(d.id),
    title: d.title,
    image: d.imageUrl ?? "",
    category: d.category,
    type: "photo",
    isFeatured: d.isFeatured ?? false,
  }));
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  author: string;
  publishedAt: string;
  tags: string[];
}

interface NBlogPost {
  id: string | number;
  slug: string;
  titleEn?: string;
  excerptEn?: string;
  contentEn?: string;
  author?: string;
  imageUrl?: string;
  tags?: string[];
  category?: string;
  isPublished?: boolean;
  publishedAt?: string;
}

export async function cmsBlogPosts(routePath?: string | null): Promise<BlogPost[]> {
  const raw = await apiFetch<NBlogPost>("/cms/blog?limit=20", {
    tags: ["content:blog"],
    routePath,
  });
  return raw.map((d) => ({
    id: String(d.id),
    slug: d.slug,
    title: d.titleEn ?? "",
    excerpt: d.excerptEn ?? "",
    content: d.contentEn ?? "",
    featuredImage: d.imageUrl ?? "",
    category: normalizeBlogCategoryId(d.category) || "general",
    author: d.author ?? "",
    publishedAt: d.publishedAt ?? "",
    tags: d.tags ?? [],
  }));
}

export async function cmsBlogPost(
  slug: string,
  routePath?: string | null,
): Promise<BlogPost | null> {
  const d = await apiFetchOne<NBlogPost>(`/cms/blog/${encodeURIComponent(slug)}`, {
    tags: ["content:blog", `content:blog:${slug}`],
    routePath,
  });
  if (!d) return null;
  return {
    id: String(d.id),
    slug: d.slug,
    title: d.titleEn ?? "",
    excerpt: d.excerptEn ?? "",
    content: d.contentEn ?? "",
    featuredImage: d.imageUrl ?? "",
    category: normalizeBlogCategoryId(d.category) || "general",
    author: d.author ?? "",
    publishedAt: d.publishedAt ?? "",
    tags: d.tags ?? [],
  };
}

export interface ServiceOffering {
  id: string;
  name: string;
  nameHi?: string;
  nameMr?: string;
  description: string;
  icon: string;
  image: string;
  title: string;
  features: string[];
  ctaText?: string;
  ctaLink?: string;
  colorTheme: string;
  sortOrder: number;
}

interface NServiceOffering {
  id: string | number;
  title?: string;
  description?: string;
  icon?: string;
  features?: string[];
  ctaText?: string;
  ctaLink?: string;
  colorTheme?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export async function cmsServiceOfferings(routePath?: string | null): Promise<ServiceOffering[]> {
  const raw = await apiFetch<NServiceOffering>("/cms/services", {
    tags: ["content:services"],
    routePath,
  });
  return raw.map((d) => ({
    id: String(d.id),
    name: d.title ?? "",
    title: d.title ?? "",
    description: d.description ?? "",
    icon: d.icon ?? "",
    image: "",
    features: d.features ?? [],
    ctaText: d.ctaText,
    ctaLink: d.ctaLink,
    colorTheme: d.colorTheme ?? "green",
    sortOrder: d.sortOrder ?? 0,
  }));
}

export interface ClientLogo {
  id: string;
  name: string;
  logoUrl: string;
  imageUrl?: string;
  websiteUrl: string;
  altText: string;
}

interface NClientLogo {
  id: string | number;
  name: string;
  imageUrl?: string;
  website?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export async function cmsClientLogos(routePath?: string | null): Promise<ClientLogo[]> {
  const raw = await apiFetch<NClientLogo>("/cms/client-logos", {
    tags: ["content:client-logos"],
    routePath,
  });
  return raw.map((d) => ({
    id: String(d.id),
    name: d.name,
    logoUrl: d.imageUrl ?? "",
    imageUrl: d.imageUrl ?? "",
    websiteUrl: d.website ?? "",
    altText: d.name,
  }));
}

export interface EventType {
  id: string;
  name: string;
  nameHi?: string;
  description: string;
  icon: string;
  image: string;
  minGuests?: number;
  maxGuests?: number;
  priceRange?: string;
}

interface NEventType {
  id: string | number;
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  minGuests?: number;
  maxGuests?: number;
  priceRange?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export async function cmsEventTypes(routePath?: string | null): Promise<EventType[]> {
  const raw = await apiFetch<NEventType>("/cms/event-types", {
    tags: ["content:event-types"],
    routePath,
  });
  return raw.map((d) => ({
    id: String(d.id),
    name: d.name,
    description: d.description ?? "",
    icon: d.icon ?? "",
    image: d.imageUrl ?? "",
    minGuests: d.minGuests,
    maxGuests: d.maxGuests,
    priceRange: d.priceRange,
  }));
}

export interface CuisineOption {
  id: string;
  name: string;
  nameHi?: string;
  description: string;
  image: string;
  counterCount: number;
  isLiveCounter?: boolean;
  pricePerPlate?: number;
}

interface NCuisineOption {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  pricePerPlate?: number;
  isLiveCounter?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export async function cmsCuisineOptions(routePath?: string | null): Promise<CuisineOption[]> {
  const raw = await apiFetch<NCuisineOption>("/cms/cuisines", {
    tags: ["content:cuisines"],
    routePath,
  });
  return raw.map((d) => ({
    id: String(d.id),
    name: d.name,
    description: d.description ?? "",
    image: d.imageUrl ?? "",
    counterCount: 0,
    isLiveCounter: d.isLiveCounter ?? false,
    pricePerPlate: d.pricePerPlate,
  }));
}

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  pricePerPlate: number;
  minPlates: number;
  maxPlates: number;
  features: string[];
  isPopular: boolean;
  tierType: string;
  price?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface NPricingTier {
  id: string | number;
  name: string;
  description?: string;
  price?: number;
  features?: string[];
  isPopular?: boolean;
  ctaText?: string;
  ctaLink?: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export async function cmsPricingTiers(
  tierType?: string,
  routePath?: string | null,
): Promise<PricingTier[]> {
  const query = tierType ? `?category=${encodeURIComponent(tierType)}` : "";
  const raw = await apiFetch<NPricingTier>(`/cms/pricing${query}`, {
    tags: ["content:pricing"],
    routePath,
  });
  return raw.map((d) => ({
    id: String(d.id),
    name: d.name,
    description: d.description ?? "",
    pricePerPlate: d.price ?? 0,
    minPlates: 0,
    maxPlates: 0,
    features: d.features ?? [],
    isPopular: d.isPopular ?? false,
    tierType: d.category ?? "event",
    price: d.price != null ? String(d.price) : undefined,
    ctaText: d.ctaText,
    ctaLink: d.ctaLink,
  }));
}
