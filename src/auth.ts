import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { findUserByEmail, normalizeEmail } from "@/lib/email";
import {
  clearRateLimit,
  ipFromHeaders,
  isRateLimited,
  recordRateLimitHit,
} from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const ROLE_REFRESH_MS = 5 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
// Valid bcrypt hash used to keep timing similar when the account doesn't exist.
const DUMMY_HASH = "$2b$12$YDYVPPRJ/FE7rjYuyGN3tOD/KLWJYpm5g7EVSW1XKjgNwYNfZ0lqa";

type JwtUser = {
  id?: string;
  role?: string | null;
  image?: string | null;
  onboardingComplete?: boolean;
};

type SessionUserUpdate = {
  name?: string | null;
  image?: string | null;
  onboardingComplete?: boolean;
};

type SessionUpdatePayload = SessionUserUpdate & {
  user?: SessionUserUpdate;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) return null;
        if (credentials.password.length > 128) return null;

        const email = normalizeEmail(credentials.email);
        const ip = ipFromHeaders((name) => {
          const value = req?.headers?.[name];
          return Array.isArray(value) ? value[0] : value;
        });
        const emailKey = `login:email:${email}`;
        const ipKey = `login:ip:${ip}`;

        if (
          (await isRateLimited(emailKey, 8, LOGIN_WINDOW_MS)) ||
          (await isRateLimited(ipKey, 30, LOGIN_WINDOW_MS))
        ) {
          return null;
        }

        const user = await findUserByEmail(email);
        const hash = user?.passwordHash ?? DUMMY_HASH;
        const isValid = await bcrypt.compare(credentials.password, hash);

        if (!user || !user.passwordHash || !isValid) {
          await recordRateLimitHit(emailKey);
          await recordRateLimitHit(ipKey);
          return null;
        }

        await clearRateLimit(emailKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          onboardingComplete: user.onboardingComplete,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const authUser = user as typeof user & JwtUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.name = user.name;
        token.email = user.email;
        token.picture = authUser.image;
        token.onboardingComplete = authUser.onboardingComplete;
      }
      if (trigger === "update" && session) {
        const updatePayload = session as SessionUpdatePayload;
        const updatedUser = updatePayload.user ?? updatePayload;
        token.name = updatedUser.name ?? token.name;
        token.picture = updatedUser.image ?? token.picture;
        token.onboardingComplete =
          updatedUser.onboardingComplete ?? token.onboardingComplete;
      }
      // Re-check the role periodically so demotions and deletions take effect
      // without waiting for the JWT to expire.
      if (token.id) {
        const checkedAt = (token.roleCheckedAt as number | undefined) ?? 0;
        if (!user && Date.now() - checkedAt > ROLE_REFRESH_MS) {
          const current = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          token.role = current?.role;
          token.roleCheckedAt = Date.now();
        } else if (user) {
          token.roleCheckedAt = Date.now();
        }
      }
      if (token.id && token.onboardingComplete !== true) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { onboardingComplete: true },
        });
        token.onboardingComplete = dbUser?.onboardingComplete ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? (token.sub as string);
        session.user.role = token.role as string;
        session.user.name = token.name as string | undefined;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
        session.user.onboardingComplete =
          (token.onboardingComplete as boolean | undefined) ?? false;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
};
