"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BellRing,
  CalendarClock,
  ChevronRight,
  CircleCheckBig,
  CircleX,
  Download,
  FileText,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { markAttendanceAction, upsertChoristerProfileAction } from "../actions";

type Profile = {
  id: string;
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
  status: "PRESENT" | "ABSENT";
  confirmedAt: string | null;
  rehearsal: {
    id: string;
    title: string;
    startsAt: string;
  };
};

type Sheet = {
  id: string;
  title: string | null;
  fileName: string;
  audience: "ALL_USERS" | "CHORISTERS_ONLY";
  createdAt: string;
  downloadUrl: string;
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
  sheets: Sheet[];
  stats: {
    totalRehearsals: number;
    confirmedCount: number;
    attendancePercent: number;
    monthlyTrend: { label: string; total: number; attended: number; percent: number }[];
  };
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function audienceLabel(audience: Sheet["audience"]) {
  return audience === "CHORISTERS_ONLY" ? "Choristers only" : "All signed-in users";
}

function attendanceRecordLabel(record: Attendance | undefined) {
  if (!record) return "Ready to mark present or absent";

  const statusLabel = record.status === "ABSENT" ? "Absence" : "Presence";
  if (record.confirmedAt) {
    return `${statusLabel} approved on ${formatDate(record.confirmedAt)}`;
  }

  return `${statusLabel} submitted and pending approval`;
}

async function getPassportSignature() {
  const res = await fetch("/api/profile/cloudinary-signature?folderSuffix=passport-images");
  if (!res.ok) throw new Error("Failed to get upload signature");
  return res.json();
}

export default function ChoristerClient({
  user,
  profile,
  notices,
  rehearsals,
  attendance,
  sheets,
  stats,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [uploadingPassport, setUploadingPassport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
    voicePart: profile?.voicePart ?? "",
    dateOfBirth: profile?.dateOfBirth
      ? new Date(profile.dateOfBirth).toISOString().slice(0, 10)
      : "",
    gender: profile?.gender ?? "",
    maritalStatus: profile?.maritalStatus ?? "",
    emergencyContact: profile?.emergencyContact ?? "",
    stateOfOrigin: profile?.stateOfOrigin ?? "",
    currentParish: profile?.currentParish ?? "",
    socialHandle: profile?.socialHandle ?? "",
    passportImageUrl: profile?.passportImageUrl ?? "",
  });

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendance.forEach((record) => map.set(record.rehearsalId, record));
    return map;
  }, [attendance]);

  const sortedRehearsals = useMemo(
    () =>
      [...rehearsals].sort(
        (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
      ),
    [rehearsals]
  );

  const nextRehearsal = useMemo(
    () =>
      [...rehearsals]
        .filter((rehearsal) => new Date(rehearsal.startsAt).getTime() >= Date.now())
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        )[0] ?? null,
    [rehearsals]
  );

  const profileCompletion = useMemo(() => {
    const values = [
      form.phone,
      form.address,
      form.voicePart,
      form.dateOfBirth,
      form.gender,
      form.maritalStatus,
      form.emergencyContact,
      form.stateOfOrigin,
      form.currentParish,
      form.passportImageUrl,
    ];
    return Math.round((values.filter((value) => value.trim()).length / values.length) * 100);
  }, [form]);

  async function uploadPassport(file: File) {
    const sig = await getPassportSignature();
    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);

    const up = await fetch(url, { method: "POST", body: formData });
    if (!up.ok) throw new Error("Passport upload failed");
    return up.json();
  }

  function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const res = await upsertChoristerProfileAction(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  function markAttendance(rehearsalId: string, status: Attendance["status"]) {
    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const res = await markAttendanceAction({ rehearsalId, status });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  async function onPickPassportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPassport(true);
    setError(null);
    setStatusMessage(null);
    try {
      const uploaded = await uploadPassport(file);
      const imageUrl = uploaded.secure_url as string;
      setForm((current) => ({ ...current, passportImageUrl: imageUrl }));
      setStatusMessage("Passport image uploaded. Save profile to store it.");
    } catch (err) {
      setError(getErrorMessage(err, "Passport upload failed"));
    } finally {
      setUploadingPassport(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.2),transparent_26%),linear-gradient(145deg,rgba(10,18,36,0.96),rgba(3,7,18,0.92))] p-6 shadow-[0_28px_80px_rgba(2,6,23,0.5)] md:p-8 xl:p-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)]" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-200/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-100/90">
              <Sparkles className="h-3.5 w-3.5" />
              Choristers Sanctuary
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl xl:text-6xl">
              A private world built for the choir.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/78 sm:text-base">
              Your portal now feels like a dedicated chamber for members: profile, notices,
              attendance, and progress in one curated environment.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <span className="rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-medium text-white/90">
                Welcome, {user.name ?? "Chorister"}
              </span>
              <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
                {stats.confirmedCount} of {stats.totalRehearsals} rehearsals present
              </span>
            </div>

            {user.adminNote ? (
              <div className="mt-6 rounded-[1.5rem] border border-amber-300/18 bg-amber-300/10 p-5 text-sm text-amber-50">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/80">
                  Director&apos;s Note
                </div>
                <p className="mt-3 leading-7">{user.adminNote}</p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-black/32 p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                <BellRing className="h-3.5 w-3.5" />
                Portal Pulse
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[1.5rem] border border-cyan-300/12 bg-cyan-300/8 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">
                    Attendance Rate
                  </div>
                  <div className="mt-2 text-4xl font-semibold text-white">
                    {stats.attendancePercent}%
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                      style={{ width: `${stats.attendancePercent}%` }}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/45">
                      <span>Profile</span>
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">{profileCompletion}%</div>
                    <div className="mt-1 text-sm text-white/55">completion</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/45">
                      <span>Present</span>
                      <CircleCheckBig className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">{stats.confirmedCount}</div>
                    <div className="mt-1 text-sm text-white/55">present approvals</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-black/32 p-5 backdrop-blur-md">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                Next Call Time
              </div>
              <div className="mt-3 text-2xl font-semibold text-white">
                {nextRehearsal ? nextRehearsal.title : "No upcoming rehearsal"}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {nextRehearsal
                  ? formatDateTime(nextRehearsal.startsAt)
                  : "The rehearsal board will update when the next session is scheduled."}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-[1.5rem] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-[1.5rem] border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <motion.div variants={container} initial="hidden" animate="show" className="min-w-0 space-y-6">
          <motion.section
            variants={item}
            id="identity-studio"
            className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,31,0.92),rgba(4,8,18,0.96))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.36)] md:p-8"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                  Identity Studio
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Shape your chorister record</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                  Keep the details leadership relies on updated and ready.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                {profileCompletion}% complete
              </div>
            </div>

            <form onSubmit={saveProfile} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={form.phone}
                  onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                  placeholder="Phone number"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
                <input
                  value={form.voicePart}
                  onChange={(e) => setForm((current) => ({ ...current, voicePart: e.target.value }))}
                  placeholder="Voice part"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
                <select
                  value={form.gender}
                  onChange={(e) => setForm((current) => ({ ...current, gender: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <select
                  value={form.maritalStatus}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, maritalStatus: e.target.value }))
                  }
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Marital status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Engaged">Engaged</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Divorced">Divorced</option>
                </select>
                <input
                  value={form.stateOfOrigin}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, stateOfOrigin: e.target.value }))
                  }
                  placeholder="State of origin"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
                <input
                  value={form.currentParish}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, currentParish: e.target.value }))
                  }
                  placeholder="Current parish"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <input
                value={form.address}
                onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                placeholder="Address"
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
              />
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <input
                  value={form.emergencyContact}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, emergencyContact: e.target.value }))
                  }
                  placeholder="Emergency contact"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
                <input
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, dateOfBirth: e.target.value }))
                  }
                  type="date"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <input
                value={form.socialHandle}
                onChange={(e) =>
                  setForm((current) => ({ ...current, socialHandle: e.target.value }))
                }
                placeholder="Social media handle (optional)"
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
              />
              <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                      Passport Image
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      Upload a clear passport photograph for choir records.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onPickPassportFile}
                      className="hidden"
                      disabled={uploadingPassport}
                    />
                    <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
                      {uploadingPassport ? "Uploading..." : "Upload Passport"}
                    </span>
                  </label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-28 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/40">
                    {form.passportImageUrl ? (
                      <Image
                        src={form.passportImageUrl}
                        alt="Passport"
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 text-sm text-white/60">
                    {form.passportImageUrl ? (
                      <p className="break-all">Stored image ready to save.</p>
                    ) : (
                      <p>No passport image uploaded yet.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-white/62">
                  Save changes directly to your chorister profile.
                </p>
                <Button className="rounded-full px-6" disabled={isPending || uploadingPassport}>
                  {isPending ? "Saving..." : profile ? "Update Profile" : "Save Profile"}
                </Button>
              </div>
            </form>
          </motion.section>

          <motion.section
            variants={item}
            id="rehearsal-deck"
            className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,27,0.95),rgba(5,8,18,0.98))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.36)] md:p-8"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                  Rehearsal Deck
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Mark presence or absence with clarity
                </h2>
              </div>
              <Badge className="rounded-full bg-white/10 px-4 py-1.5 text-white hover:bg-white/10">
                {attendance.length} marked
              </Badge>
            </div>

            <div className="mt-6 grid gap-3">
              {sortedRehearsals.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-sm text-white/60">
                  No rehearsals scheduled yet.
                </div>
              ) : (
                sortedRehearsals.map((rehearsal) => {
                  const record = attendanceMap.get(rehearsal.id);
                  return (
                    <div
                      key={rehearsal.id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/28 p-4 backdrop-blur-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-white">{rehearsal.title}</p>
                          <p className="mt-1 text-sm text-white/60">{formatDateTime(rehearsal.startsAt)}</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
                            {attendanceRecordLabel(record)}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              className="rounded-full border-emerald-300/20 bg-emerald-300/10 px-5 text-emerald-100 hover:bg-emerald-300/15"
                              onClick={() => markAttendance(rehearsal.id, "PRESENT")}
                              disabled={
                                isPending ||
                                Boolean(record?.confirmedAt) ||
                                record?.status === "PRESENT"
                              }
                            >
                              <CircleCheckBig className="h-4 w-4" />
                              {record?.status === "PRESENT" ? "Present marked" : "Mark Present"}
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-full border-rose-300/20 bg-rose-300/10 px-5 text-rose-100 hover:bg-rose-300/15"
                              onClick={() => markAttendance(rehearsal.id, "ABSENT")}
                              disabled={
                                isPending ||
                                Boolean(record?.confirmedAt) ||
                                record?.status === "ABSENT"
                              }
                            >
                              <CircleX className="h-4 w-4" />
                              {record?.status === "ABSENT" ? "Absent marked" : "Mark Absent"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.section>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.section
            variants={item}
            className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,16,31,0.94),rgba(4,8,18,0.96))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.36)] md:p-8"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              <CalendarClock className="h-3.5 w-3.5" />
              Trend Ledger
            </div>
            <div className="mt-5 grid gap-3">
              {stats.monthlyTrend.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 text-sm text-white/60">
                  No attendance trend data yet.
                </div>
              ) : (
                stats.monthlyTrend.map((month) => (
                  <div
                    key={month.label}
                    className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-white">{month.label}</span>
                      <span className="text-white/60">
                        {month.attended}/{month.total} sessions
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300"
                        style={{ width: `${month.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.section>

          <motion.section
            variants={item}
            id="score-vault"
            className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,16,31,0.94),rgba(4,8,18,0.96))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.36)] md:p-8"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              <FileText className="h-3.5 w-3.5" />
              Score Vault
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">Music sheets for your section</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Download the latest scores leadership has released to members.
            </p>

            <div className="mt-5 grid gap-3">
              {sheets.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 text-sm text-white/60">
                  No music sheets have been published for you yet.
                </div>
              ) : (
                sheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
                          {audienceLabel(sheet.audience)}
                        </div>
                        <p className="mt-3 text-base font-semibold text-white">
                          {sheet.title || sheet.fileName}
                        </p>
                        <p className="mt-1 break-all text-sm text-white/58">{sheet.fileName}</p>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/42">
                          Added {formatDate(sheet.createdAt)}
                        </p>
                      </div>
                      <a
                        href={sheet.downloadUrl}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/84 transition hover:bg-white/10"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.section>

          <motion.section
            variants={item}
            id="broadcast-board"
            className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,27,0.95),rgba(5,8,18,0.98))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.36)] md:p-8"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              <BellRing className="h-3.5 w-3.5" />
              Broadcast Board
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">Notes from leadership</h2>

            <div className="mt-5 grid gap-3">
              {notices.length === 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 text-sm text-white/60">
                  No updates yet.
                </div>
              ) : (
                notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4"
                  >
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                      {formatDate(notice.createdAt)}
                    </div>
                    <p className="mt-2 text-base font-semibold text-white">{notice.title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">{notice.body}</p>
                    {notice.attachmentUrl ? (
                      <a
                        href={notice.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/84 transition hover:bg-white/10"
                      >
                        Open attachment
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
