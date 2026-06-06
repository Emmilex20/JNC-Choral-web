import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

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

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

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
