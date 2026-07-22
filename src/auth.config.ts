import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register");
      const isAdmin = pathname.startsWith("/admin");
      const isSuperAdmin = pathname.startsWith("/super-admin");
      const isAccount =
        pathname.startsWith("/account") || pathname.startsWith("/orders");

      if (!isLoggedIn && (isAdmin || isSuperAdmin || isAccount)) {
        return false;
      }

      if (isLoggedIn && isAuthPage) {
        return Response.redirect(
          new URL(
            role === "SUPER_ADMIN"
              ? "/super-admin"
              : role === "ADMIN"
                ? "/admin"
                : "/catalogue",
            request.nextUrl
          )
        );
      }

      if (isAdmin && role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      if (isSuperAdmin && role !== "SUPER_ADMIN") {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
