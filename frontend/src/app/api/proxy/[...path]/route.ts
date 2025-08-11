import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

const API_BASE_URL =
  process.env.BACKEND_API_URL || "http://localhost:8080/api/v1";

async function handler(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const path = pathname.replace("/api/proxy", "");
  const url = `${API_BASE_URL}${path}${search}`;

  const headers: Record<string, string> = {};
  const authorization = req.headers.get("Authorization");
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
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(response.data, { status: response.status });
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
      return NextResponse.json(responseData, { status });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
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
