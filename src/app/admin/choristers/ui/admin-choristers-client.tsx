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
  gender: string | null;
  maritalStatus: string | null;
  emergencyContact: string | null;
  stateOfOrigin: string | null;
  currentParish: string | null;
  socialHandle: string | null;
  passportImageUrl: string | null;
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

function valueOrFallback(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

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

  const profileDetails = useMemo(() => {
    if (!selected) return [];

    return [
      { label: "Phone", value: valueOrFallback(selected.profile?.phone) },
      { label: "Voice part", value: valueOrFallback(selected.profile?.voicePart) },
      {
        label: "Date of birth",
        value: selected.profile?.dateOfBirth
          ? new Date(selected.profile.dateOfBirth).toLocaleDateString()
          : "-",
      },
      { label: "Gender", value: valueOrFallback(selected.profile?.gender) },
      { label: "Marital status", value: valueOrFallback(selected.profile?.maritalStatus) },
      { label: "State of origin", value: valueOrFallback(selected.profile?.stateOfOrigin) },
      { label: "Current parish", value: valueOrFallback(selected.profile?.currentParish) },
      {
        label: "Emergency contact",
        value: valueOrFallback(selected.profile?.emergencyContact),
      },
      { label: "Social handle", value: valueOrFallback(selected.profile?.socialHandle) },
      { label: "Address", value: valueOrFallback(selected.profile?.address) },
    ];
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
    <div className="admin-module rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
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
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/78 p-4 backdrop-blur-sm md:p-6 xl:p-8">
          <div className="mx-auto flex min-h-full items-start justify-center">
            <div className="admin-module my-4 w-full max-w-6xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,7,18,0.96))] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.45)] md:p-8">
              <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-6 border-b border-white/10 bg-[rgba(2,6,23,0.94)] px-6 py-5 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                      Chorister Profile
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                      {selected.name ?? "Unnamed user"}
                    </h3>
                    <p className="mt-2 text-sm text-white/70">{selected.email ?? "-"}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                        Joined {new Date(selected.createdAt).toLocaleDateString()}
                      </Badge>
                      <Badge className="rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20">
                        Verified chorister
                      </Badge>
                    </div>
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
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="space-y-6">
                  <div className="rounded-[1.75rem] border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
                    <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">
                      Admin Note (visible to chorister)
                    </div>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      className="mt-3 w-full rounded-2xl border border-amber-500/20 bg-black/40 p-4 text-sm text-amber-100"
                      placeholder="Add a note or instruction"
                    />
                    <div className="mt-4 flex justify-end">
                      <Button className="rounded-2xl" onClick={updateNote} disabled={isPending}>
                        Save Note
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                          Profile Details
                        </p>
                        <h4 className="mt-2 text-xl font-semibold text-white">
                          Full chorister record
                        </h4>
                      </div>
                      <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                        {selected.profile ? "Profile submitted" : "No profile yet"}
                      </Badge>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {profileDetails.map((detail) => (
                        <div
                          key={detail.label}
                          className="rounded-2xl border border-white/10 bg-black/30 p-4"
                        >
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                            {detail.label}
                          </p>
                          <p className="mt-2 break-words text-sm leading-6 text-white/82">
                            {detail.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Rehearsal Attendance
                    </p>
                    <div className="mt-4 grid gap-3">
                      {sortedAttendance.length === 0 ? (
                        <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/60">
                          No attendance records yet.
                        </p>
                      ) : (
                        sortedAttendance.map((a) => (
                          <div
                            key={a.id}
                            className="rounded-2xl border border-white/10 bg-black/30 p-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="font-semibold text-white">{a.rehearsalTitle}</p>
                                <p className="mt-1 text-xs text-white/60">
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

                <div className="space-y-6">
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Attendance Summary
                    </p>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-sm text-white/60">Total marked</p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {attendanceStats.total}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-sm text-white/60">Confirmed</p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {attendanceStats.confirmed}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-sm text-white/60">Confirmation rate</p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {attendanceStats.total === 0
                            ? "0%"
                            : `${Math.round(
                                (attendanceStats.confirmed / attendanceStats.total) * 100
                              )}%`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Passport Record
                    </p>
                    <div className="mt-4">
                      {selected.profile?.passportImageUrl ? (
                        <div className="space-y-4">
                          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40">
                            <img
                              src={selected.profile.passportImageUrl}
                              alt={`${selected.name ?? "Chorister"} passport`}
                              className="h-auto w-full object-cover"
                            />
                          </div>
                          <a
                            href={selected.profile.passportImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                          >
                            Open passport image
                          </a>
                        </div>
                      ) : (
                        <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/60">
                          No passport image uploaded yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
