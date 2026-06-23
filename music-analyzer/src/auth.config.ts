import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl
      const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register")
      const isApiAuth = pathname.startsWith("/api/auth")

      if (isApiAuth) return true
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/analyze", nextUrl))
        return true
      }
      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl))
      return true
    },
  },
} satisfies NextAuthConfig
