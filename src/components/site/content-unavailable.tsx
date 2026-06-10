"use client";

import Link from "next/link";
import { Button, type ButtonProps } from "@/components/ui/button";
import { InfoCard } from "@/components/site/page-primitives";
import { mapCmsActionVariant, type CmsAction, type CmsUnavailableContent } from "@/lib/page-content";

const DEFAULT_UNAVAILABLE_CONTENT: CmsUnavailableContent = {
  eyebrow: "CMS unavailable",
  title: "Content is temporarily unavailable.",
  description:
    "We could not load the latest CMS content for this page right now. Please try again shortly.",
  primaryAction: {
    href: "/corporate",
    label: "Start onboarding",
    variant: "outline",
  },
  secondaryAction: {
    href: "/menu",
    label: "Browse menu",
    variant: "ghost",
  },
};

function ActionButton({
  action,
  defaultVariant = "outline",
}: {
  action: CmsAction;
  defaultVariant?: ButtonProps["variant"];
}) {
  return (
    <Button variant={mapCmsActionVariant(action.variant) ?? defaultVariant} asChild>
      <Link href={action.href}>{action.label}</Link>
    </Button>
  );
}

export function ContentUnavailable({
  content,
}: {
  content?: CmsUnavailableContent | null;
}) {
  const resolved = content ?? DEFAULT_UNAVAILABLE_CONTENT;

  return (
    <div className="container-max page-section">
      <InfoCard
        eyebrow={resolved.eyebrow}
        title={resolved.title}
        description={resolved.description}
      >
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {resolved.primaryAction ? <ActionButton action={resolved.primaryAction} /> : null}
          {resolved.secondaryAction ? (
            <ActionButton action={resolved.secondaryAction} defaultVariant="outline" />
          ) : null}
        </div>
      </InfoCard>
    </div>
  );
}
