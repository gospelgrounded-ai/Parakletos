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
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isApiPublic = nextUrl.pathname.startsWith("/api/bible");
      const isLanding = nextUrl.pathname === "/";

      if (isApiAuth || isApiPublic || isLanding) return true;

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/bible", nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
  providers: [], // providers added in auth.ts
};
