"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { auditionSchema, type AuditionInput } from "@/lib/audition-schema";
import { submitAuditionAction } from "../actions";

const categories = [
  { value: "SINGER", label: "Singer (Soprano/Alto/Tenor/Bass)" },
  { value: "INSTRUMENTALIST", label: "Instrumentalist" },
  { value: "PRODUCTION", label: "Production / Media / Graphics" },
] as const;

const inputClass =
  "mt-1 w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-amber-200/45 focus:ring-4 focus:ring-amber-200/10";
const labelClass = "text-xs font-medium uppercase tracking-[0.14em] text-white/55";
const errorClass = "mt-1 text-xs text-red-200";

export default function AuditionForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  const form = useForm<AuditionInput>({
    resolver: zodResolver(auditionSchema),
    defaultValues: {
      category: "SINGER",
      canSightRead: false,
      portfolioLink: "",
    },
    mode: "onTouched",
  });

  const category = useWatch({ control: form.control, name: "category" });

  const title =
    category === "SINGER"
      ? "Singer Details"
      : category === "INSTRUMENTALIST"
        ? "Instrument Details"
        : "Production Details";

  async function onSubmit(values: AuditionInput) {
    if (status !== "authenticated") {
      router.push("/auth/login?callbackUrl=/auditions");
      return;
    }

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
      <div className="rounded-[2rem] border border-emerald-300/18 bg-emerald-300/8 p-6 md:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-200/10 text-emerald-100">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">
          Application submitted
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-white/70">
          Your audition application has been received. We&apos;ll contact you
          through the email or phone number you provided.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button className="rounded-2xl px-5" onClick={() => setSuccess(false)}>
            Submit another response
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-white/15 bg-white/5 px-5 text-white hover:bg-white/10"
            asChild
          >
            <Link href="/auditions/status">Track status</Link>
          </Button>
        </div>
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
      className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.035))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">
            Application Form
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Register
          </h2>
          <p className="mt-2 text-sm leading-7 text-white/65">
            Fill in your details carefully. We&apos;ll reach out with next steps.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold text-white/70">
          Account required
        </span>
      </div>

      {serverError ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {serverError}
        </div>
      ) : null}

      <div className="mt-7 grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Full name</label>
            <input
              {...register("fullName")}
              className={inputClass}
              placeholder="Your full name"
              autoComplete="name"
            />
            {errors.fullName ? (
              <p className={errorClass}>{errors.fullName.message}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass}>Phone</label>
            <input
              {...register("phone")}
              className={inputClass}
              placeholder="e.g. 080..."
              autoComplete="tel"
            />
            {errors.phone ? (
              <p className={errorClass}>{errors.phone.message}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              {...register("email")}
              type="email"
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email ? (
              <p className={errorClass}>{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass}>City (optional)</label>
            <input
              {...register("city")}
              className={inputClass}
              placeholder="Abuja"
              autoComplete="address-level2"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select {...register("category")} className={inputClass}>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
          <p className="text-sm font-semibold text-white">{title}</p>

          {category === "SINGER" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Voice part</label>
                <select {...register("voicePart")} className={inputClass}>
                  <option value="">Select</option>
                  <option value="SOPRANO">Soprano</option>
                  <option value="ALTO">Alto</option>
                  <option value="TENOR">Tenor</option>
                  <option value="BASS">Bass</option>
                </select>
                {errors.voicePart ? (
                  <p className={errorClass}>
                    {String(errors.voicePart.message ?? "")}
                  </p>
                ) : null}
              </div>

              <div>
                <label className={labelClass}>Audition song (optional)</label>
                <input
                  {...register("auditionSong")}
                  className={inputClass}
                  placeholder="Song title"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Experience (optional)</label>
                <textarea
                  {...register("singingExperience")}
                  className={`${inputClass} min-h-28 resize-y`}
                  placeholder="Tell us briefly about your choir or singing experience."
                />
              </div>
            </div>
          ) : null}

          {category === "INSTRUMENTALIST" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Instrument</label>
                <input
                  {...register("instrument")}
                  className={inputClass}
                  placeholder="Keyboard, drums, violin..."
                />
                {errors.instrument ? (
                  <p className={errorClass}>
                    {String(errors.instrument.message ?? "")}
                  </p>
                ) : null}
              </div>

              <div>
                <label className={labelClass}>Skill level (optional)</label>
                <select {...register("instrumentLevel")} className={inputClass}>
                  <option value="">Select</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/80 md:col-span-2">
                <input
                  type="checkbox"
                  {...register("canSightRead")}
                  className="h-4 w-4 accent-amber-300"
                />
                I can sight-read.
              </label>
            </div>
          ) : null}

          {category === "PRODUCTION" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Role</label>
                <select {...register("productionRole")} className={inputClass}>
                  <option value="">Select</option>
                  <option value="MUSIC_PRODUCER">Music Producer</option>
                  <option value="CONTENT_CREATOR">Content Creator</option>
                  <option value="MEDIA">Media / Videography</option>
                  <option value="GRAPHICS_DESIGNER">Graphics Designer</option>
                  <option value="SOUND">Sound Engineer</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.productionRole ? (
                  <p className={errorClass}>
                    {String(errors.productionRole.message ?? "")}
                  </p>
                ) : null}
              </div>

              <div>
                <label className={labelClass}>Portfolio link (optional)</label>
                <input
                  {...register("portfolioLink")}
                  className={inputClass}
                  placeholder="https://..."
                />
                {errors.portfolioLink ? (
                  <p className={errorClass}>
                    {String(errors.portfolioLink.message ?? "")}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            {...register("notes")}
            className={`${inputClass} min-h-28 resize-y`}
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

        <p className="text-xs leading-6 text-white/52">
          By submitting, you agree that your details may be used to contact you
          about the audition.
        </p>
      </div>
    </form>
  );
}
