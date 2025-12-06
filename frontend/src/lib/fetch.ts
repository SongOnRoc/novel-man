import { getSession, signOut } from "next-auth/react";
import { toCamelCase, toSnakeCase } from "@/lib/utils";

// Determine the base URL based on the environment (server-side or client-side).
const isServer = typeof window === "undefined";

// For server-side requests, we need a full URL. For client-side, we can use a relative path.
// If NEXTAUTH_URL is not set, we fall back to a default localhost URL for development.
const baseURL = isServer
  ? `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/proxy`
  : "/api/proxy";

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

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      // Log error
      console.error(`API Error ${response.status} on ${fullUrl}`, errorData);
      
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
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

            const jsonStr = trimmedLine.slice(6);
            if (jsonStr === '[DONE]') {
              return {} as T;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              // Transform stream data to camelCase if needed, or pass raw
              // Typically stream chunks are simple objects
              // console.log('SSE Parsed:', parsed);
              onData(toCamelCase(parsed));
            } catch (e) {
              console.warn('Failed to parse SSE message:', trimmedLine, e);
            }
          }
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
    if (error.name === 'AbortError') {
       // Ignore abort errors or rethrow a specific error if needed
       throw error; 
    }
    throw error;
  }
};

export default customFetch;