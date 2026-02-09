"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  confirmAttendanceAction,
  createRehearsalAction,
  deleteRehearsalAction,
  rejectAttendanceAction,
} from "../actions";

type RehearsalRow = {
  id: string;
  title: string;
  startsAt: string;
  attendanceCount: number;
  confirmedCount: number;
};

type PendingAttendance = {
  id: string;
  rehearsalTitle: string;
  rehearsalDate: string;
  userName: string | null;
  userEmail: string | null;
  markedAt: string;
};

export default function AdminRehearsalsClient({
  initialRehearsals,
  initialPending,
}: {
  initialRehearsals: RehearsalRow[];
  initialPending: PendingAttendance[];
}) {
  const [rehearsals, setRehearsals] = useState<RehearsalRow[]>(initialRehearsals);
  const [pending, setPending] = useState<PendingAttendance[]>(initialPending);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [isPending, startTransition] = useTransition();

  function createRehearsal() {
    startTransition(async () => {
      const res = await createRehearsalAction({ title, startsAt });
      if (!res.ok) return;
      setRehearsals((prev) => [
        {
          id: res.rehearsal.id,
          title: res.rehearsal.title,
          startsAt: res.rehearsal.startsAt.toISOString(),
          attendanceCount: 0,
          confirmedCount: 0,
        },
        ...prev,
      ]);
      setTitle("");
      setStartsAt("");
    });
  }

  function removeRehearsal(id: string) {
    if (!confirm("Delete this rehearsal?")) return;
    startTransition(async () => {
      const res = await deleteRehearsalAction({ id });
      if (!res.ok) return;
      setRehearsals((prev) => prev.filter((r) => r.id !== id));
    });
  }

  function confirmAttendance(id: string) {
    startTransition(async () => {
      const res = await confirmAttendanceAction({ id });
      if (!res.ok) return;
      setPending((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function rejectAttendance(id: string) {
    startTransition(async () => {
      const res = await rejectAttendanceAction({ id });
      if (!res.ok) return;
      setPending((prev) => prev.filter((p) => p.id !== id));
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <h3 className="text-lg font-semibold text-white">Create rehearsal</h3>
        <div className="mt-4 grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Rehearsal title"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
          />
          <input
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            type="datetime-local"
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
          />
          <Button className="rounded-2xl" onClick={createRehearsal} disabled={isPending}>
            {isPending ? "Saving..." : "Add rehearsal"}
          </Button>
        </div>

        <div className="mt-6 grid gap-3">
          {rehearsals.length === 0 ? (
            <p className="text-sm text-white/60">No rehearsals yet.</p>
          ) : (
            rehearsals.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{r.title}</p>
                    <p className="text-xs text-white/60">
                      {new Date(r.startsAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                      {r.confirmedCount}/{r.attendanceCount} confirmed
                    </Badge>
                    <Button
                      variant="outline"
                      className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                      onClick={() => removeRehearsal(r.id)}
                      disabled={isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <h3 className="text-lg font-semibold text-white">Pending confirmations</h3>
        <p className="mt-2 text-sm text-white/60">
          Choristers have marked themselves present. Confirm or reject below.
        </p>
        <div className="mt-4 grid gap-3">
          {pending.length === 0 ? (
            <p className="text-sm text-white/60">No pending attendance.</p>
          ) : (
            pending.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <p className="font-semibold text-white">{p.userName ?? "Unnamed user"}</p>
                <p className="text-xs text-white/60">{p.userEmail ?? "-"}</p>
                <p className="mt-2 text-sm text-white/80">{p.rehearsalTitle}</p>
                <p className="text-xs text-white/60">
                  {new Date(p.rehearsalDate).toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-white/50">
                  Marked: {new Date(p.markedAt).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    className="rounded-2xl"
                    onClick={() => confirmAttendance(p.id)}
                    disabled={isPending}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                    onClick={() => rejectAttendance(p.id)}
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
    </div>
  );
}
