"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { auditionSchema, type AuditionInput } from "@/lib/audition-schema";
import { submitAuditionAction } from "../actions";
import { Button } from "@/components/ui/button";

const categories = [
  { value: "SINGER", label: "Singer (Soprano/Alto/Tenor/Bass)" },
  { value: "INSTRUMENTALIST", label: "Instrumentalist" },
  { value: "PRODUCTION", label: "Production / Media / Graphics" },
] as const;

export default function AuditionForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<AuditionInput>({
    resolver: zodResolver(auditionSchema),
    defaultValues: {
      category: "SINGER",
      canSightRead: false,
      portfolioLink: "",
    },
    mode: "onTouched",
  });

  const category = form.watch("category");

  const title = useMemo(() => {
    if (category === "SINGER") return "Singer Details";
    if (category === "INSTRUMENTALIST") return "Instrument Details";
    return "Production Details";
  }, [category]);

  async function onSubmit(values: AuditionInput) {
    setServerError(null);
    const res = await submitAuditionAction(values);

    if (!res.ok) {
      setServerError(res.error);
      return;
    }

    setSuccess(true);
    form.reset({ category: "SINGER", canSightRead: false, portfolioLink: "" });
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
        <h2 className="text-2xl font-semibold text-white">Submitted 🎉</h2>
        <p className="mt-2 text-white/70">
          Your audition application has been received. We’ll contact you via email/phone.
        </p>

        <Button
          className="mt-6 rounded-2xl"
          onClick={() => setSuccess(false)}
        >
          Submit another response
        </Button>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10"
    >
      <h2 className="text-2xl font-semibold text-white">Register</h2>
      <p className="mt-2 text-sm text-white/70">
        Fill your details carefully. We’ll reach out with next steps.
      </p>

      {serverError ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {serverError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {/* BASIC INFO */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-white/70">Full name</label>
            <input
              {...register("fullName")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="Your full name"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-200">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/70">Phone</label>
            <input
              {...register("phone")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="e.g. 080..."
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-200">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/70">Email</label>
            <input
              {...register("email")}
              type="email"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-200">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/70">City (optional)</label>
            <input
              {...register("city")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
              placeholder="Abuja"
            />
          </div>
        </div>

        {/* CATEGORY */}
        <div>
          <label className="text-xs text-white/70">Category</label>
          <select
            {...register("category")}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* CATEGORY SECTION */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-sm font-semibold text-white">{title}</p>

          {/* SINGER */}
          {category === "SINGER" && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-white/70">Voice part</label>
                <select
                  {...register("voicePart")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
                >
                  <option value="">Select</option>
                  <option value="SOPRANO">Soprano</option>
                  <option value="ALTO">Alto</option>
                  <option value="TENOR">Tenor</option>
                  <option value="BASS">Bass</option>
                </select>
                {errors.voicePart && (
                  <p className="mt-1 text-xs text-red-200">{errors.voicePart.message as any}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-white/70">Audition song (optional)</label>
                <input
                  {...register("auditionSong")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
                  placeholder="Song title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-white/70">Experience (optional)</label>
                <textarea
                  {...register("singingExperience")}
                  className="mt-1 min-h-22.5 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
                  placeholder="Tell us briefly about your choir/singing experience..."
                />
              </div>
            </div>
          )}

          {/* INSTRUMENTALIST */}
          {category === "INSTRUMENTALIST" && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-white/70">Instrument</label>
                <input
                  {...register("instrument")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
                  placeholder="Keyboard, Drums, Violin..."
                />
                {errors.instrument && (
                  <p className="mt-1 text-xs text-red-200">{errors.instrument.message as any}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-white/70">Skill level (optional)</label>
                <select
                  {...register("instrumentLevel")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
                >
                  <option value="">Select</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <label className="mt-2 flex items-center gap-2 text-sm text-white/80 md:col-span-2">
                <input
                  type="checkbox"
                  {...register("canSightRead")}
                  className="h-4 w-4 accent-white"
                />
                I can sight-read (optional)
              </label>
            </div>
          )}

          {/* PRODUCTION */}
          {category === "PRODUCTION" && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-white/70">Role</label>
                <select
                  {...register("productionRole")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
                >
                  <option value="">Select</option>
                  <option value="MUSIC_PRODUCER">Music Producer</option>
                  <option value="CONTENT_CREATOR">Content Creator</option>
                  <option value="MEDIA">Media / Videography</option>
                  <option value="GRAPHICS_DESIGNER">Graphics Designer</option>
                  <option value="SOUND">Sound Engineer</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.productionRole && (
                  <p className="mt-1 text-xs text-red-200">{errors.productionRole.message as any}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-white/70">Portfolio link (optional)</label>
                <input
                  {...register("portfolioLink")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
                  placeholder="https://..."
                />
                {errors.portfolioLink && (
                  <p className="mt-1 text-xs text-red-200">{errors.portfolioLink.message as any}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* NOTES */}
        <div>
          <label className="text-xs text-white/70">Notes (optional)</label>
          <textarea
            {...register("notes")}
            className="mt-1 min-h-22.5 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-white/25"
            placeholder="Anything else you want us to know?"
          />
        </div>

        <Button
          className="group relative overflow-hidden rounded-2xl border border-amber-200/20 bg-linear-to-r from-amber-200 via-yellow-300 to-amber-500 px-6 py-6 text-base font-semibold text-black shadow-[0_10px_30px_rgba(245,158,11,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(245,158,11,0.45)] focus-visible:ring-2 focus-visible:ring-amber-200/60"
          disabled={isSubmitting}
        >
          <span className="relative z-10">
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </span>
          <span className="absolute -right-16 top-0 h-full w-24 rotate-12 bg-white/30 blur-2xl transition group-hover:-right-4" />
        </Button>

        <p className="text-xs text-white/50">
          If you don’t get a response quickly, feel free to reach out via phone/email.
        </p>
      </div>
    </form>
  );
}
