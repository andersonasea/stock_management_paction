import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/admin/:path*",
    "/super-admin/:path*",
    "/account/:path*",
    "/orders/:path*",
    "/login",
    "/register",
  ],
};
