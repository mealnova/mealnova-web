import { NextRequest, NextResponse } from "next/server";
import {
  buildUpstreamRequestSignal,
  getInternalApiBaseUrl,
} from "@/lib/api-origin";
import {
  CMS_PREVIEW_ROUTE_COOKIE,
  CMS_PREVIEW_TOKEN_COOKIE,
  normalizePreviewPath,
  routeFromReferer,
} from "@/lib/cms-preview";

export const runtime = "nodejs";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "transfer-encoding",
]);

function backendUnavailableResponse() {
  return NextResponse.json(
    {
      success: false,
      statusCode: 503,
      error: "Service Unavailable",
      message: "Public API is temporarily unavailable. Please try again.",
    },
    { status: 503 },
  );
}

async function proxy(request: NextRequest, path: string[]) {
  const apiBaseUrl = getInternalApiBaseUrl();
  const url = new URL(`${apiBaseUrl}/${path.map(encodeURIComponent).join("/")}`);
  url.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const previewToken = request.cookies.get(CMS_PREVIEW_TOKEN_COOKIE)?.value?.trim();
  const previewRouteCookie = normalizePreviewPath(
    request.cookies.get(CMS_PREVIEW_ROUTE_COOKIE)?.value,
  );
  const requestPreviewRoute =
    normalizePreviewPath(headers.get("x-cms-preview-route")) ||
    routeFromReferer(request.headers.get("referer"));

  headers.delete("x-cms-preview-token");
  headers.delete("x-cms-preview-route");

  if (previewToken && previewRouteCookie && requestPreviewRoute === previewRouteCookie) {
    headers.set("x-cms-preview-token", previewToken);
    headers.set("x-cms-preview-route", previewRouteCookie);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      ...init,
      signal: buildUpstreamRequestSignal(request.signal),
    });
  } catch {
    return backendUnavailableResponse();
  }

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const responseHeaders = new Headers();
  for (const [key, value] of upstream.headers.entries()) {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === "set-cookie") {
      continue;
    }
    responseHeaders.append(key, value);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, (await params).path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, (await params).path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, (await params).path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, (await params).path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, (await params).path);
}
