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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/70">
          Review requests from users who marked themselves as choristers.
        </p>
        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
          {users.length} pending
        </Badge>
      </div>
      <div className="mt-6 grid gap-3">
        {users.length === 0 ? (
          <p className="text-sm text-white/60">No pending choristers.</p>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <p className="font-semibold text-white">{u.name ?? "Unnamed user"}</p>
              <p className="text-xs text-white/60">{u.email ?? "-"}</p>
              <p className="mt-2 text-xs text-white/40">
                Requested: {new Date(u.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
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
