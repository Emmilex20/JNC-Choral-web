"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type EventStatus = "ATTENDING" | "MAYBE" | "NOT_ATTENDING";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  summary: {
    attending: number;
    maybe: number;
    notAttending: number;
    total: number;
  };
};

type EventsClientProps = {
  upcoming: EventItem[];
  past: EventItem[];
};

const responseOptions: {
  value: EventStatus;
  label: string;
  icon: typeof CheckCircle2;
}[] = [
  { value: "ATTENDING", label: "I'll attend", icon: CheckCircle2 },
  { value: "MAYBE", label: "Maybe", icon: Clock3 },
  { value: "NOT_ATTENDING", label: "Can't make it", icon: XCircle },
];

function fmt(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function emptyForm() {
  return {
    fullName: "",
    email: "",
    phone: "",
    note: "",
  };
}

export default function EventsClient({ upcoming, past }: EventsClientProps) {
  const [events, setEvents] = useState({ upcoming, past });
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [status, setStatus] = useState<EventStatus>("ATTENDING");
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function openModal(event: EventItem, nextStatus: EventStatus) {
    setSelectedEvent(event);
    setStatus(nextStatus);
    setError(null);
    setSuccess(null);
    setForm(emptyForm());
  }

  function closeModal() {
    setSelectedEvent(null);
    setError(null);
    setSuccess(null);
    setForm(emptyForm());
    setStatus("ATTENDING");
  }

  async function submitResponse() {
    if (!selectedEvent) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          note: form.note || undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Unable to submit RSVP");
        return;
      }

      setEvents((current) => ({
        upcoming: current.upcoming.map((event) =>
          event.id === selectedEvent.id ? { ...event, summary: data.summary } : event
        ),
        past: current.past.map((event) =>
          event.id === selectedEvent.id ? { ...event, summary: data.summary } : event
        ),
      }));
      setSuccess("Your RSVP has been submitted.");
      setTimeout(() => closeModal(), 900);
    } catch {
      setError("Unable to submit RSVP");
    } finally {
      setSubmitting(false);
    }
  }

  function EventCard({ event }: { event: EventItem }) {
    const canRespond = new Date(event.startsAt).getTime() >= Date.now();

    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/30">
        {event.imageUrl ? (
          <div className="relative h-56 w-full">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : null}
        {event.videoUrl ? (
          <video src={event.videoUrl} controls className="w-full bg-black" />
        ) : null}
        <div className="p-5">
          <p className="font-semibold text-white">{event.title}</p>
          <p className="mt-1 text-xs text-white/70">
            {fmt(event.startsAt)}
            {event.endsAt ? ` - ${fmt(event.endsAt)}` : ""}
          </p>
          {event.location ? <p className="mt-1 text-xs text-white/70">{event.location}</p> : null}
          {event.description ? (
            <p className="mt-3 text-sm leading-6 text-white/75">{event.description}</p>
          ) : null}

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Attending</p>
              <p className="mt-2 text-xl font-semibold text-white">{event.summary.attending}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Maybe</p>
              <p className="mt-2 text-xl font-semibold text-white">{event.summary.maybe}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Can&apos;t go</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {event.summary.notAttending}
              </p>
            </div>
          </div>

          {canRespond ? (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">RSVP</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {responseOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => openModal(event, option.value)}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/58">
              RSVP closed for this event.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Upcoming</h2>
          <div className="mt-4 grid gap-3">
            {events.upcoming.length === 0 ? (
              <p className="text-sm text-white/60">No upcoming events yet.</p>
            ) : (
              events.upcoming.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Past</h2>
          <div className="mt-4 grid gap-3">
            {events.past.length === 0 ? (
              <p className="text-sm text-white/60">No past events yet.</p>
            ) : (
              events.past.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </div>
        </div>
      </div>

      {selectedEvent ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/78 p-4 backdrop-blur-sm md:p-6">
          <div className="mx-auto flex min-h-full items-center justify-center">
            <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,7,18,0.96))] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.45)] md:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    RSVP
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {selectedEvent.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/65">
                    No signup needed. Submit your details directly to the event desk.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={closeModal}
                >
                  Close
                </Button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {responseOptions.map((option) => {
                  const Icon = option.icon;
                  const active = status === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={`rounded-2xl border px-4 py-3 text-sm transition ${
                        active
                          ? "border-amber-300/40 bg-amber-300/10 text-amber-50"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  {success}
                </div>
              ) : null}

              <div className="mt-6 grid gap-4">
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                  placeholder="Full name"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={form.email}
                    onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                    placeholder="Email address"
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                    placeholder="Phone number"
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))}
                  placeholder="Optional note"
                  rows={4}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    className="rounded-2xl"
                    disabled={submitting}
                    onClick={submitResponse}
                  >
                    {submitting ? "Submitting..." : "Submit RSVP"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
