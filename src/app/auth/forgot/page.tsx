"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "./actions";

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

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState>(null);
  const [code, setCode] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setToast(null);
    setCode(null);

    startTransition(async () => {
      const res = await requestPasswordResetAction({ email });
      if (!res.ok) {
        setToast({ type: "error", message: res.error });
        return;
      }
      setToast({
        type: "success",
        message: "If the email exists, a code has been sent.",
      });
      if ("code" in res) {
        setCode(res.code);
      }
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
        <h1 className="text-2xl font-semibold text-white">Forgot password</h1>
        <p className="mt-1 text-sm text-white/70">
          We will send a one-time code to reset your password.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-white"
            required
          />
          <Button className="rounded-2xl" disabled={isPending}>
            {isPending ? "Sending..." : "Send code"}
          </Button>
        </form>

        {code ? (
          <div className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            Dev mode code: <b className="text-white">{code}</b>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ForgotPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ForgotForm />
    </Suspense>
  );
}
