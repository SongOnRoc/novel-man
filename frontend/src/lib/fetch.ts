import { getSession, signOut } from "next-auth/react";
import { toCamelCase, toSnakeCase } from "@/lib/utils";
import { isStrictProductionRuntime } from "@/lib/runtime-env";

// Determine the base URL based on the environment (server-side or client-side).
const isServer = typeof window === "undefined";

const isProduction = isStrictProductionRuntime();

function isLocalhostHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function getServerProxyBaseURL(): string {
  const rawNextAuthUrl = process.env.NEXTAUTH_URL;

  if (typeof rawNextAuthUrl === "string" && rawNextAuthUrl.trim() !== "") {
    let parsed: URL;
    try {
      parsed = new URL(rawNextAuthUrl);
    } catch (error) {
      const message = `[auth] Invalid NEXTAUTH_URL: "${rawNextAuthUrl}"`;
      if (isProduction) {
        console.error(message, error);
        throw new Error(message);
      }
      console.warn(message, error);
      return "http://localhost:3000/api/proxy";
    }

    if (isProduction && isLocalhostHostname(parsed.hostname)) {
      const message = `[auth] Refusing NEXTAUTH_URL pointing to localhost in production: "${rawNextAuthUrl}"`;
      console.error(message);
      throw new Error(message);
    }

    return `${parsed.origin}/api/proxy`;
  }

  if (isProduction) {
    const message =
      "[auth] Missing NEXTAUTH_URL in production; server-side requests cannot safely determine origin.";
    console.error(message);
    throw new Error(message);
  }

  return "http://localhost:3000/api/proxy";
}

// For server-side requests, we need a full URL. For client-side, we can use a relative path.
// Production must NOT silently fall back to localhost.
function getBaseURL(): string {
  return isServer ? getServerProxyBaseURL() : "/api/proxy";
}

/**
 * A custom fetch wrapper that Orval will use as the mutator.
 * It handles authentication, data transformation, and error handling.
 */
export const customFetch = async <T>(
  config: {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
    signal?: AbortSignal;
  },
  options?: {
    onData?: (data: any) => void;
    headers?: Record<string, string>;
  }
): Promise<T> => {
  const { url, method = "GET", headers = {}, params, data, signal } = config;
  const { onData, headers: optionHeaders } = options || {};
  const baseURL = getBaseURL();

  if (optionHeaders) {
    Object.assign(headers, optionHeaders);
  }

  // 1. Authentication
  // getSession() is client-side only. On the server, tokens are handled directly.
  if (!isServer) {
    const session = await getSession();
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
  }

  // 2. Data Transformation (Request)
  // Transform request params and data to snake_case
  let requestBody = data;
  let contentType = headers["Content-Type"] || "application/json";

  if (data && !(data instanceof FormData)) {
    requestBody = JSON.stringify(toSnakeCase(data));
    headers["Content-Type"] = contentType;
  } else if (data instanceof FormData) {
    // Let the browser set Content-Type for FormData (multipart/form-data)
    delete headers["Content-Type"];
    requestBody = data;
  }

  // Handle query parameters
  let fullUrl = `${baseURL}${url}`;
  if (params) {
    const searchParams = new URLSearchParams();
    const snakeCaseParams = toSnakeCase(params);
    Object.entries(snakeCaseParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  // 3. Send Request
  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: requestBody,
      signal,
    });

    // 4. Error Handling
    if (!response.ok) {
      // Browser-side 401 handling: sign out and redirect to login
      if (!isServer && response.status === 401) {
        try {
          await signOut({ redirect: true, callbackUrl: "/login" });
        } catch {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }

      // Prefer preserving error body; avoid swallowing non-2xx JSON.
      let errorData: any;
      try {
        const rawText = await response.text();
        if (rawText) {
          try {
            errorData = JSON.parse(rawText);
          } catch {
            errorData = { message: rawText };
          }
        } else {
          errorData = { message: response.statusText };
        }
      } catch {
        errorData = { message: response.statusText };
      }

      // Ensure the frontend can always branch on HTTP status.
      if (
        errorData &&
        typeof errorData === "object" &&
        !("code" in errorData)
      ) {
        errorData.code = response.status;
      }

      // 4xx (e.g. 409) is an expected business branch in some flows;
      // only log as error for 5xx.
      if (response.status >= 500) {
        console.error(`API Error ${response.status} on ${fullUrl}`, errorData);
      } else {
        console.warn(`API Warning ${response.status} on ${fullUrl}`, errorData);
      }

      throw errorData;
    }

    // 5. Data Transformation (Response)
    // For 204 No Content, return empty object
    if (response.status === 204) {
      return {} as T;
    }

    // Handle Streaming Response
    if (onData && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          // 检查是否已取消
          if (signal?.aborted) {
            onData({ done: true, aborted: true });
            break;
          }

          const { done, value } = await reader.read();

          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            buffer += chunk;
          }

          const lines = buffer.split("\n");

          // If not done, keep the last line in buffer as it might be incomplete
          // If done, process all lines including the last one
          if (!done) {
            buffer = lines.pop() || "";
          } else {
            buffer = "";
          }

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

            const jsonStr = trimmedLine.slice(6);
            if (jsonStr === "[DONE]") {
              onData({ done: true });
              return {} as T;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              // Transform stream data to camelCase if needed, or pass raw
              // Typically stream chunks are simple objects
              // console.log('SSE Parsed:', parsed);
              onData(toCamelCase(parsed));
            } catch (e) {
              console.warn("Failed to parse SSE message:", trimmedLine, e);
            }
          }

          if (done) {
            // 流自然结束时也发送 done 信号
            onData({ done: true });
            break;
          }
        }
      } catch (e: any) {
        // 处理 abort 错误，发送 done 信号
        if (e.name === "AbortError") {
          onData({ done: true, aborted: true });
        } else {
          throw e;
        }
      } finally {
        reader.releaseLock();
      }
      return {} as T; // Return empty for stream completion
    }

    const responseData = await response.json();
    const transformedData = toCamelCase(responseData);

    // 6. Extract 'data' field (consistent with axios interceptor logic)
    if (
      transformedData &&
      typeof transformedData === "object" &&
      "data" in transformedData
    ) {
      return transformedData.data as T;
    }

    return transformedData as T;
  } catch (error: any) {
    if (error.name === "AbortError") {
      // Ignore abort errors or rethrow a specific error if needed
      throw error;
    }
    throw error;
  }
};

export default customFetch;
