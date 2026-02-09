"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markAttendanceAction, upsertChoristerProfileAction } from "../actions";

type Profile = {
  id: string;
  phone: string | null;
  address: string | null;
  voicePart: string | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  stateOfOrigin: string | null;
  currentParish: string | null;
};

type Notice = {
  id: string;
  title: string;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
};

type Rehearsal = {
  id: string;
  title: string;
  startsAt: string;
};

type Attendance = {
  id: string;
  rehearsalId: string;
  status: "PRESENT";
  confirmedAt: string | null;
  rehearsal: {
    id: string;
    title: string;
    startsAt: string;
  };
};

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    adminNote: string | null;
  };
  profile: Profile | null;
  notices: Notice[];
  rehearsals: Rehearsal[];
  attendance: Attendance[];
  stats: {
    totalRehearsals: number;
    confirmedCount: number;
    attendancePercent: number;
    monthlyTrend: { label: string; total: number; attended: number; percent: number }[];
  };
};

export default function ChoristerClient({
  user,
  profile,
  notices,
  rehearsals,
  attendance,
  stats,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
    voicePart: profile?.voicePart ?? "",
    dateOfBirth: profile?.dateOfBirth
      ? new Date(profile.dateOfBirth).toISOString().slice(0, 10)
      : "",
    emergencyContact: profile?.emergencyContact ?? "",
    stateOfOrigin: profile?.stateOfOrigin ?? "",
    currentParish: profile?.currentParish ?? "",
  });

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendance.forEach((a) => map.set(a.rehearsalId, a));
    return map;
  }, [attendance]);

  const sortedRehearsals = useMemo(() => {
    return [...rehearsals].sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    );
  }, [rehearsals]);

  function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await upsertChoristerProfileAction(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  function markPresent(rehearsalId: string) {
    setError(null);
    startTransition(async () => {
      const res = await markAttendanceAction({ rehearsalId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/2 to-transparent p-6 md:p-8"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Choristers Portal
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Welcome back {user.name ?? "Chorister"}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Keep your profile up to date and track your attendance.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80">
            {stats.confirmedCount} / {stats.totalRehearsals} rehearsals confirmed
          </div>
        </div>
        {user.adminNote ? (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">
              Admin Note
            </div>
            <p className="mt-2">{user.adminNote}</p>
          </div>
        ) : null}
      </motion.div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white">Your Profile</h2>
          <p className="mt-1 text-sm text-white/60">
            Update your details so the team can stay in sync.
          </p>
          <form onSubmit={saveProfile} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone"
                className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
              />
              <input
                value={form.voicePart}
                onChange={(e) => setForm((p) => ({ ...p, voicePart: e.target.value }))}
                placeholder="Voice part (Soprano/Alto/Tenor/Bass)"
                className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
              />
              <input
                value={form.stateOfOrigin}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stateOfOrigin: e.target.value }))
                }
                placeholder="State of origin"
                className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
              />
              <input
                value={form.currentParish}
                onChange={(e) =>
                  setForm((p) => ({ ...p, currentParish: e.target.value }))
                }
                placeholder="Current parish"
                className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
              />
            </div>
            <input
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Address"
              className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
            />
            <input
              value={form.emergencyContact}
              onChange={(e) =>
                setForm((p) => ({ ...p, emergencyContact: e.target.value }))
              }
              placeholder="Emergency contact"
              className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
            />
            <input
              value={form.dateOfBirth}
              onChange={(e) =>
                setForm((p) => ({ ...p, dateOfBirth: e.target.value }))
              }
              type="date"
              className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
            />
            <Button className="rounded-2xl" disabled={isPending}>
              {isPending ? "Saving..." : profile ? "Update Profile" : "Save Profile"}
            </Button>
          </form>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white">Quick Stats</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Attendance Rate
              </div>
              <div className="mt-2 text-3xl font-semibold text-white">
                {stats.attendancePercent}%
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400/80"
                  style={{ width: `${stats.attendancePercent}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Confirmed
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {stats.confirmedCount} rehearsals
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Total Rehearsals
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {stats.totalRehearsals}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white">Attendance Trend</h2>
          <p className="mt-2 text-sm text-white/60">
            Monthly attendance percentage (confirmed).
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Last 8 months</span>
              <span>Attendance sparkline</span>
            </div>
            <div className="mt-3 h-16 w-full">
              {stats.monthlyTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-white/50">
                  No data
                </div>
              ) : (
                <svg viewBox="0 0 120 40" className="h-full w-full">
                  <defs>
                    <linearGradient id="spark" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#spark)"
                    strokeWidth="2.5"
                    points={stats.monthlyTrend
                      .map((m, idx) => {
                        const x = (idx / Math.max(stats.monthlyTrend.length - 1, 1)) * 118 + 1;
                        const y = 38 - (m.percent / 100) * 34;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                  {stats.monthlyTrend.map((m, idx) => {
                    const x = (idx / Math.max(stats.monthlyTrend.length - 1, 1)) * 118 + 1;
                    const y = 38 - (m.percent / 100) * 34;
                    return <circle key={m.label} cx={x} cy={y} r="2.5" fill="#e2e8f0" />;
                  })}
                </svg>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {stats.monthlyTrend.length === 0 ? (
              <p className="text-sm text-white/60">No attendance data yet.</p>
            ) : (
              stats.monthlyTrend.map((m) => (
                <div key={m.label} className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{m.label}</span>
                    <span>
                      {m.attended}/{m.total} ({m.percent}%)
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-sky-400/80"
                      style={{ width: `${m.percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-emerald-400/80"
                      style={{ width: `${m.percent}%` }}
                    />
                    <div
                      className="h-full bg-red-400/50"
                      style={{ width: `${100 - m.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white">Admin Updates</h2>
          <div className="mt-4 grid gap-3">
            {notices.length === 0 ? (
              <p className="text-sm text-white/60">No updates yet.</p>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{n.title}</p>
                  <p className="mt-2 text-sm text-white/70">{n.body}</p>
                  {n.attachmentUrl ? (
                    <a
                      href={n.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                    >
                      View attachment
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Rehearsal Attendance</h2>
            <p className="mt-1 text-sm text-white/60">
              Mark yourself present. Admin confirmation is required.
            </p>
          </div>
          <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
            {attendance.length} marked
          </Badge>
        </div>
        <div className="mt-6 grid gap-3">
          {sortedRehearsals.length === 0 ? (
            <p className="text-sm text-white/60">No rehearsals scheduled yet.</p>
          ) : (
            sortedRehearsals.map((r) => {
              const record = attendanceMap.get(r.id);
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-white">{r.title}</p>
                      <p className="text-xs text-white/60">
                        {new Date(r.startsAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {record ? (
                        record.confirmedAt ? (
                          <Badge className="rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20">
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge className="rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20">
                            Pending
                          </Badge>
                        )
                      ) : (
                        <Badge className="rounded-full bg-white/10 text-white/70 hover:bg-white/10">
                          Not marked
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => markPresent(r.id)}
                        disabled={isPending || Boolean(record)}
                      >
                        {record ? "Marked" : "Mark Present"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
