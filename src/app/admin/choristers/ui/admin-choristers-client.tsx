"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { confirmAttendanceAction, rejectAttendanceAction } from "../actions";
import { updateUserAction, verifyChoristerAction } from "../../users/actions";

type ChoristerProfile = {
  phone: string | null;
  address: string | null;
  voicePart: string | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  stateOfOrigin: string | null;
  currentParish: string | null;
};

type AttendanceRow = {
  id: string;
  rehearsalTitle: string;
  startsAt: string;
  markedAt: string;
  confirmedAt: string | null;
};

type ChoristerRow = {
  id: string;
  name: string | null;
  email: string | null;
  adminNote: string | null;
  createdAt: string;
  profile: ChoristerProfile | null;
  attendance: AttendanceRow[];
};

export default function AdminChoristersClient({
  initialChoristers,
}: {
  initialChoristers: ChoristerRow[];
}) {
  const [choristers, setChoristers] = useState<ChoristerRow[]>(initialChoristers);
  const [selected, setSelected] = useState<ChoristerRow | null>(null);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const sortedAttendance = useMemo(() => {
    if (!selected) return [];
    return [...selected.attendance].sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    );
  }, [selected]);

  const attendanceStats = useMemo(() => {
    if (!selected) return { total: 0, confirmed: 0 };
    const total = selected.attendance.length;
    const confirmed = selected.attendance.filter((a) => a.confirmedAt).length;
    return { total, confirmed };
  }, [selected]);

  function openModal(u: ChoristerRow) {
    setSelected(u);
    setNote(u.adminNote ?? "");
  }

  function updateNote() {
    if (!selected) return;
    startTransition(async () => {
      const res = await updateUserAction({
        id: selected.id,
        adminNote: note,
      });
      if (!res.ok) return;
      setChoristers((prev) =>
        prev.map((u) => (u.id === selected.id ? { ...u, adminNote: note } : u))
      );
      setSelected((prev) => (prev ? { ...prev, adminNote: note } : prev));
    });
  }

  function revokeChorister() {
    if (!selected) return;
    if (!confirm("Revoke chorister verification?")) return;
    startTransition(async () => {
      const res = await verifyChoristerAction({ id: selected.id, approved: false });
      if (!res.ok) return;
      setChoristers((prev) => prev.filter((u) => u.id !== selected.id));
      setSelected(null);
    });
  }

  function confirmAttendance(id: string) {
    if (!selected) return;
    startTransition(async () => {
      const res = await confirmAttendanceAction({ id });
      if (!res.ok) return;
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              attendance: prev.attendance.map((a) =>
                a.id === id ? { ...a, confirmedAt: new Date().toISOString() } : a
              ),
            }
          : prev
      );
    });
  }

  function rejectAttendance(id: string) {
    if (!selected) return;
    startTransition(async () => {
      const res = await rejectAttendanceAction({ id });
      if (!res.ok) return;
      setSelected((prev) =>
        prev
          ? { ...prev, attendance: prev.attendance.filter((a) => a.id !== id) }
          : prev
      );
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
      {choristers.length === 0 ? (
        <p className="text-sm text-white/60">No choristers yet.</p>
      ) : (
        <div className="grid gap-3">
          {choristers.map((u) => (
            <button
              key={u.id}
              onClick={() => openModal(u)}
              className="text-left rounded-2xl border border-white/10 bg-black/30 p-4 hover:border-white/20 hover:bg-black/40 transition"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-white">{u.name ?? "Unnamed user"}</p>
                  <p className="text-xs text-white/70">{u.email ?? "-"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                    Joined {new Date(u.createdAt).toLocaleDateString()}
                  </Badge>
                  <Badge className="rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20">
                    Verified
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-black p-6 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Chorister Profile
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {selected.name ?? "Unnamed user"}
                </h3>
                <p className="text-sm text-white/70">{selected.email ?? "-"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  onClick={revokeChorister}
                  disabled={isPending}
                >
                  Revoke
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">
                Admin Note (visible to chorister)
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-amber-500/20 bg-black/40 p-3 text-sm text-amber-100"
                placeholder="Add a note or instruction"
              />
              <div className="mt-3 flex justify-end">
                <Button className="rounded-2xl" onClick={updateNote} disabled={isPending}>
                  Save Note
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Profile</p>
                <div className="mt-3 space-y-2 text-sm text-white/80">
                  <div>Phone: {selected.profile?.phone ?? "-"}</div>
                  <div>Address: {selected.profile?.address ?? "-"}</div>
                  <div>Voice part: {selected.profile?.voicePart ?? "-"}</div>
                  <div>
                    Date of birth:{" "}
                    {selected.profile?.dateOfBirth
                      ? new Date(selected.profile.dateOfBirth).toLocaleDateString()
                      : "-"}
                  </div>
                  <div>Emergency contact: {selected.profile?.emergencyContact ?? "-"}</div>
                  <div>State of origin: {selected.profile?.stateOfOrigin ?? "-"}</div>
                  <div>Current parish: {selected.profile?.currentParish ?? "-"}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Attendance Summary
                </p>
                <div className="mt-3 text-sm text-white/80">
                  <div>Total marked: {attendanceStats.total}</div>
                  <div>Confirmed: {attendanceStats.confirmed}</div>
                  <div>
                    Confirmation rate:{" "}
                    {attendanceStats.total === 0
                      ? "0%"
                      : `${Math.round(
                          (attendanceStats.confirmed / attendanceStats.total) * 100
                        )}%`}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                Rehearsal Attendance
              </p>
              <div className="mt-3 grid gap-3">
                {sortedAttendance.length === 0 ? (
                  <p className="text-sm text-white/60">No attendance records yet.</p>
                ) : (
                  sortedAttendance.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-white">{a.rehearsalTitle}</p>
                          <p className="text-xs text-white/60">
                            {new Date(a.startsAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {a.confirmedAt ? (
                            <Badge className="rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20">
                              Confirmed
                            </Badge>
                          ) : (
                            <Badge className="rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20">
                              Pending
                            </Badge>
                          )}
                          <Badge className="rounded-full bg-white/10 text-white/70 hover:bg-white/10">
                            Marked {new Date(a.markedAt).toLocaleDateString()}
                          </Badge>
                          {!a.confirmedAt ? (
                            <>
                              <Button
                                className="rounded-2xl"
                                onClick={() => confirmAttendance(a.id)}
                                disabled={isPending}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                onClick={() => rejectAttendance(a.id)}
                                disabled={isPending}
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
