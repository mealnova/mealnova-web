import { normalizeCmsPreviewRoutePath } from "@mealnova/shared";

export const CMS_PREVIEW_TOKEN_COOKIE = "mealnova_cms_preview_token";
export const CMS_PREVIEW_ROUTE_COOKIE = "mealnova_cms_preview_route";

export function normalizePreviewPath(path: string | null | undefined) {
  const trimmed = path?.trim();
  if (!trimmed) {
    return null;
  }

  return normalizeCmsPreviewRoutePath(trimmed);
}

export function routeFromReferer(referer: string | null | undefined) {
  if (!referer) {
    return null;
  }

  try {
    const url = new URL(referer);
    return normalizePreviewPath(url.pathname);
  } catch {
    return null;
  }
}

export function getClientPreviewRoutePath(routePath?: string | null) {
  if (typeof window === "undefined") {
    return normalizePreviewPath(routePath);
  }

  return normalizePreviewPath(routePath ?? window.location.pathname);
}

export async function getServerPreviewSession(expectedRoutePath?: string | null) {
  if (typeof window !== "undefined") {
    return null;
  }

  const [{ cookies, draftMode }] = await Promise.all([import("next/headers")]);
  const draft = await draftMode();
  if (!draft.isEnabled) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CMS_PREVIEW_TOKEN_COOKIE)?.value?.trim();
  const routePath = normalizePreviewPath(cookieStore.get(CMS_PREVIEW_ROUTE_COOKIE)?.value);

  if (!token || !routePath) {
    return null;
  }

  const expected = normalizePreviewPath(expectedRoutePath);
  if (expected && expected !== routePath) {
    return null;
  }

  return {
    token,
    routePath,
  };
}
