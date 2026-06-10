import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  CMS_PREVIEW_ROUTE_COOKIE,
  CMS_PREVIEW_TOKEN_COOKIE,
} from "@/lib/cms-preview";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const draft = await draftMode();
  draft.disable();

  const redirectTo = request.headers.get("referer") || "/en";
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  response.cookies.set(CMS_PREVIEW_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(CMS_PREVIEW_ROUTE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
