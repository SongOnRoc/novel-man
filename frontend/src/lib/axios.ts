import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { toCamelCase, toSnakeCase } from "@/lib/utils";


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
export const customInstance = <T>(
  config: any,
  headers?: any
): Promise<T> => {
  const controller = new AbortController();
  const promise = axiosInstance({
    ...config,
    headers: {
      ...config.headers,
      ...headers,
    },
    signal: controller.signal,
  }).then((response) => {
    if (response.data === undefined) {
      return {} as T;
    }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  });

  // @ts-expect-error: todo: fix type later
  promise.cancel = () => {
    controller.abort();
  };

  return promise;
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

    // Transform request params and data to snake_case
    if (config.params) {
      config.params = toSnakeCase(config.params);
    }
    if (config.data) {
      config.data = toSnakeCase(config.data);
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
    // Transform response data to camelCase
    if (response.data) {
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  async (error) => {
    const status = error?.response?.status;

    // Check if the error is due to a cancelled request
    if (axios.isCancel(error)) {
      // For cancelled requests, we don't want to log an error to the console
      // or reject the promise with an error. We can either:
      // 1. Resolve with a default value
      // 2. Reject with a specific cancelled error
      // 3. Just return a rejected promise without additional logging
      return Promise.reject(new Error("Request was cancelled"));
    }

    // Browser-side 401 handling: sign out and redirect to login
    if (!isServer && status === 401) {
      try {
        await signOut({ redirect: true, callbackUrl: "/login" });
      } catch {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    // Avoid logging sensitive payloads; only log minimal info
    if (status && error?.config?.url) {
      console.error(`API Error ${status} on ${error.config.url}`);
    } else if (error.request) {
      console.error("API Error Request");
    } else {
      console.error("API Error Message:", error.message);
    }

    return Promise.reject(error.response?.data || error);
  }
);
