"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AuditionBanner } from "@/lib/audition-banner";
import { auditionSchema, type AuditionInput } from "@/lib/audition-schema";
import { submitAuditionAction } from "../actions";

const categories = [
  { value: "SINGER", label: "Singer (Soprano/Alto/Tenor/Bass)" },
  { value: "INSTRUMENTALIST", label: "Instrumentalist" },
  { value: "PRODUCTION", label: "Production / Media / Graphics" },
] as const;

const categoryLabel: Record<AuditionInput["category"], string> = {
  SINGER: "Singer",
  INSTRUMENTALIST: "Instrumentalist",
  PRODUCTION: "Production crew",
};

const steps = [
  { title: "About you", hint: "Your contact details" },
  { title: "Your craft", hint: "Voice, instrument or production role" },
  { title: "Review", hint: "Check and submit" },
] as const;

const inputClass =
  "mt-1 w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-amber-200/45 focus:ring-4 focus:ring-amber-200/10 aria-[invalid=true]:border-red-400/60";
const labelClass = "text-xs font-medium uppercase tracking-[0.14em] text-white/55";
const errorClass = "mt-1 text-xs text-red-200";

const DRAFT_KEY = "jnc-audition-draft-v1";
const DEFAULTS: Partial<AuditionInput> = {
  category: "SINGER",
  canSightRead: false,
  portfolioLink: "",
};

type FieldProps = {
  label: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
};

/** Label + control + error wired together so screen readers announce them. */
function Field({ label, error, optional, className, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional ? <span className="normal-case tracking-normal"> (optional)</span> : null}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      {error ? (
        <p id={errorId} role="alert" className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function loadDraft(): { values: Partial<AuditionInput>; step: number } | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { values?: Partial<AuditionInput>; step?: number };
    if (!parsed.values || typeof parsed.values !== "object") return null;
    return { values: parsed.values, step: Math.min(Math.max(parsed.step ?? 0, 0), 2) };
  } catch {
    return null;
  }
}

function saveDraft(values: Partial<AuditionInput>, step: number) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step }));
  } catch {
    // Storage can be unavailable (private mode); the form still works.
  }
}

function clearDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export default function AuditionForm({ audition }: { audition: AuditionBanner }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; category: AuditionInput["category"] } | null>(
    null
  );
  const [step, setStep] = useState(0);
  const { status } = useSession();
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const restoredRef = useRef(false);

  const form = useForm<AuditionInput>({
    resolver: zodResolver(auditionSchema),
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });
  const {
    register,
    handleSubmit,
    trigger,
    reset,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const category = useWatch({ control, name: "category" });
  const watched = useWatch({ control });

  // Restore a draft (e.g. after being sent to log in) once, on mount.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const draft = loadDraft();
    if (draft) {
      reset({ ...DEFAULTS, ...draft.values });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(draft.step);
    }
  }, [reset]);

  // Autosave so nothing is lost if the visitor has to sign in first.
  useEffect(() => {
    if (!restoredRef.current || success) return;
    saveDraft(watched as Partial<AuditionInput>, step);
  }, [watched, step, success]);

  // Move focus to the step heading so keyboard and screen-reader users know it changed.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step, success]);

  function stepFields(): FieldPath<AuditionInput>[] {
    if (step === 0) return ["fullName", "phone", "email", "city"];
    const base: FieldPath<AuditionInput>[] = ["category"];
    if (category === "SINGER") return [...base, "voicePart", "auditionSong", "singingExperience"];
    if (category === "INSTRUMENTALIST") return [...base, "instrument", "instrumentLevel"];
    return [...base, "productionRole", "portfolioLink"];
  }

  async function goNext() {
    const ok = await trigger(stepFields());
    if (ok) setStep((s) => Math.min(s + 1, 2));
  }

  // If final validation fails on a field from an earlier step (e.g. a restored
  // draft), jump back to that step so the error is actually visible.
  function onInvalid(fieldErrors: typeof errors) {
    const stepOneFields = ["fullName", "phone", "email", "city"];
    const hasStepOneError = stepOneFields.some((f) => f in fieldErrors);
    const hasStepTwoError = Object.keys(fieldErrors).some(
      (f) => !stepOneFields.includes(f) && f !== "notes"
    );
    if (hasStepOneError) setStep(0);
    else if (hasStepTwoError) setStep(1);
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Enter on the first two steps means "next", not "submit".
    if (step < 2) {
      void goNext();
      return;
    }
    void handleSubmit(onSubmit, onInvalid)(e);
  }

  async function onSubmit(values: AuditionInput) {
    if (status !== "authenticated") {
      // The draft is already saved, so nothing is lost by signing in first.
      router.push("/auth/login?callbackUrl=/auditions");
      return;
    }

    setServerError(null);
    const res = await submitAuditionAction(values);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }

    clearDraft();
    setSuccess({ name: values.fullName, category: values.category });
    reset(DEFAULTS);
    setStep(0);
  }

  if (success) {
    return (
      <div
        role="status"
        className="rounded-[2rem] border border-emerald-300/18 bg-emerald-300/8 p-6 md:p-8"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-200/10 text-emerald-100">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 text-2xl font-semibold text-white outline-none"
        >
          Thank you, {success.name.split(" ")[0]}. Your application is in.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-white/70">
          We received your {categoryLabel[success.category].toLowerCase()} application.
        </p>

        <ol className="mt-6 grid gap-3 text-sm text-white/78">
          <li className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <span className="font-semibold text-white">1. We review it.</span> The team looks
            through every application.
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <span className="font-semibold text-white">2. We contact you.</span> Expect a call
            or email using the details you gave. Keep your phone nearby.
          </li>
          <li className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <span className="font-semibold text-white">3. You audition.</span>{" "}
            {audition.state === "upcoming"
              ? `Next auditions: ${audition.dateLabel}${audition.venue ? `, ${audition.venue}` : ""}.`
              : "Audition dates will be announced soon, and we will tell you as soon as they are set."}
          </li>
        </ol>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button className="rounded-2xl px-5" asChild>
            <Link href="/auditions/status">Track your status</Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-white/15 bg-white/5 px-5 text-white hover:bg-white/10"
            asChild
          >
            <Link href="/music-hub">Practise in the Music Hub</Link>
          </Button>
          <Button
            variant="ghost"
            className="rounded-2xl px-5 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setSuccess(null)}
          >
            Submit for someone else
          </Button>
        </div>
      </div>
    );
  }

  const values = getValues();
  const isLastStep = step === 2;

  return (
    <form
      onSubmit={handleFormSubmit}
      noValidate
      className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.035))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">
            Application Form
          </p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mt-3 text-3xl font-semibold tracking-tight text-white outline-none"
          >
            {steps[step].title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-white/65">{steps[step].hint}</p>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold text-white/70">
          Step {step + 1} of {steps.length}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Application progress"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={step + 1}
        aria-valuetext={`Step ${step + 1} of ${steps.length}: ${steps[step].title}`}
        className="mt-5 grid grid-cols-3 gap-2"
      >
        {steps.map((s, i) => (
          <div
            key={s.title}
            className={`h-1.5 rounded-full ${i <= step ? "bg-amber-300" : "bg-white/12"}`}
          />
        ))}
      </div>

      {status === "unauthenticated" ? (
        <div className="mt-5 rounded-2xl border border-amber-200/25 bg-amber-200/10 p-4 text-sm text-amber-50">
          <p>
            You need a free account to submit. You can fill this in first. We save your
            answers in this browser tab while you sign in.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-xl" asChild>
              <Link href="/auth/register?callbackUrl=/auditions">Create account</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/auth/login?callbackUrl=/auditions">Log in</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {serverError ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          {serverError}
        </div>
      ) : null}

      <div className="mt-7 grid gap-5">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" error={errors.fullName?.message}>
              {(a11y) => (
                <input
                  {...a11y}
                  {...register("fullName")}
                  className={inputClass}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              )}
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              {(a11y) => (
                <input
                  {...a11y}
                  {...register("phone")}
                  type="tel"
                  inputMode="tel"
                  className={inputClass}
                  placeholder="e.g. 080..."
                  autoComplete="tel"
                />
              )}
            </Field>
            <Field label="Email" error={errors.email?.message}>
              {(a11y) => (
                <input
                  {...a11y}
                  {...register("email")}
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              )}
            </Field>
            <Field label="City" optional error={errors.city?.message}>
              {(a11y) => (
                <input
                  {...a11y}
                  {...register("city")}
                  className={inputClass}
                  placeholder="Abuja"
                  autoComplete="address-level2"
                />
              )}
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <>
            <Field label="What would you like to join as?" error={errors.category?.message}>
              {(a11y) => (
                <select {...a11y} {...register("category")} className={inputClass}>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
              {category === "SINGER" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Voice part" error={errors.voicePart?.message as string | undefined}>
                    {(a11y) => (
                      <select {...a11y} {...register("voicePart")} className={inputClass}>
                        <option value="">Select</option>
                        <option value="SOPRANO">Soprano</option>
                        <option value="ALTO">Alto</option>
                        <option value="TENOR">Tenor</option>
                        <option value="BASS">Bass</option>
                      </select>
                    )}
                  </Field>
                  <Field label="Audition song" optional error={errors.auditionSong?.message}>
                    {(a11y) => (
                      <input
                        {...a11y}
                        {...register("auditionSong")}
                        className={inputClass}
                        placeholder="Song title"
                      />
                    )}
                  </Field>
                  <Field
                    label="Experience"
                    optional
                    className="md:col-span-2"
                    error={errors.singingExperience?.message}
                  >
                    {(a11y) => (
                      <textarea
                        {...a11y}
                        {...register("singingExperience")}
                        className={`${inputClass} min-h-28 resize-y`}
                        placeholder="Tell us briefly about your choir or singing experience."
                      />
                    )}
                  </Field>
                </div>
              ) : null}

              {category === "INSTRUMENTALIST" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Instrument" error={errors.instrument?.message as string | undefined}>
                    {(a11y) => (
                      <input
                        {...a11y}
                        {...register("instrument")}
                        className={inputClass}
                        placeholder="Keyboard, drums, violin..."
                      />
                    )}
                  </Field>
                  <Field label="Skill level" optional error={errors.instrumentLevel?.message}>
                    {(a11y) => (
                      <select {...a11y} {...register("instrumentLevel")} className={inputClass}>
                        <option value="">Select</option>
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                      </select>
                    )}
                  </Field>
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
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Role" error={errors.productionRole?.message as string | undefined}>
                    {(a11y) => (
                      <select {...a11y} {...register("productionRole")} className={inputClass}>
                        <option value="">Select</option>
                        <option value="MUSIC_PRODUCER">Music Producer</option>
                        <option value="CONTENT_CREATOR">Content Creator</option>
                        <option value="MEDIA">Media / Videography</option>
                        <option value="GRAPHICS_DESIGNER">Graphics Designer</option>
                        <option value="SOUND">Sound Engineer</option>
                        <option value="OTHER">Other</option>
                      </select>
                    )}
                  </Field>
                  <Field
                    label="Portfolio link"
                    optional
                    error={errors.portfolioLink?.message as string | undefined}
                  >
                    {(a11y) => (
                      <input
                        {...a11y}
                        {...register("portfolioLink")}
                        type="url"
                        inputMode="url"
                        className={inputClass}
                        placeholder="https://..."
                      />
                    )}
                  </Field>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <dl className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-sm sm:grid-cols-2">
              {[
                ["Name", values.fullName],
                ["Phone", values.phone],
                ["Email", values.email],
                ["Joining as", categoryLabel[values.category]],
                ["Voice part", values.category === "SINGER" ? values.voicePart : undefined],
                ["Instrument", values.category === "INSTRUMENTALIST" ? values.instrument : undefined],
                ["Role", values.category === "PRODUCTION" ? values.productionRole : undefined],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-xs uppercase tracking-[0.14em] text-white/45">{k}</dt>
                    <dd className="mt-1 break-words text-white">{v}</dd>
                  </div>
                ))}
            </dl>

            <Field label="Anything else you want us to know?" optional error={errors.notes?.message}>
              {(a11y) => (
                <textarea
                  {...a11y}
                  {...register("notes")}
                  className={`${inputClass} min-h-28 resize-y`}
                  placeholder="Availability, questions, or anything that helps us."
                />
              )}
            </Field>

            <p className="text-xs leading-6 text-white/52">
              By submitting, you agree that your details may be used to contact you about the
              audition.
            </p>
          </>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl px-5 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
            >
              Back
            </Button>
          ) : (
            <span />
          )}

          {isLastStep ? (
            <Button
              type="submit"
              className="rounded-2xl bg-amber-300 px-6 py-6 text-base font-semibold text-black hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-200/60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit application"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              className="rounded-2xl bg-amber-300 px-6 py-6 text-base font-semibold text-black hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-200/60"
            >
              Next: {steps[step + 1].title}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
