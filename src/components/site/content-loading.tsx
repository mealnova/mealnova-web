"use client";

import { Loader2 } from "lucide-react";

export function ContentLoading() {
  return (
    <div className="container-max page-section">
      <div className="site-panel p-6 lg:p-8">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div className="mt-6 space-y-4">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-10 w-3/4 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-28 w-full rounded-[var(--radius-xl)]" />
        </div>
      </div>
    </div>
  );
}
