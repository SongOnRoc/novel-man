import "next-auth";
import "next-auth/jwt";
import { AuthUser } from "@/lib/services/auth.service";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: AuthUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    user: AuthUser;
  }
}
