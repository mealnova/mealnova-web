import { cookies } from "next/headers";
import { apiFetch, type BrandSettings, getBrandSettings, brandSettingsToCss } from "./api";
import { logCmsRuntimeIssue } from "./cms-runtime";

const VISITOR_COOKIE = "hc_visitor_id";

interface ThemeData {
  colorPrimary50: string;
  colorPrimary100: string;
  colorPrimary400: string;
  colorPrimary500: string;
  colorPrimary600: string;
  colorSecondary50: string;
  colorSecondary100: string;
  colorSecondary500: string;
  colorSecondary600: string;
  colorDarkPanelFrom: string;
  colorDarkPanelTo: string;
  colorFooterBg: string;
  colorSurface: string;
  colorSurfaceCard: string;
  colorTextPrimary: string;
  colorTextSecondary: string;
  colorTextMuted: string;
  fontDisplay: string;
  fontBody: string;
  borderRadiusSm?: string;
  borderRadiusMd?: string;
  borderRadiusLg?: string;
  borderRadiusXl?: string;
}

interface ThemeResolveResponse {
  theme: ThemeData;
  experimentId: string | null;
  variant: "control" | "variant" | null;
}

export interface ResolvedTheme {
  brandSettings: BrandSettings | null;
  themeCss: string;
  experimentId: string | null;
  variant: string | null;
  visitorId: string;
}

function mergeThemeIntoBrand(
  brand: BrandSettings,
  theme: Partial<ThemeData> | null | undefined,
): BrandSettings {
  if (!theme) return brand;

  return {
    ...brand,
    colorPrimary50: theme.colorPrimary50 ?? brand.colorPrimary50,
    colorPrimary100: theme.colorPrimary100 ?? brand.colorPrimary100,
    colorPrimary400: theme.colorPrimary400 ?? brand.colorPrimary400,
    colorPrimary500: theme.colorPrimary500 ?? brand.colorPrimary500,
    colorPrimary600: theme.colorPrimary600 ?? brand.colorPrimary600,
    colorSecondary50: theme.colorSecondary50 ?? brand.colorSecondary50,
    colorSecondary100: theme.colorSecondary100 ?? brand.colorSecondary100,
    colorSecondary500: theme.colorSecondary500 ?? brand.colorSecondary500,
    colorSecondary600: theme.colorSecondary600 ?? brand.colorSecondary600,
    colorDarkPanelFrom: theme.colorDarkPanelFrom ?? brand.colorDarkPanelFrom,
    colorDarkPanelTo: theme.colorDarkPanelTo ?? brand.colorDarkPanelTo,
    colorFooterBg: theme.colorFooterBg ?? brand.colorFooterBg,
    colorSurface: theme.colorSurface ?? brand.colorSurface,
    colorSurfaceCard: theme.colorSurfaceCard ?? brand.colorSurfaceCard,
    colorTextPrimary: theme.colorTextPrimary ?? brand.colorTextPrimary,
    colorTextSecondary: theme.colorTextSecondary ?? brand.colorTextSecondary,
    colorTextMuted: theme.colorTextMuted ?? brand.colorTextMuted,
    fontDisplay: theme.fontDisplay ?? brand.fontDisplay,
    fontBody: theme.fontBody ?? brand.fontBody,
  };
}

/**
 * Resolves which theme to apply for the current visitor.
 * Checks for running A/B experiments and assigns visitors to variants.
 * Falls back to BrandSettings if the themes API is unavailable.
 */
export async function resolveActiveTheme(): Promise<ResolvedTheme> {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get(VISITOR_COOKIE)?.value ?? "";
  let brand: BrandSettings | null = null;

  try {
    brand = await getBrandSettings();
  } catch (error) {
    logCmsRuntimeIssue("theme-resolver:brand", error);
  }

  if (!brand) {
    return {
      brandSettings: null,
      themeCss: "",
      experimentId: null,
      variant: null,
      visitorId,
    };
  }

  try {
    const res = await apiFetch<ThemeResolveResponse>(
      `/themes/resolve`,
      {
        cache: "no-store",
        params: visitorId ? { visitorId } : undefined,
      },
    );

    const brandCompat = mergeThemeIntoBrand(
      brand,
      (res.theme ?? {}) as Partial<ThemeData>,
    );

    return {
      brandSettings: brandCompat,
      themeCss: brandSettingsToCss(brandCompat),
      experimentId: res.experimentId,
      variant: res.variant,
      visitorId,
    };
  } catch (error) {
    logCmsRuntimeIssue("theme-resolver:resolve", error);
    return {
      brandSettings: brand,
      themeCss: brandSettingsToCss(brand),
      experimentId: null,
      variant: null,
      visitorId,
    };
  }
}
