import type { NextAuthConfig } from "next-auth";

// Minimal config for Edge middleware (no Prisma, no bcrypt)
export const authConfig: NextAuthConfig = {
  // Vercel's proxy changes the host header — trust it so middleware doesn't throw.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Always public — API routes
      if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/bible")) return true;

      // Always public — marketing, legal, and password recovery
      if (
        pathname === "/" ||
        pathname.startsWith("/terms") ||
        pathname.startsWith("/privacy") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password")
      ) {
        return true;
      }

      // Always public — Bible reading (any specific chapter)
      // /bible/<translation>/<book>/<chapter>
      if (/^\/bible\/[^/]+\/\d+\/\d+/.test(pathname)) return true;

      // Auth pages redirect already-logged-in users into the app
      if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
        if (isLoggedIn) return Response.redirect(new URL("/bible", nextUrl));
        return true;
      }

      // Everything else requires a session
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
  providers: [], // providers added in auth.ts
};
