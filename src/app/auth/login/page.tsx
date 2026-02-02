"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";

type ToastState = { type: "success" | "error"; message: string } | null;

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className="fixed right-4 top-4 z-100 w-full max-w-sm">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm shadow-lg ${
          toast.type === "success"
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
            : "border-red-400/30 bg-red-500/10 text-red-100"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>{toast.message}</div>
          <button
            className="text-white/70 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorParam = searchParams.get("error");
  const [toast, setToast] = useState<ToastState>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!errorParam) return;
    const message =
      errorParam === "CredentialsSignin"
        ? "Invalid email or password."
        : "Unable to sign in. Please try again.";
    setToast({ type: "error", message });
  }, [errorParam]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="min-h-screen bg-black">
      <SiteNavbar />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="flex items-center justify-center px-4 py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8"
        >
          <h1 className="text-2xl font-semibold text-white">Sign in</h1>
          <p className="mt-1 text-sm text-white/70">
            Access auditions & admin dashboard
          </p>

        <Button
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-6 w-full cursor-pointer rounded-2xl bg-linear-to-r from-white via-slate-100 to-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(255,255,255,0.28)]"
        >
          Continue with Google
        </Button>

        <div className="my-6 text-center text-xs text-white/50">OR</div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const email = (form.email as HTMLInputElement).value;
            const password = (form.password as HTMLInputElement).value;
            const res = await signIn("credentials", {
              email,
              password,
              callbackUrl,
              redirect: false,
            });
            if (!res || res.error) {
              setToast({ type: "error", message: "Invalid email or password." });
              return;
            }
            setToast({ type: "success", message: "Signed in successfully." });
            window.location.href = callbackUrl;
          }}
          className="grid gap-3"
        >
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-white"
            required
          />
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-xl border border-white/10 bg-black/40 p-3 pr-12 text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/70 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <Button className="rounded-2xl bg-linear-to-r from-amber-200 via-yellow-300 to-amber-500 text-black shadow-[0_10px_30px_rgba(245,158,11,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(245,158,11,0.45)] cursor-pointer">
            Sign in
          </Button>
        </form>

        <div className="mt-4 text-sm text-white/70">
          <a className="hover:text-white" href="/auth/forgot">
            Forgot password?
          </a>
        </div>
        </motion.div>
      </div>
      <SiteFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}
