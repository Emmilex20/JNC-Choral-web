"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { verifyChoristerAction } from "../../users/actions";

type PendingUser = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
};

export default function AdminPendingChoristersClient({
  initialUsers,
}: {
  initialUsers: PendingUser[];
}) {
  const [users, setUsers] = useState<PendingUser[]>(initialUsers);
  const [isPending, startTransition] = useTransition();

  function handleDecision(id: string, approved: boolean) {
    startTransition(async () => {
      const res = await verifyChoristerAction({ id, approved });
      if (!res.ok) return;
      setUsers((prev) => prev.filter((u) => u.id !== id));
    });
  }

  return (
    <div className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Verification Queue</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Pending chorister requests</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Review self-identified choristers and clear the queue without opening each record.
          </p>
        </div>
        <Badge className="rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/10">
          {users.length} pending
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {users.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60 md:col-span-2 2xl:col-span-3">
            No pending choristers.
          </p>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{u.name ?? "Unnamed user"}</p>
                  <p className="mt-1 break-all text-xs text-white/60">{u.email ?? "-"}</p>
                </div>
                <Badge className="rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20">
                  Awaiting review
                </Badge>
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/40">
                Requested: {new Date(u.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="rounded-2xl"
                  onClick={() => handleDecision(u.id, true)}
                  disabled={isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  onClick={() => handleDecision(u.id, false)}
                  disabled={isPending}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
