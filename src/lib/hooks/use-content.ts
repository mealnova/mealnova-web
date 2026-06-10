import { useQuery } from "@tanstack/react-query";
import {
  getBrandSettings,
  getPageBySlug,
} from "@/lib/api";
import type {
  GalleryItem,
  BlogPost,
  ClientLogo,
  ServiceOffering,
  EventType,
  CuisineOption,
  PricingTier,
} from "@/lib/cms-api";
import {
  cmsBlogPost,
  cmsBlogPosts,
  cmsClientLogos,
  cmsCareerOpenings,
  cmsCuisineOptions,
  cmsEventTypes,
  cmsFaqs,
  cmsGalleryItems,
  cmsPricingTiers,
  cmsServiceOfferings,
  cmsTestimonials,
} from "@/lib/cms-api";
import type {
  FAQ,
  Testimonial,
  CareerOpening,
  FAQsParams,
  BrandSettings,
  ContentPage,
} from "@/lib/api";

export function useBrandSettings() {
  return useQuery<BrandSettings>({
    queryKey: ["content", "brand-settings"],
    queryFn: () => getBrandSettings(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useFaqs(params?: FAQsParams) {
  return useQuery<FAQ[]>({
    queryKey: ["content", "faqs", params?.category],
    queryFn: () => cmsFaqs(params?.category),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTestimonials(initialData?: Testimonial[]) {
  return useQuery<Testimonial[]>({
    queryKey: ["content", "testimonials"],
    queryFn: () => cmsTestimonials(),
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCareerOpenings() {
  return useQuery<CareerOpening[]>({
    queryKey: ["content", "careers"],
    queryFn: () => cmsCareerOpenings(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGalleryItems(category?: string, initialData?: GalleryItem[]) {
  return useQuery<GalleryItem[]>({
    queryKey: ["content", "gallery", category],
    queryFn: () => cmsGalleryItems(category),
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlogPosts() {
  return useQuery<BlogPost[]>({
    queryKey: ["content", "blog"],
    queryFn: () => cmsBlogPosts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlogPost(slug: string) {
  return useQuery<BlogPost | null>({
    queryKey: ["content", "blog", "post", slug],
    queryFn: () => cmsBlogPost(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientLogos(initialData?: ClientLogo[]) {
  return useQuery<ClientLogo[]>({
    queryKey: ["content", "clients"],
    queryFn: () => cmsClientLogos(),
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useServiceOfferings(initialData?: ServiceOffering[]) {
  return useQuery<ServiceOffering[]>({
    queryKey: ["content", "services"],
    queryFn: () => cmsServiceOfferings(),
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEventTypes() {
  return useQuery<EventType[]>({
    queryKey: ["content", "event-types"],
    queryFn: () => cmsEventTypes(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCuisineOptions() {
  return useQuery<CuisineOption[]>({
    queryKey: ["content", "cuisines"],
    queryFn: () => cmsCuisineOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePricingTiers(tierType?: string) {
  return useQuery<PricingTier[]>({
    queryKey: ["content", "pricing", tierType],
    queryFn: () => cmsPricingTiers(tierType),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePage(slug: string) {
  return useQuery<ContentPage | null>({
    queryKey: ["content", "page", slug],
    queryFn: () => getPageBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
