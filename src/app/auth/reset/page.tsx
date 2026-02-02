"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "./actions";

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

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [toast, setToast] = useState<ToastState>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    email: params.get("email") ?? "",
    code: params.get("code") ?? "",
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
      const res = await resetPasswordAction({
        email: form.email,
        code: form.code,
        password: form.password,
      });
      if (!res.ok) {
        setToast({ type: "error", message: res.error });
        return;
      }
      setToast({ type: "success", message: "Password reset successfully." });
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
        <h1 className="text-2xl font-semibold text-white">Reset password</h1>
        <p className="mt-1 text-sm text-white/70">
          Enter the code sent to your email and choose a new password.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-3">
          <input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            type="email"
            placeholder="Email"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-white"
            required
          />
          <input
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
            placeholder="6-digit code"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-white"
            required
          />

          <div className="relative">
            <input
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              type={showPassword ? "text" : "password"}
              placeholder="New password"
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
              placeholder="Confirm new password"
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
            {isPending ? "Saving..." : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ResetForm />
    </Suspense>
  );
}
