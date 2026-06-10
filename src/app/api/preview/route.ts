import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getInternalApiBaseUrl } from "@/lib/api-origin";
import {
  CMS_PREVIEW_ROUTE_COOKIE,
  CMS_PREVIEW_TOKEN_COOKIE,
} from "@/lib/cms-preview";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Preview token is required",
      },
      { status: 400 },
    );
  }

  let resolved:
    | {
        data?: {
          routePath?: string;
          expiresAt?: string;
        };
      }
    | undefined;

  try {
    const response = await fetch(`${getInternalApiBaseUrl()}/cms-platform/preview-links/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;
      const message = Array.isArray(payload?.message)
        ? payload.message.join(", ")
        : payload?.message || "Preview token is invalid or expired";

      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: response.status },
      );
    }

    resolved = await response.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Preview service is unavailable",
      },
      { status: 502 },
    );
  }

  const routePath = resolved?.data?.routePath?.trim();
  if (!routePath) {
    return NextResponse.json(
      {
        success: false,
        message: "Preview route could not be resolved",
      },
      { status: 404 },
    );
  }

  const draft = await draftMode();
  draft.enable();

  const response = NextResponse.redirect(new URL(routePath, request.url));
  const expiresAt = resolved?.data?.expiresAt ? new Date(resolved.data.expiresAt) : undefined;

  response.cookies.set(CMS_PREVIEW_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : {}),
  });
  response.cookies.set(CMS_PREVIEW_ROUTE_COOKIE, routePath, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : {}),
  });

  return response;
}
