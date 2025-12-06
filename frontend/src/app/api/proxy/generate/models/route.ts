import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const COOKIE_API_KEY = "novel_man_ai_api_key";
const COOKIE_BASE_URL = "novel_man_ai_base_url";

export async function GET(req: NextRequest) {
  const apiKeyHeader = req.headers.get("X-API-Key");
  const baseUrlHeader = req.headers.get("X-Base-URL");
  const cookieStore = await cookies();

  // Scenario 1: Saving settings (Key provided in headers)
  // When apiKey or baseUrl is provided in headers, we treat this as a "Save" operation.
  // We save the values to HTTP-only cookies and DO NOT call the backend.
  if (apiKeyHeader !== null || baseUrlHeader !== null) {
    if (apiKeyHeader) {
      cookieStore.set(COOKIE_API_KEY, apiKeyHeader, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    } else if (apiKeyHeader === "") {
        // If empty string provided, delete cookie
        cookieStore.delete(COOKIE_API_KEY);
    }

    if (baseUrlHeader) {
      cookieStore.set(COOKIE_BASE_URL, baseUrlHeader, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    } else if (baseUrlHeader === "") {
        cookieStore.delete(COOKIE_BASE_URL);
    }
    
    // Return empty list as we are not calling the backend
    return NextResponse.json({ data: [] });
  }

  // Scenario 2: Fetching models (No key in headers)
  // We read from cookies and proxy the request to the backend.
  const storedApiKey = cookieStore.get(COOKIE_API_KEY)?.value;
  const storedBaseUrl = cookieStore.get(COOKIE_BASE_URL)?.value;

  const backendApiUrl = process.env.BACKEND_API_URL || "http://localhost:8080/api/v1";
  const url = `${backendApiUrl}/generate/models`;
  
  const backendParams = new URLSearchParams();
  if (storedApiKey) backendParams.append("api_key", storedApiKey);
  if (storedBaseUrl) backendParams.append("base_url", storedBaseUrl);

  const session = await getServerSession(authOptions);
  const headers: HeadersInit = {};
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  try {
    const res = await fetch(`${url}?${backendParams.toString()}`, {
      headers,
      cache: "no-store"
    });
    
    if (!res.ok) {
       console.error(`Failed to fetch models from backend: ${res.status}`);
       // Return empty list on error to avoid breaking frontend
       return NextResponse.json({ data: [] });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying model request:", error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
