import type { BrandSettings } from "@/lib/api";
import snapshot from "@/content/snapshot.json";

/**
 * Last-resort BrandSettings used only when both the live API and the
 * committed content snapshot are unavailable. Values mirror the approved
 * design tokens so the site renders on-brand, never unstyled.
 */
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  id: "global",
  siteName: "Mealnova",
  tagline: "Operational catering for modern teams and events",
  phone: "",
  email: "",
  address: "",
  fssaiNumber: "",
  gstin: "",
  bankName: "",
  bankAccount: "",
  bankIfsc: "",
  bankUpi: "",
  colorPrimary500: "#245945",
  colorPrimary600: "#1d4838",
  colorPrimary400: "#2f7257",
  colorPrimary100: "#d7e5de",
  colorPrimary50: "#eef4f1",
  colorSecondary500: "#ad6f3e",
  colorSecondary600: "#8f5a31",
  colorSecondary100: "#ecdccd",
  colorSecondary50: "#f7efe7",
  colorDarkPanelFrom: "#1e6f4e",
  colorDarkPanelTo: "#259963",
  colorFooterBg: "#1a3d2b",
  colorSurface: "#f4f0e9",
  colorSurfaceCard: "#fffdf8",
  colorTextPrimary: "#101819",
  colorTextSecondary: "#475359",
  colorTextMuted: "#6b7a80",
  fontDisplay: "Instrument Serif",
  fontBody: "Manrope",
  updatedAt: new Date(0).toISOString(),
};

export function getFallbackBrandSettings(): BrandSettings {
  const snap = (snapshot as { brandSettings?: BrandSettings | null }).brandSettings;
  return snap ?? DEFAULT_BRAND_SETTINGS;
}
