import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const API_BASE_URL =
  process.env.BACKEND_API_URL || "http://localhost:8080/api/v1";

// Rate limit (in-memory fallback)
const RATE_LIMIT_MAX = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || "100",
  10
);
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "60000",
  10
);

type RateEntry = { count: number; reset: number };
const rateMap = new Map<string, RateEntry>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const realIp = req.headers.get("x-real-ip");
  return realIp || "unknown";
}

function rateLimitHeaders(
  remaining: number,
  reset: number
): Record<string, string> {
  const retryAfterSec = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "Retry-After": String(retryAfterSec),
  };
}

async function checkRateLimit(
  identifier: string
): Promise<
  | { allowed: true; remaining: number; reset: number }
  | { allowed: false; remaining: number; reset: number }
> {
  const now = Date.now();
  const entry = rateMap.get(identifier);
  if (!entry || now > entry.reset) {
    const newEntry = { count: 1, reset: now + RATE_LIMIT_WINDOW_MS };
    rateMap.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      reset: newEntry.reset,
    };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, reset: entry.reset };
  }
  rateMap.set(identifier, entry);
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    reset: entry.reset,
  };
}

// File upload security validation
async function validateFileUpload(
  formData: FormData
): Promise<{ valid: true } | { valid: false; res: NextResponse }> {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    "application/json",
    "text/plain",
    "text/markdown",
    "application/zip",
    "application/x-zip-compressed",
  ];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // Check file size
      if (value.size > MAX_FILE_SIZE) {
        console.error(`File too large: ${value.name} (${value.size} bytes)`);
        return {
          valid: false,
          res: NextResponse.json(
            {
              message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            },
            { status: 413 }
          ),
        };
      }

      // Check file type
      const fileExtension = value.name.split(".").pop()?.toLowerCase();
      const isValidType =
        ALLOWED_TYPES.includes(value.type) ||
        (fileExtension && ["json", "txt", "md", "zip"].includes(fileExtension));

      if (!isValidType) {
        console.error(`Unsupported file type: ${value.type} (${value.name})`);
        return {
          valid: false,
          res: NextResponse.json(
            { message: `Unsupported file type: ${value.type}` },
            { status: 415 }
          ),
        };
      }
    }
  }

  return { valid: true };
}

// Public path whitelist (prefix match)
const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/health"];

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
  // This is important for multipart/form-data to include boundary
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
  const authCheck = await ensureAuthorized(
    req,
    path,
    authorization || undefined
  );
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

    const contentType = req.headers.get("content-type") || "";

    // Handle FormData (multipart/form-data) - needed for file uploads
    if (contentType.includes("multipart/form-data")) {
      try {
        const formData = await req.formData();

        // Validate file uploads for security
        const validation = await validateFileUpload(formData);
        if (!validation.valid) {
          throw new Error(`File validation failed: ${validation.res}`);
        }

        return formData;
      } catch (error) {
        console.error(
          "Failed to parse or validate request body as FormData",
          error
        );
        // If it's a validation error, return the response directly
        if (
          error instanceof Error &&
          error.message.includes("File validation failed")
        ) {
          const validationError = error as any;
          return validationError.res;
        }
        return undefined;
      }
    }

    // Handle JSON
    if (contentType.includes("application/json")) {
      try {
        return await req.json();
      } catch (error) {
        console.error("Failed to parse request body as JSON", error);
        return undefined;
      }
    }

    // For other content types, try JSON as fallback
    try {
      return await req.json();
    } catch (error) {
      console.error("Failed to parse request body", error);
      return undefined;
    }
  };

  try {
    const body = await getBody();

    // For FormData requests, we need special handling
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: headers,
    };

    // Handle FormData properly
    if (body instanceof FormData) {
      // For FormData, we need to let fetch handle the Content-Type
      delete headers["Content-Type"];
      fetchOptions.body = body;
    } else if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (response.status === 204) {
      return new NextResponse(null, { status: 204, headers: baseHeaders });
    }

    // Handle Server-Sent Events (SSE)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/event-stream")) {
      // Merge baseHeaders with response headers for SSE
      const sseHeaders = new Headers(baseHeaders);
      sseHeaders.set("Content-Type", "text/event-stream");
      sseHeaders.set("Cache-Control", "no-cache");
      sseHeaders.set("Connection", "keep-alive");

      return new NextResponse(response.body, {
        status: response.status,
        headers: sseHeaders,
      });
    }

    // Pass through upstream response body for non-stream requests as well.
    // This avoids losing non-2xx JSON bodies (e.g. 409 conflict payload).
    const passthroughHeaders = new Headers(baseHeaders);
    if (contentType) {
      passthroughHeaders.set("Content-Type", contentType);
    } else {
      passthroughHeaders.set("Content-Type", "application/json");
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: passthroughHeaders,
    });
  } catch (error) {
    console.error("Proxy Error:", error);
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
