"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { updateProfileAction } from "../actions";

type ProfileFormProps = {
  name: string;
  email: string;
  image: string | null;
};

export default function ProfileForm({ name, email, image }: ProfileFormProps) {
  const { update } = useSession();
  const [form, setForm] = useState({ name, image: image ?? "" });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function getSignature() {
    const res = await fetch("/api/profile/cloudinary-signature");
    if (!res.ok) throw new Error("Failed to get signature");
    return res.json();
  }

  async function upload(file: File) {
    const sig = await getSignature();
    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);

    const up = await fetch(url, { method: "POST", body: formData });
    if (!up.ok) throw new Error("Upload failed");
    return up.json();
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const uploaded = await upload(file);
      const imageUrl = uploaded.secure_url as string;
      setForm((p) => ({ ...p, image: imageUrl }));
      setMessage("Image uploaded. Click save to update your profile.");
    } catch (err: any) {
      setMessage(err?.message ?? "Upload error");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateProfileAction(form);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      await update({
        user: { name: form.name, image: form.image || undefined },
      });
      setMessage("Profile updated successfully.");
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
      <h1 className="text-2xl font-semibold text-white">Profile</h1>
      <p className="mt-2 text-sm text-white/70">
        Update your display name and avatar. Email is read-only.
      </p>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white/80">
          {message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        <div>
          <label className="text-xs text-white/70">Full name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="text-xs text-white/70">Email</label>
          <input
            value={email}
            readOnly
            className="mt-1 w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/40 p-3 text-white/70"
          />
        </div>

        <div>
          <label className="text-xs text-white/70">Profile photo</label>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {form.image ? (
                <img
                  src={form.image}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
                disabled={uploading}
              />
              <span className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
                {uploading ? "Uploading..." : "Upload image"}
              </span>
            </label>
          </div>
        </div>

        <Button
          className="rounded-2xl"
          disabled={isPending || uploading}
          onClick={submit}
          type="button"
        >
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
