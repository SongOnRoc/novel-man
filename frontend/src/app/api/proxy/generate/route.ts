import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const COOKIE_API_KEY = "novel_man_ai_api_key";
const COOKIE_BASE_URL = "novel_man_ai_base_url";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const storedApiKey = cookieStore.get(COOKIE_API_KEY)?.value;
  const storedBaseUrl = cookieStore.get(COOKIE_BASE_URL)?.value;

  const backendApiUrl =
    process.env.BACKEND_API_URL || "http://localhost:8080/api/v1";
  const url = `${backendApiUrl}/generate`;

  const session = await getServerSession(authOptions);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  try {
    const body = await req.json();

    // Inject sensitive configuration from cookies
    if (storedApiKey) {
      body.api_key = storedApiKey;
    }
    if (storedBaseUrl) {
      body.base_url = storedBaseUrl;
    }

    const fetchOptions: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };

    const response = await fetch(url, fetchOptions);

    // Handle Server-Sent Events (SSE)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/event-stream")) {
      const sseHeaders = new Headers();
      sseHeaders.set("Content-Type", "text/event-stream");
      sseHeaders.set("Cache-Control", "no-cache");
      sseHeaders.set("Connection", "keep-alive");

      return new NextResponse(response.body, {
        status: response.status,
        headers: sseHeaders,
      });
    }

    // Handle normal JSON response
    const responseData = await response.json().catch(() => ({}));
    return NextResponse.json(responseData, {
      status: response.status,
    });
  } catch (error) {
    console.error("Proxy Error (Generate):", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}