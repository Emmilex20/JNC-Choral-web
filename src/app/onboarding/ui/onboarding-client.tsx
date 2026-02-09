"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { completeOnboardingAction } from "../actions";

export default function OnboardingClient({
  initial,
}: {
  initial: {
    name: string;
    phone: string;
    address: string;
    stateOfOrigin: string;
    currentParish: string;
    isChorister: boolean;
  };
}) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await completeOnboardingAction(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await update({ onboardingComplete: true, name: form.name });
      router.refresh();
      router.push("/profile");
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8"
    >
      <h1 className="text-2xl font-semibold text-white">Complete your profile</h1>
      <p className="mt-2 text-sm text-white/70">
        This helps us keep your information accurate and tailored.
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Full name"
          className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
          required
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          placeholder="Phone"
          className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
        />
        <input
          value={form.address}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          placeholder="Address"
          className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.stateOfOrigin}
            onChange={(e) => setForm((p) => ({ ...p, stateOfOrigin: e.target.value }))}
            placeholder="State of origin"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
          />
          <input
            value={form.currentParish}
            onChange={(e) => setForm((p) => ({ ...p, currentParish: e.target.value }))}
            placeholder="Current parish"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
          />
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/85">
          <input
            type="checkbox"
            checked={form.isChorister}
            onChange={(e) => setForm((p) => ({ ...p, isChorister: e.target.checked }))}
            className="h-4 w-4 accent-white"
          />
          I am a chorister in the choral group.
        </label>
        <Button className="rounded-2xl" disabled={isPending}>
          {isPending ? "Saving..." : "Finish onboarding"}
        </Button>
      </form>
    </motion.div>
  );
}
