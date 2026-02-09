"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteUserAction, updateUserAction } from "../actions";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "ADMIN";
  isChorister: boolean;
  choristerVerified: boolean;
  adminNote: string | null;
  createdAt: Date;
};

export default function AdminUsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingRole, setEditingRole] = useState<"USER" | "ADMIN">("USER");
  const [editingChorister, setEditingChorister] = useState(false);
  const [editingVerified, setEditingVerified] = useState(false);
  const [editingNote, setEditingNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, query]);

  function beginEdit(u: UserRow) {
    setEditingId(u.id);
    setEditingName(u.name ?? "");
    setEditingRole(u.role);
    setEditingChorister(Boolean(u.isChorister));
    setEditingVerified(Boolean(u.choristerVerified));
    setEditingNote(u.adminNote ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingRole("USER");
    setEditingChorister(false);
    setEditingVerified(false);
    setEditingNote("");
  }

  function saveEdit() {
    if (!editingId) return;
    startTransition(async () => {
      const res = await updateUserAction({
        id: editingId,
        name: editingName,
        role: editingRole,
        isChorister: editingChorister,
        choristerVerified: editingVerified,
        adminNote: editingNote,
      });
      if (!res.ok) return;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? {
                ...u,
                name: editingName,
                role: editingRole,
                isChorister: editingChorister,
                choristerVerified: editingChorister ? editingVerified : false,
                adminNote: editingNote.trim() || null,
              }
            : u
        )
      );
      cancelEdit();
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteUserAction({ id });
      if (!res.ok) return;
      setUsers((prev) => prev.filter((u) => u.id !== id));
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="w-full md:w-80 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
        />
        <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
          Total: {filtered.length}
        </Badge>
      </div>

      <div className="mt-6 grid gap-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-white/60">No users found.</p>
        ) : (
          filtered.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-white">
                    {u.name ?? "Unnamed user"}
                  </p>
                  <p className="text-xs text-white/70">{u.email ?? "-"}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                    {u.role}
                  </Badge>
                  {u.isChorister ? (
                    <Badge className="rounded-full bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20">
                      Chorister
                    </Badge>
                  ) : null}
                  {u.isChorister && u.choristerVerified ? (
                    <Badge className="rounded-full bg-sky-500/15 text-sky-100 hover:bg-sky-500/20">
                      Verified
                    </Badge>
                  ) : u.isChorister ? (
                    <Badge className="rounded-full bg-amber-500/15 text-amber-100 hover:bg-amber-500/20">
                      Pending
                    </Badge>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                    onClick={() => beginEdit(u)}
                    disabled={isPending}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 sm:w-auto"
                    onClick={() => remove(u.id)}
                    disabled={isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {editingId === u.id ? (
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="Full name"
                    className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
                  />
                  <select
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value as "USER" | "ADMIN")}
                    className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/85 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={editingChorister}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setEditingChorister(next);
                        if (!next) setEditingVerified(false);
                      }}
                      className="h-4 w-4 accent-white"
                    />
                    Chorister
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/85 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={editingVerified}
                      onChange={(e) => setEditingVerified(e.target.checked)}
                      className="h-4 w-4 accent-white"
                      disabled={!editingChorister}
                    />
                    Verified chorister
                  </label>
                  <textarea
                    value={editingNote}
                    onChange={(e) => setEditingNote(e.target.value)}
                    placeholder="Admin note for this chorister (visible to them)"
                    rows={4}
                    className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-white/25 md:col-span-2"
                  />

                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    <Button
                      type="button"
                      className="rounded-2xl"
                      onClick={saveEdit}
                      disabled={isPending}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                      onClick={cancelEdit}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
