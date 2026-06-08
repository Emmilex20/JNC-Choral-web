import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Mail,
  MapPin,
  MessageSquareText,
  MicVocal,
  Phone,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { Button } from "@/components/ui/button";

const siteUrl = "https://www.jncchorale.com";
const email = "jncplatform@gmail.com";
const phones = [
  { label: "08064087399", href: "tel:+2348064087399" },
  { label: "0803943856", href: "tel:+234803943856" },
];

const contactCards = [
  {
    title: "Email",
    value: email,
    detail: "Best for formal requests, media notes, score questions, and partnerships.",
    href: `mailto:${email}?subject=JNC%20Contact%20Inquiry`,
    action: "Send email",
    icon: Mail,
  },
  {
    title: "Phone",
    value: phones.map((phone) => phone.label).join(" / "),
    detail: "Call for urgent audition, event, rehearsal, or coordination matters.",
    href: phones[0].href,
    action: "Call JNC",
    icon: Phone,
  },
  {
    title: "Location",
    value: "Abuja, Nigeria",
    detail: "JNC is based in Abuja and serves choir, liturgical, and gospel music communities.",
    href: "https://www.google.com/maps/search/?api=1&query=Abuja%2C%20Nigeria",
    action: "Open map",
    icon: MapPin,
  },
];

const inquiryTypes = [
  {
    title: "Auditions",
    body: "Singers, instrumentalists, and production creatives can apply directly online.",
    href: "/auditions",
    action: "Audition page",
    icon: MicVocal,
  },
  {
    title: "Events",
    body: "Invite, partner, or ask about public appearances, concerts, and choir ministry.",
    href: `mailto:${email}?subject=JNC%20Event%20Inquiry`,
    action: "Event inquiry",
    icon: CalendarDays,
  },
  {
    title: "Media",
    body: "Reach out for photos, performance media, interviews, features, or press requests.",
    href: `mailto:${email}?subject=JNC%20Media%20Inquiry`,
    action: "Media inquiry",
    icon: MessageSquareText,
  },
  {
    title: "Community",
    body: "Ask about chorister records, partnerships, score access, or general support.",
    href: `mailto:${email}?subject=JNC%20Community%20Inquiry`,
    action: "Contact support",
    icon: UsersRound,
  },
];

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Jude Nnam Chorale in Abuja for auditions, events, partnerships, media requests, score inquiries, and choir support.",
  alternates: {
    canonical: "/contact",
  },
  keywords: [
    "contact Jude Nnam Chorale",
    "JNC contact",
    "Jude Nnam Chorale Abuja",
    "JNC auditions contact",
    "Sir Jude Nnam choir",
    "JNC email",
  ],
  openGraph: {
    title: "Contact Jude Nnam Chorale",
    description:
      "Reach JNC for auditions, events, partnerships, media requests, score inquiries, and choir support.",
    url: "/contact",
    type: "website",
    images: ["/logo.svg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Jude Nnam Chorale",
  description: metadata.description,
  url: `${siteUrl}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: "Jude Nnam Chorale",
    email,
    telephone: phones.map((phone) => phone.href.replace("tel:", "")),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Abuja",
      addressCountry: "NG",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "general inquiries",
        email,
        telephone: "+2348064087399",
        areaServed: "NG",
      },
      {
        "@type": "ContactPoint",
        contactType: "auditions and events",
        email,
        telephone: "+234803943856",
        areaServed: "NG",
      },
    ],
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#07111f_50%,#101007_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <MessageSquareText className="h-3.5 w-3.5" />
              Contact JNC
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Let us help you reach the right desk.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68">
              Reach Jude Nnam Chorale for auditions, concerts, partnerships, media requests,
              score inquiries, and chorister support. We will direct your message to the right
              team.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button className="rounded-2xl bg-amber-200 px-6 py-6 text-black hover:bg-amber-100" asChild>
                <Link href={`mailto:${email}?subject=JNC%20Contact%20Inquiry`}>
                  <Mail className="h-4 w-4" />
                  Email JNC
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/[0.05] px-6 py-6 text-white hover:bg-white/[0.09]"
                asChild
              >
                <Link href={phones[0].href}>
                  <Phone className="h-4 w-4" />
                  Call now
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-[0_26px_80px_rgba(0,0,0,0.32)]">
            <div className="relative aspect-[4/3]">
              <Image
                src="/hero/hero-2.png"
                alt="Jude Nnam Chorale performance moment"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.78))]" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/54 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur">
                  <Sparkles className="h-4 w-4 text-amber-100" />
                  Abuja, Nigeria
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">
                  Music, ministry, media, and community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {contactCards.map((card) => {
            const Icon = card.icon;
            const isExternal = card.href.startsWith("http");

            return (
              <Link
                key={card.title}
                href={card.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-0.5 hover:border-amber-200/28 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-white/38 transition group-hover:text-amber-100" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
                  {card.title}
                </p>
                <h2 className="mt-2 break-words text-xl font-semibold text-white">{card.value}</h2>
                <p className="mt-3 text-sm leading-7 text-white/62">{card.detail}</p>
                <p className="mt-5 text-sm font-semibold text-amber-100">{card.action}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 md:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:pb-14">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/62">
            Direct Lines
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Choose the fastest route.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">
            For formal requests, email is best. For urgent coordination, call. For auditions,
            use the application page so your submission can be tracked.
          </p>

          <div className="mt-7 grid gap-4">
            {inquiryTypes.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex gap-4 rounded-[1.25rem] border border-white/10 bg-black/24 p-4 transition hover:border-amber-200/25 hover:bg-white/[0.06]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-amber-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-white">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-white/58">{item.body}</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-100">
                      {item.action}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <form
          action={`mailto:${email}?subject=JNC%20Contact%20Inquiry`}
          method="post"
          encType="text/plain"
          className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.035))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Message Desk
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Send a message
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/62">
            This opens your email app with your message details. We typically respond within
            24-48 hours.
          </p>

          <div className="mt-7 grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
                Full name
              </span>
              <input
                name="name"
                placeholder="Your name"
                className="rounded-2xl border border-white/10 bg-black/34 px-4 py-3.5 text-white outline-none transition placeholder:text-white/32 focus:border-amber-200/40 focus:bg-black/44"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
                Email address
              </span>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                className="rounded-2xl border border-white/10 bg-black/34 px-4 py-3.5 text-white outline-none transition placeholder:text-white/32 focus:border-amber-200/40 focus:bg-black/44"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
                Inquiry type
              </span>
              <select
                name="inquiry"
                className="rounded-2xl border border-white/10 bg-black/34 px-4 py-3.5 text-white outline-none transition focus:border-amber-200/40 focus:bg-black/44"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a category
                </option>
                <option value="Auditions">Auditions</option>
                <option value="Events">Events</option>
                <option value="Media">Media</option>
                <option value="Scores">Scores</option>
                <option value="Partnership">Partnership</option>
                <option value="General">General</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
                Message
              </span>
              <textarea
                name="message"
                placeholder="Tell us how we can help..."
                className="min-h-40 rounded-2xl border border-white/10 bg-black/34 px-4 py-3.5 text-white outline-none transition placeholder:text-white/32 focus:border-amber-200/40 focus:bg-black/44"
              />
            </label>

            <Button
              type="submit"
              className="min-h-12 rounded-2xl bg-amber-200 text-black hover:bg-amber-100"
            >
              <Send className="h-4 w-4" />
              Open email app
            </Button>
          </div>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(6,182,212,0.08),rgba(255,255,255,0.04))] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/70">
                Auditions and Membership
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white">
                Want to join the choir? Start with the audition form.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">
                Submit your details online so the team can review your application and contact
                you with next steps.
              </p>
            </div>
            <Button className="rounded-2xl bg-white px-6 py-6 text-black hover:bg-white/90" asChild>
              <Link href="/auditions">
                Register for auditions
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
