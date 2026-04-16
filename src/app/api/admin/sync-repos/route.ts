import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { syncRepos } from "@/lib/sync/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNAUTHORIZED_BODY = { error: "unauthorized" } as const;
const SYNC_FAILED_BODY = { error: "sync failed" } as const;

/**
 * Constant-time comparison of the bearer token against CRON_SECRET.
 * Intentionally does NOT leak whether the header was missing vs wrong.
 */
function authorize(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Treat a missing server-side secret as auth failure. Do not crash
    // the route — the caller still gets a plain 401.
    console.error("POST /api/admin/sync-repos: CRON_SECRET not configured");
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const providedToken = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(providedToken, "utf8");

  if (expectedBuf.length !== providedBuf.length) {
    // timingSafeEqual requires equal-length inputs. Still do a dummy
    // compare of equal-length buffers to keep timing roughly uniform.
    const dummy = Buffer.alloc(expectedBuf.length);
    timingSafeEqual(expectedBuf, dummy);
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!authorize(request)) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const counters = await syncRepos();
    return NextResponse.json(counters, { status: 200 });
  } catch (err) {
    console.error("POST /api/admin/sync-repos: sync failed", err);
    return NextResponse.json(SYNC_FAILED_BODY, { status: 500 });
  }
}

// Explicitly reject other methods so we return 405 instead of Next's
// default 404-ish behaviour.
export function GET(): NextResponse {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}

export function PUT(): NextResponse {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}

export function PATCH(): NextResponse {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}

export function DELETE(): NextResponse {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
