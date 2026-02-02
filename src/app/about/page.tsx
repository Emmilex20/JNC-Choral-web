import type { Metadata } from "next";
import Link from "next/link";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Jude Nnam Choral - a vibrant choir in Abuja focused on excellence, worship, and community.",
  alternates: {
    canonical: "https://www.jnc-choral.vercel.app/about",
  },
};

export default function AboutPage() {
  const values = [
    {
      title: "Excellence",
      body: "We rehearse with discipline, precision, and a passion for high standards.",
    },
    {
      title: "Worship",
      body: "Our music lifts hearts. We serve with humility and spiritual depth.",
    },
    {
      title: "Community",
      body: "We grow together - voices, friendships, and shared purpose.",
    },
    {
      title: "Creativity",
      body: "We blend choral tradition with modern sound and visual storytelling.",
    },
  ];

  const milestones = [
    { year: "2019", text: "Choral vision formed with a small core team." },
    { year: "2021", text: "Expanded to include instrumentalists and media crew." },
    { year: "2023", text: "Public performances and community events launched." },
    { year: "2026", text: "New season of auditions across multiple categories." },
  ];

  return (
    <main className="min-h-screen bg-black">
      <SiteNavbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                About Jude Nnam Choral
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">
                A choir shaped by purpose, excellence, and joy.
              </h1>
              <p className="mt-4 text-base text-white/75 md:text-lg">
                We are a choral community based in Abuja, Nigeria. Our sound blends
                worship, classical roots, and contemporary energy. From rehearsals
                to performances, we build a culture of growth, discipline, and
                artistic impact.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="rounded-2xl" asChild>
                  <Link href="/auditions">Join the choir</Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/contact">Contact us</Link>
                </Button>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-35"
                style={{ backgroundImage: "url(/hero/hero-1.png)" }}
              />
              <div className="absolute inset-0 bg-black/55" />
              <div className="relative">
                <h2 className="text-2xl font-semibold text-white">
                  Our mission
                </h2>
                <p className="mt-3 text-sm text-white/75">
                  To spread joy through music, build excellence in performance,
                  and equip singers, instrumentalists, and creatives for lasting
                  impact.
                </p>
                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                    <p className="text-xs text-white/60">Based in</p>
                    <p className="text-lg font-semibold text-white">Abuja</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                    <p className="text-xs text-white/60">Categories</p>
                    <p className="text-lg font-semibold text-white">
                      Singers, Instrumentalists, Production
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <h2 className="text-2xl font-semibold text-white">What we believe</h2>
            <p className="mt-3 text-sm text-white/70">
              We believe in rehearsals that build confidence, performances that
              move hearts, and teams that treat people with care. Every voice
              and role matters.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <p className="text-sm font-semibold text-white">{v.title}</p>
                  <p className="mt-2 text-xs text-white/70">{v.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <h2 className="text-2xl font-semibold text-white">Our journey</h2>
            <p className="mt-3 text-sm text-white/70">
              A growing movement that started with a vision and now serves a
              broader musical community.
            </p>
            <div className="mt-6 grid gap-3">
              {milestones.map((m) => (
                <div
                  key={m.year}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
                    {m.year}
                  </div>
                  <p className="text-sm text-white/70">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { label: "Active members", value: "45+" },
            { label: "Sections", value: "8" },
            { label: "Showcases yearly", value: "12" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-3xl border border-white/10 bg-black/30 p-6"
            >
              <p className="text-xs text-white/60">{s.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),transparent_60%)] p-8 md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">
                Ready to be part of the story?
              </h2>
              <p className="mt-2 text-white/70">
                Audition, volunteer, or collaborate with the team.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-2xl" asChild>
                <Link href="/auditions">Register now</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/news">Latest updates</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
