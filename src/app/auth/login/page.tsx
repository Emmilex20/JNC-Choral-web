"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-semibold text-white">Sign in</h1>
        <p className="mt-1 text-sm text-white/70">
          Access auditions & admin dashboard
        </p>

        <Button
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-6 w-full rounded-2xl"
        >
          Continue with Google
        </Button>

        <div className="my-6 text-center text-xs text-white/50">OR</div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const email = (form.email as HTMLInputElement).value;
            const password = (form.password as HTMLInputElement).value;
            signIn("credentials", { email, password, callbackUrl });
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
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-white"
            required
          />

          <Button className="rounded-2xl">Sign in</Button>
        </form>
      </div>
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
