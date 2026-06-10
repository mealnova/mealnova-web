import { useQuery } from "@tanstack/react-query";
import { cmsMenuCategories, cmsMenuItems } from "@/lib/cms-api";
import {
  apiFetch,
  getMenuCategories as getMenuCategoriesRequest,
  getMenuItems as getMenuItemsRequest,
} from "@/lib/api";
import type { MenuItemsParams, TodaysMenuResponse, WeeklyMenu, ApiResponse } from "@/lib/api";

export function useMenuCategories() {
  return useQuery({
    queryKey: ["menu", "categories"],
    queryFn: () => cmsMenuCategories(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useMenuItems(params?: MenuItemsParams) {
  return useQuery({
    queryKey: ["menu", "items", params],
    queryFn: () =>
      cmsMenuItems({
        isJain: params?.isJain,
        isVegan: params?.isVegan,
        search: params?.search,
      }).then((data) => ({ data, total: data.length, page: 1, pageSize: data.length, totalPages: 1 })),
    staleTime: 5 * 60 * 1000,
  });
}

// Transactional flows should use strict API hooks that surface real loading
// and error states instead of silently falling back to empty arrays.
export function useLiveMenuCategories() {
  return useQuery({
    queryKey: ["menu", "live-categories"],
    queryFn: () => getMenuCategoriesRequest().then((res) => res.data),
    staleTime: 60 * 1000,
  });
}

export function useLiveMenuItems(params?: MenuItemsParams) {
  return useQuery({
    queryKey: ["menu", "live-items", params],
    queryFn: () => getMenuItemsRequest(params).then((res) => res.data),
    staleTime: 60 * 1000,
  });
}

export function useMenuItem(slug: string) {
  return useQuery({
    queryKey: ["menu", "item", slug],
    queryFn: async () => {
      const items = await cmsMenuItems();
      return items.find((i) => i.slug === slug) ?? null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Today's menu now requires a location-specific context.
export function useTodaysMenu(locationId?: string) {
  return useQuery<TodaysMenuResponse | null>({
    queryKey: ["menu", "today", locationId],
    queryFn: () => {
      if (!locationId) {
        throw new Error("locationId is required to fetch today's menu");
      }

      return apiFetch<ApiResponse<TodaysMenuResponse | null>>("/menu/today", {
        params: { locationId },
      }).then((res) => res.data ?? null);
    },
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(locationId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useWeeklyMenu(weekStart: string) {
  return useQuery<WeeklyMenu | null>({
    queryKey: ["menu", "weekly", weekStart],
    queryFn: () =>
      apiFetch<ApiResponse<WeeklyMenu>>(
        `/menu/weekly?weekStart=${encodeURIComponent(weekStart)}`
      ).then((res) => res.data ?? null),
    enabled: !!weekStart,
    staleTime: 5 * 60 * 1000,
  });
}
