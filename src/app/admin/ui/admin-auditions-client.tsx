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
import { ChevronDown, Download } from "lucide-react";
import { updateAuditionStatusAction } from "../actions.ts";

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

const statusOptions = ["PENDING", "SHORTLISTED", "ACCEPTED", "REJECTED"] as const;
const categoryOptions = ["ALL", "SINGER", "INSTRUMENTALIST", "PRODUCTION"] as const;

function statusBadge(status: Row["status"]) {
  const base = "rounded-full bg-white/10 text-white hover:bg-white/10";
  if (status === "ACCEPTED") return <Badge className={base}>ACCEPTED</Badge>;
  if (status === "REJECTED") return <Badge className={base}>REJECTED</Badge>;
  if (status === "SHORTLISTED") return <Badge className={base}>SHORTLISTED</Badge>;
  return <Badge className={base}>PENDING</Badge>;
}

export default function AdminAuditionsClient({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | Row["status"]>("ALL");
  const [categoryFilter, setCategoryFilter] =
    useState<(typeof categoryOptions)[number]>("ALL");
  const [q, setQ] = useState("");
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-8">
      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full md:w-80 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
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
            onChange={(e) => setCategoryFilter(e.target.value as any)}
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
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
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
