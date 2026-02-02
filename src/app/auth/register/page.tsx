"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { registerUserAction } from "./actions";

type ToastState = { type: "success" | "error"; message: string } | null;

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className="fixed right-4 top-4 z-[100] w-full max-w-sm">
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

function RegisterForm() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setToast(null);

    if (form.password !== form.confirm) {
      setToast({ type: "error", message: "Passwords do not match." });
      return;
    }

    startTransition(async () => {
      const res = await registerUserAction({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (!res.ok) {
        setToast({ type: "error", message: res.error });
        return;
      }
      setToast({ type: "success", message: "Account created. Please sign in." });
      setTimeout(() => router.push("/auth/login"), 1200);
    });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="mt-1 text-sm text-white/70">
          Join the platform and register for auditions.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Full name"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-white"
            required
          />
          <input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            type="email"
            placeholder="Email"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-white"
            required
          />
          <div className="relative">
            <input
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
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
          <div className="relative">
            <input
              value={form.confirm}
              onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-white/10 bg-black/40 p-3 pr-12 text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/70 hover:text-white"
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>

          <Button className="rounded-2xl" disabled={isPending}>
            {isPending ? "Creating..." : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <RegisterForm />
    </Suspense>
  );
}
