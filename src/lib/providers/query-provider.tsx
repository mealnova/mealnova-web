"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BrandSettings } from "@/lib/api";

export function QueryProvider({
  children,
  initialBrandSettings,
  initialStructuredPages,
  locale,
}: {
  children: React.ReactNode;
  initialBrandSettings?: BrandSettings;
  initialStructuredPages?: Record<string, unknown>;
  locale: string;
}) {
  const [queryClient] = useState(
    () => {
      const client = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
          },
        },
      });

      if (initialBrandSettings) {
        client.setQueryData(["content", "brand-settings"], initialBrandSettings);
      }

      if (initialStructuredPages) {
        for (const [slug, data] of Object.entries(initialStructuredPages)) {
          client.setQueryData(["content", "structured-page", slug, locale], data ?? null);
        }
      }

      return client;
    },
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
