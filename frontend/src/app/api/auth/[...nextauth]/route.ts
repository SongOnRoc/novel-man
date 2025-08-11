import NextAuth, { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  loginService,
  getCurrentUserService,
} from "@/lib/services/auth.service";
import type { components } from "@/types/generated/api";

type UserProfile = components["schemas"]["auth.UserProfileResponse"];
type LoginResponse = components["schemas"]["auth.LoginResponse"];

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
          // Step 1: Login to get the access token.
          const loginResponse = await loginService({
            identifier: credentials.identifier,
            password: credentials.password,
          });
          const accessToken = (loginResponse as LoginResponse).access_token;

          if (!accessToken) {
            throw new Error("Access Token not found");
          }

          // Step 2: Use the access token to fetch the user profile.
          const userProfile = await getCurrentUserService();

          if (userProfile) {
            // Step 3: Combine user profile and token into a single object.
            // We use `as any` here as a pragmatic solution to bypass the complex
            // and sometimes conflicting type inference of NextAuth's `authorize` callback.
            // The structure is internally consistent and will be correctly handled by the `jwt` callback.
            return {
              ...userProfile,
              accessToken: accessToken,
            } as any;
          }
          return null;
        } catch (error) {
          console.error("Authorize error:", error);
          throw new Error("Invalid identifier or password.");
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
    async jwt({ token, user }) {
      // `user` is the object returned from the `authorize` callback.
      if (user) {
        const authorizedUser = user as UserProfile & { accessToken: string };
        token.accessToken = authorizedUser.accessToken;
        token.user = {
          id: authorizedUser.id,
          username: authorizedUser.username,
          email: authorizedUser.email,
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the data from the JWT to the client-side session.
      if (token) {
        session.accessToken = token.accessToken as string;
        session.user = token.user as any; // Our `next-auth.d.ts` handles the client-side User type.
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
