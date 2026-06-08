import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Access your Jude Nnam Chorale account to sign in, register, or recover your password.",
  alternates: {
    canonical: "https://www.jncchorale.com/auth/login",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
