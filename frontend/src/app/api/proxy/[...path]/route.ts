import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const API_BASE_URL =
  process.env.BACKEND_API_URL || "http://localhost:8080/api/v1";

// Rate limit (in-memory fallback)
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);

type RateEntry = { count: number; reset: number };
const rateMap = new Map<string, RateEntry>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const realIp = req.headers.get("x-real-ip");
  return realIp || "unknown";
}

function rateLimitHeaders(remaining: number, reset: number): Record<string, string> {
  const retryAfterSec = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "Retry-After": String(retryAfterSec),
  };
}

async function checkRateLimit(identifier: string): Promise<{ allowed: true; remaining: number; reset: number } | { allowed: false; remaining: number; reset: number }> {
  const now = Date.now();
  const entry = rateMap.get(identifier);
  if (!entry || now > entry.reset) {
    const newEntry = { count: 1, reset: now + RATE_LIMIT_WINDOW_MS };
    rateMap.set(identifier, newEntry);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, reset: newEntry.reset };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, reset: entry.reset };
  }
  rateMap.set(identifier, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, reset: entry.reset };
}

// Public path whitelist (prefix match)
const PUBLIC_PATHS = ["/auth/login", "/auth/register"];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path.startsWith(p));
}

async function ensureAuthorized(
  req: NextRequest,
  path: string,
  authorizationHeader?: string
): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  // 1) Public endpoints pass through
  if (isPublicPath(path)) return { ok: true };

  // 2) Bearer token present -> let backend validate
  const hasBearer =
    typeof authorizationHeader === "string" &&
    authorizationHeader.toLowerCase().startsWith("bearer ");
  if (hasBearer) return { ok: true };

  // 3) Otherwise require a valid NextAuth session
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      ok: false,
      res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true };
}

async function handler(req: NextRequest) {
  // Basic rate limiting (in-memory fallback)
  const identifier = getClientIp(req);
  const rl = await checkRateLimit(identifier);
  if (!rl.allowed) {
    return NextResponse.json(
      { message: "Too Many Requests" },
      { status: 429, headers: rateLimitHeaders(0, rl.reset) }
    );
  }
  const baseHeaders = rateLimitHeaders(rl.remaining, rl.reset);

  const { pathname, search } = req.nextUrl;
  const path = pathname.replace("/api/proxy", "");
  const url = `${API_BASE_URL}${path}${search}`;

  const session = await getServerSession(authOptions);
  const headers: Record<string, string> = {};
  let authorization = req.headers.get("Authorization");

  if (!authorization && session?.accessToken) {
    authorization = `Bearer ${session.accessToken}`;
  }

  if (authorization) {
    headers["Authorization"] = authorization;
  }
  // Forward content-type header if it exists
  const contentType = req.headers.get("Content-Type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  // Forward cookie header if it exists (SSR/Edge compatibility)
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers["Cookie"] = cookie;
  }

  // Authorization enforcement via helper function
  const authCheck = await ensureAuthorized(req, path, authorization || undefined);
  if (!authCheck.ok) {
    // add rate limit headers on auth failures as well
    const res = authCheck.res;
    res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
    res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return res;
  }

  const getBody = async () => {
    // Methods like GET, HEAD, DELETE, OPTIONS should not have a body.
    if (["GET", "HEAD", "DELETE", "OPTIONS"].includes(req.method)) {
      return undefined;
    }

    // If content-length is not present or 0, there's no body to parse.
    const contentLength = req.headers.get("content-length");
    if (!contentLength || contentLength === "0") {
      return undefined;
    }

    try {
      return await req.json();
    } catch (error) {
      // If parsing fails, it might be form-data or other types,
      // for this proxy we assume it's an error for now.
      console.error("Failed to parse request body as JSON", error);
      // Return a specific error or undefined to let axios handle it.
      return undefined;
    }
  };

  try {
    const body = await getBody();

    const response = await axios({
      method: req.method,
      url: url,
      data: body,
      headers: headers,
      responseType: "json",
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204, headers: baseHeaders });
    }
    return NextResponse.json(response.data, { status: response.status, headers: baseHeaders });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      // Ensure we send a proper JSON response even if the upstream service doesn't.
      const status = axiosError.response?.status || 500;
      const data = axiosError.response?.data || {
        message: "An error occurred",
      };
      // If data is not a valid JSON object, create one.
      const responseData =
        typeof data === "object" ? data : { message: String(data) };
      return NextResponse.json(responseData, { status, headers: baseHeaders });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: baseHeaders }
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
  handler as OPTIONS,
};
