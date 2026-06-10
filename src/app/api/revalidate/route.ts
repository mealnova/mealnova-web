import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "nodejs";

interface RevalidatePayload {
  tags?: string[];
  paths?: string[];
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function getSecret() {
  return process.env.WEB_REVALIDATE_SECRET?.trim() ?? null;
}

function isLocalHost(value: string | null) {
  if (!value) return false;

  try {
    const normalized = value.includes("://") ? new URL(value).hostname : value.split(":")[0];
    return LOCAL_HOSTS.has(normalized);
  } catch {
    return false;
  }
}

function isLocalRequest(request: NextRequest) {
  return (
    isLocalHost(request.headers.get("host")) ||
    isLocalHost(request.headers.get("origin")) ||
    isLocalHost(request.headers.get("referer")) ||
    isLocalHost(request.nextUrl.hostname)
  );
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  const expectedSecret = getSecret();

  if (!expectedSecret) {
    if (isLocalRequest(request)) {
      return handleRevalidation(request);
    }

    return NextResponse.json(
      { ok: false, error: "WEB_REVALIDATE_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return handleRevalidation(request);
}

async function handleRevalidation(request: NextRequest) {
  let payload: RevalidatePayload;
  try {
    payload = (await request.json()) as RevalidatePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const tags = Array.from(new Set((payload.tags ?? []).filter(Boolean)));
  const paths = Array.from(new Set((payload.paths ?? []).filter(Boolean)));

  for (const tag of tags) {
    revalidateTag(tag);
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ ok: true, tags, paths });
}
