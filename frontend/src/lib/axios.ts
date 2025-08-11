import axios from "axios";
import { getSession } from "next-auth/react";

// const baseURL = "/api/proxy";
// Determine the base URL based on the environment (server-side or client-side).
const isServer = typeof window === "undefined";

// For server-side requests, we need a full URL. For client-side, we can use a relative path.
// If NEXTAUTH_URL is not set, we fall back to a default localhost URL for development.
// In production, you should ensure NEXTAUTH_URL is set correctly in your environment variables.
const baseURL = isServer
  ? `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/proxy`
  : "/api/proxy";

/**
 * A custom instance function that Orval will use as the mutator.
 * It takes the axios config and returns a promise.
 * @param config The axios request config
 */
export const customInstance = <T>(config: any): Promise<T> => {
  return axiosInstance(config).then((response) => {
    // Ensure we always return a value, even if response.data is undefined
    if (response.data === undefined) {
      return {} as T;
    }

    // The backend uses a standard response format: { code, message, data }.
    // We are primarily interested in the `data` payload.
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  });
};

/**
 * A globally configured Axios instance.
 * This instance is the single source of truth for all API requests.
 */
export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// =================================================================
// Request Interceptor
// =================================================================
// This interceptor attaches the JWT token to every outgoing request if a session exists.
axiosInstance.interceptors.request.use(
  async (config) => {
    // getSession() is client-side only. On the server, tokens are handled directly.
    if (!isServer) {
      const session = await getSession();
      if (session?.accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =================================================================
// Response Interceptor
// =================================================================
// The global axiosInstance interceptor is intentionally left empty.
// All response data transformation logic is handled by the customInstance
// to ensure consistency with the orval-generated API clients and to avoid
// potential conflicts from double-processing the response data.
// If global error handling is needed, it should be implemented here
// without modifying the response data structure.
axiosInstance.interceptors.response.use(
  (response) => {
    // Pass through the response as-is. Let customInstance handle data extraction.
    return response;
  },
  (error) => {
    // Here we can handle global errors, e.g., logging, showing a toast,
    // or redirecting on 401 Unauthorized.
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    } else if (error.request) {
      console.error("API Error Request:", error.request);
    } else {
      console.error("API Error Message:", error.message);
    }

    // We reject with the error response data if available, or the error itself.
    // This allows React Query's `onError` handlers to receive the actual error payload.
    return Promise.reject(error.response?.data || error);
  }
);
