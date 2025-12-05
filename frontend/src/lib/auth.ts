import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import {
    loginService,
    LoginResponseForClient,
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
                    const loginResponse: LoginResponseForClient = await loginService({
                        identifier: credentials.identifier,
                        password: credentials.password,
                    });
                    // Ensure loginResponse is not undefined
                    if (!loginResponse) {
                        throw new Error("Login response is undefined");
                    }

                    // The axios interceptor transforms the response to camelCase, so we expect `accessToken`.
                    const accessToken = loginResponse.accessToken;
                    if (!accessToken) {
                        throw new Error(
                            "Failed to obtain access token from login response."
                        );
                    }
                    // Now, use the access token to fetch the user profile.
                    try {
                        // We need to manually fetch here because we can't use the generated service
                        // inside the NextAuth provider configuration easily without circular dependencies
                        // or context issues.
                        const baseURL = process.env.NEXTAUTH_URL
                            ? `${process.env.NEXTAUTH_URL}/api/proxy`
                            : "http://localhost:3000/api/proxy";
                            
                        const response = await fetch(`${baseURL}/auth/me`, {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${accessToken}`,
                            },
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to fetch user profile: ${response.statusText}`);
                        }

                        const responseData = await response.json();
                        
                        // Handle potential nested data structure from backend standard format
                        // The proxy might return { code, message, data: {...} } or just {...} depending on transformation
                        // But since we are calling proxy directly here, we get what backend returns (snake_case)
                        // We need to be careful about casing if we use raw fetch.
                        // However, let's assume standard response structure.
                        
                        let userProfileData = responseData.data || responseData;

                        if (userProfileData) {
                            // To satisfy NextAuth's internal User type, we must convert the ID to a string here.
                            // The actual user ID is in userProfileData.id
                            const userData = userProfileData as AuthUser;
                            return {
                                ...userData,
                                id: String(userData.id), // Correctly access id from extracted data
                                accessToken: accessToken, // Attach accessToken for the jwt callback
                            };
                        } else {
                            throw new Error("Failed to fetch valid user profile data.");
                        }
                    } catch (userFetchError: any) {
                        console.error("User fetch error:", userFetchError);
                        // Re-throw a more specific error
                        throw new Error(
                            userFetchError.message ||
                            "Failed to fetch user profile after login."
                        );
                    }
                } catch (error: any) {
                    throw new Error(
                        error.message || "Invalid identifier or password."
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
                // The `user` object is the return value from `authorize`. It's a mix of our
                // AuthUser and the accessToken, with the `id` converted to a string.
                // Using `any` here is a pragmatic choice to avoid complex type gymnastics
                // for this internal-only object.
                const customUser = user as any;
                token.accessToken = customUser.accessToken;
                // The user object from authorize is already structured correctly
                token.user = {
                    id: Number(customUser.id), // a string from authorize, convert back to number
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
