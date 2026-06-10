import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/api";
import { buildRouteMetadata } from "@/lib/site-metadata";
import { CheckoutPage } from "./checkout-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const brand = await getBrandSettings().catch(() => null);

  return buildRouteMetadata({
    locale,
    routePath: `/${locale}/order`,
    siteName: brand?.siteName,
    title: "Approved client ordering",
    description: "Online ordering is available only for approved Mealnova clients.",
    noIndex: true,
  });
}

export default function OrderPage() {
  return <CheckoutPage />;
}
