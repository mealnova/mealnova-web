import { useQuery } from "@tanstack/react-query";
import { cmsLocations } from "@/lib/cms-api";
import { apiFetch, getLocation } from "@/lib/api";
import type { LocationsParams, Location, MenuItem, ApiResponse, PaginatedResponse } from "@/lib/api";

export function useLocations(_params?: LocationsParams) {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => cmsLocations(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocation(slug: string) {
  return useQuery({
    queryKey: ["locations", slug],
    queryFn: async () => {
      const locs = await cmsLocations();
      return locs.find((l) => l.slug === slug) ?? null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocationMenu(locationId: string) {
  return useQuery<MenuItem[]>({
    queryKey: ["locations", locationId, "menu"],
    queryFn: () =>
      apiFetch<ApiResponse<PaginatedResponse<MenuItem>>>(
        `/menu/items?locationId=${encodeURIComponent(locationId)}`
      ).then((res) => {
        const payload = res.data;
        return Array.isArray(payload) ? payload : payload?.data ?? [];
      }),
    enabled: !!locationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocationDetail(slug: string | null) {
  return useQuery<Location | null>({
    queryKey: ["location-detail", slug],
    queryFn: () => (slug ? getLocation(slug) : null),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
