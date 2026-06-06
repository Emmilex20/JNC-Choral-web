"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarClock, ChevronDown, Download, MapPin, Save } from "lucide-react";
import {
  updateAuditionSettingAction,
  updateAuditionStatusAction,
} from "../actions";

type Row = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string | null;
  category: "SINGER" | "INSTRUMENTALIST" | "PRODUCTION";
  voicePart: "SOPRANO" | "ALTO" | "TENOR" | "BASS" | null;
  auditionSong: string | null;
  instrument: string | null;
  instrumentLevel: string | null;
  canSightRead: boolean | null;
  productionRole: string | null;
  portfolioLink: string | null;
  notes: string | null;
  status: "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
};

type AuditionSettingRow = {
  startsAt: string;
  venue: string;
  note: string;
  anticipationText: string;
};

const statusOptions = ["PENDING", "SHORTLISTED", "ACCEPTED", "REJECTED"] as const;
const statusFilterOptions = ["ALL", ...statusOptions] as const;
const categoryOptions = ["ALL", "SINGER", "INSTRUMENTALIST", "PRODUCTION"] as const;

type StatusFilter = (typeof statusFilterOptions)[number];
type CategoryFilter = (typeof categoryOptions)[number];

function isStatusFilter(value: string): value is StatusFilter {
  return statusFilterOptions.some((option) => option === value);
}

function isCategoryFilter(value: string): value is CategoryFilter {
  return categoryOptions.some((option) => option === value);
}

function toLocalInputValue(value: string) {
  if (!value) return "";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatSchedule(value: string) {
  if (!value) return "No active audition date";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No active audition date";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
}

function statusBadge(status: Row["status"]) {
  const base = "rounded-full bg-white/10 text-white hover:bg-white/10";
  if (status === "ACCEPTED") return <Badge className={base}>ACCEPTED</Badge>;
  if (status === "REJECTED") return <Badge className={base}>REJECTED</Badge>;
  if (status === "SHORTLISTED") return <Badge className={base}>SHORTLISTED</Badge>;
  return <Badge className={base}>PENDING</Badge>;
}

export default function AdminAuditionsClient({
  initialRows,
  initialSetting,
}: {
  initialRows: Row[];
  initialSetting: AuditionSettingRow;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [q, setQ] = useState("");
  const [setting, setSetting] = useState({
    startsAt: toLocalInputValue(initialSetting.startsAt),
    venue: initialSetting.venue,
    note: initialSetting.note,
    anticipationText: initialSetting.anticipationText,
  });
  const [settingError, setSettingError] = useState<string | null>(null);
  const [settingMessage, setSettingMessage] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();

  const settingIsPast = setting.startsAt
    ? new Date(setting.startsAt).getTime() <= nowMs
    : true;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !query ||
        r.fullName.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.phone.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "ALL" ? true : r.status === statusFilter;
      const matchesCategory =
        categoryFilter === "ALL" ? true : r.category === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [rows, q, statusFilter, categoryFilter]);

  function exportCsv() {
    // Uses our API route (admin-only by middleware)
    window.location.href = "/api/admin/auditions/export";
  }

  function updateStatus(id: string, nextStatus: Row["status"]) {
    startTransition(async () => {
      const res = await updateAuditionStatusAction({ id, status: nextStatus });
      if (!res.ok) return;

      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
      );
    });
  }

  function saveSetting() {
    setSettingError(null);
    setSettingMessage(null);

    startTransition(async () => {
      const res = await updateAuditionSettingAction(setting);
      if (!res.ok) {
        setSettingError(res.error);
        return;
      }

      setSetting({
        startsAt: toLocalInputValue(res.setting.startsAt),
        venue: res.setting.venue,
        note: res.setting.note,
        anticipationText: res.setting.anticipationText,
      });
      setSettingMessage("Audition schedule updated.");
    });
  }

  return (
    <div className="admin-module rounded-3xl border border-white/10 bg-white/5 p-5 md:p-8">
      <div className="grid gap-5 rounded-[1.75rem] border border-white/10 bg-black/25 p-5 lg:grid-cols-[1fr_0.85fr] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">
            Public Audition Schedule
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Date, time, and venue
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            This controls the schedule card on the public auditions page. If the
            date has passed, visitors will see the anticipation message instead
            of an old date.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/70">Audition date and time</label>
              <input
                type="datetime-local"
                value={setting.startsAt}
                onChange={(e) =>
                  setSetting((current) => ({
                    ...current,
                    startsAt: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
              />
            </div>
            <div>
              <label className="text-xs text-white/70">Venue</label>
              <input
                value={setting.venue}
                onChange={(e) =>
                  setSetting((current) => ({ ...current, venue: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
                placeholder="Catholic Secretariat, Durumi, Abuja"
              />
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <label className="text-xs text-white/70">Schedule note</label>
              <textarea
                value={setting.note}
                onChange={(e) =>
                  setSetting((current) => ({ ...current, note: e.target.value }))
                }
                className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
                placeholder="Come prepared with your song, instrument, or portfolio."
              />
            </div>
            <div>
              <label className="text-xs text-white/70">Anticipation text</label>
              <textarea
                value={setting.anticipationText}
                onChange={(e) =>
                  setSetting((current) => ({
                    ...current,
                    anticipationText: e.target.value,
                  }))
                }
                className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
                placeholder="Audition dates are being prepared..."
              />
            </div>
          </div>

          {settingError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {settingError}
            </div>
          ) : null}
          {settingMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              {settingMessage}
            </div>
          ) : null}

          <Button
            type="button"
            className="mt-5 w-full rounded-2xl sm:w-auto"
            onClick={saveSetting}
            disabled={isPending}
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save schedule"}
          </Button>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            Public preview
          </p>
          <div className="mt-5 grid gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-amber-100">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                  {settingIsPast ? "Anticipating" : "Next audition"}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {settingIsPast
                    ? "Next date coming soon"
                    : formatSchedule(setting.startsAt)}
                </p>
              </div>
            </div>

            {!settingIsPast && setting.venue ? (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-100">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Venue
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/76">
                    {setting.venue}
                  </p>
                </div>
              </div>
            ) : null}

            <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/70">
              {settingIsPast
                ? setting.anticipationText ||
                  "Audition dates are being prepared. Keep rehearsing and watch this space."
                : setting.note || "Come prepared, confident, and ready to grow."}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full md:w-80 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              if (isStatusFilter(e.target.value)) setStatusFilter(e.target.value);
            }}
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
          >
            <option value="ALL">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              if (isCategoryFilter(e.target.value)) setCategoryFilter(e.target.value);
            }}
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={exportCsv}
            className="w-full rounded-2xl sm:w-auto"
            variant="outline"
            disabled={isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
          Showing: <b className="text-white">{filtered.length}</b>
        </span>
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
          Total: <b className="text-white">{rows.length}</b>
        </span>
        {isPending ? (
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
            Updating...
          </span>
        ) : null}
      </div>

      {/* Table */}
      <div className="mt-6 grid gap-3 lg:hidden">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-white">{r.fullName}</div>
                  <div className="text-xs text-white/60 break-all">{r.email}</div>
                  <div className="text-xs text-white/60">{r.phone}</div>
                  {r.city ? <div className="text-xs text-white/60">{r.city}</div> : null}
                </div>
                <div className="shrink-0">{statusBadge(r.status)}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                  {r.category}
                </Badge>
                <Badge className="rounded-full bg-white/10 text-white/80 hover:bg-white/10">
                  {new Date(r.createdAt).toLocaleDateString()}
                </Badge>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                {r.category === "SINGER" ? (
                  <div className="space-y-1">
                    <div>
                      Voice: <span className="text-white">{r.voicePart ?? "-"}</span>
                    </div>
                    {r.auditionSong ? (
                      <div>
                        Song: <span className="text-white">{r.auditionSong}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {r.category === "INSTRUMENTALIST" ? (
                  <div className="space-y-1">
                    <div>
                      Instrument: <span className="text-white">{r.instrument ?? "-"}</span>
                    </div>
                    {r.instrumentLevel ? (
                      <div>
                        Level: <span className="text-white">{r.instrumentLevel}</span>
                      </div>
                    ) : null}
                    <div>
                      Sight-read:{" "}
                      <span className="text-white">{r.canSightRead ? "Yes" : "No"}</span>
                    </div>
                  </div>
                ) : null}

                {r.category === "PRODUCTION" ? (
                  <div className="space-y-1">
                    <div>
                      Role: <span className="text-white">{r.productionRole ?? "-"}</span>
                    </div>
                    {r.portfolioLink ? (
                      <a
                        className="text-white underline underline-offset-4"
                        href={r.portfolioLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Portfolio
                      </a>
                    ) : (
                      <div>Portfolio: -</div>
                    )}
                  </div>
                ) : null}

                {r.notes ? <div className="mt-2 line-clamp-3">{r.notes}</div> : null}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    disabled={isPending}
                  >
                    Change status <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="bg-black text-white border-white/10">
                  {statusOptions.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => updateStatus(r.id, s)}
                      className="cursor-pointer focus:bg-white/10"
                    >
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/60">
            No results found.
          </div>
        ) : null}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-white/10 lg:block">
        <table className="w-full min-w-245 text-left text-sm">
          <thead className="bg-black/40 text-white/80">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10 text-white/80">
            {filtered.map((r) => (
              <tr key={r.id} className="bg-black/20">
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{r.fullName}</div>
                  <div className="text-xs text-white/60">{r.email}</div>
                  <div className="text-xs text-white/60">{r.phone}</div>
                  {r.city ? (
                    <div className="text-xs text-white/60">{r.city}</div>
                  ) : null}
                </td>

                <td className="px-4 py-3">
                  <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                    {r.category}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-xs text-white/70">
                  {r.category === "SINGER" ? (
                    <div className="space-y-1">
                      <div>
                        Voice: <span className="text-white">{r.voicePart ?? "-"}</span>
                      </div>
                      {r.auditionSong ? (
                        <div>
                          Song: <span className="text-white">{r.auditionSong}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {r.category === "INSTRUMENTALIST" ? (
                    <div className="space-y-1">
                      <div>
                        Instrument: <span className="text-white">{r.instrument ?? "-"}</span>
                      </div>
                      {r.instrumentLevel ? (
                        <div>
                          Level: <span className="text-white">{r.instrumentLevel}</span>
                        </div>
                      ) : null}
                      <div>
                        Sight-read:{" "}
                        <span className="text-white">
                          {r.canSightRead ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {r.category === "PRODUCTION" ? (
                    <div className="space-y-1">
                      <div>
                        Role: <span className="text-white">{r.productionRole ?? "-"}</span>
                      </div>
                      {r.portfolioLink ? (
                        <a
                          className="text-white underline underline-offset-4"
                          href={r.portfolioLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Portfolio
                        </a>
                      ) : (
                        <div>Portfolio: -</div>
                      )}
                    </div>
                  ) : null}

                  {r.notes ? <div className="mt-2 line-clamp-2">{r.notes}</div> : null}
                </td>

                <td className="px-4 py-3 text-xs text-white/60">
                  {new Date(r.createdAt).toLocaleString()}
                </td>

                <td className="px-4 py-3">{statusBadge(r.status)}</td>

                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        disabled={isPending}
                      >
                        Change <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="bg-black text-white border-white/10">
                      {statusOptions.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => updateStatus(r.id, s)}
                          className="cursor-pointer focus:bg-white/10"
                        >
                          {s}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}

            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-white/60" colSpan={6}>
                  No results found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
