import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Access your Jude Nnam Choral account to sign in, register, or recover your password.",
  alternates: {
    canonical: "https://www.jnc-choral.vercel.app/auth/login",
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
