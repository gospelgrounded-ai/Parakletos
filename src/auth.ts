import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const ip = clientIp(request);
        const allowed = await checkRateLimit(`login:${email.toLowerCase()}:${ip}`, 10);
        if (!allowed) return null;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        // A deleted account can still carry a valid JWT until it expires;
        // verify the user still exists so downstream routes' existing
        // `if (!session?.user?.id) return 401` guards catch ghost sessions
        // instead of throwing a foreign-key 500.
        const exists = await db.user
          .findUnique({ where: { id: token.id as string }, select: { id: true } })
          .catch(() => null);
        if (exists) {
          session.user.id = token.id as string;
        }
      }
      return session;
    },
  },
});
