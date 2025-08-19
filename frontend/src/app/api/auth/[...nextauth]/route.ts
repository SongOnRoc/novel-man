import axios from "axios";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { axiosInstance } from "@/lib/axios";
import {
  loginService,
  LoginResponse,
  AuthUser,
} from "@/lib/services/auth.service";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Identifier", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        try {
          const loginResponse = await loginService({
            identifier: credentials.identifier,
            password: credentials.password,
          });
          // Ensure loginResponse is not undefined
          if (!loginResponse) {
            throw new Error("Login response is undefined");
          }

          // The actual backend response structure is { access_token: "...", token_type: "Bearer" }
          const accessToken = (loginResponse as any).access_token;
          if (!accessToken) {
            throw new Error(
              "Failed to obtain access token from login response."
            );
          }
          // Now, use the access token to fetch the user profile.
          // The root cause of potential race conditions is that the global axios instance
          // might not have the new token yet. The robust solution is to make a direct API call here.
          // We must ensure the baseURL is always defined, especially on the server.
          const userAxiosInstance = axios.create({
            baseURL: axiosInstance.defaults.baseURL,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });
          try {
            const userProfileResponse =
              await userAxiosInstance.get<AuthUser>("/auth/me");
            // The customInstance and axios interceptors should have already extracted .data
            // from the standard {code, message, data} format.
            // So userProfileResponse.data should be {code, message, data: {...}} or the final data object.
            // Let's log it to be sure.
            // Handle potential nested data structure from backend standard format
            let userProfileData;
            if (
              userProfileResponse.data &&
              typeof userProfileResponse.data === "object" &&
              "data" in userProfileResponse.data
            ) {
              // Standard format {code, message, data: {...}}
              userProfileData = userProfileResponse.data.data;
            } else {
              // Direct data format {...}
              userProfileData = userProfileResponse.data;
            }

            if (userProfileData) {
              // To satisfy NextAuth's internal User type, we must convert the ID to a string here.
              // The actual user ID is in userProfileData.id
              const userData: any = userProfileData; // Assert to any for dynamic API data
              return {
                ...userData,
                id: String(userData.id), // Correctly access id from extracted data
                accessToken: accessToken, // Attach accessToken for the jwt callback
              };
            } else {
              throw new Error("Failed to fetch valid user profile data.");
            }
          } catch (userFetchError: any) {
            // Re-throw a more specific error
            throw new Error(
              userFetchError.response?.data?.message ||
                "Failed to fetch user profile after login."
            );
          }
        } catch (error: any) {
          throw new Error(
            error.response?.data?.message || "Invalid identifier or password."
          );
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as any;
        token.accessToken = customUser.accessToken;
        // The user object from authorize is already structured correctly
        token.user = {
          id:
            typeof customUser.id === "number"
              ? customUser.id
              : Number(customUser.id),
          username: customUser.username,
          email: customUser.email,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken && token.user) {
        session.accessToken = token.accessToken as string;
        session.user = token.user as AuthUser;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
