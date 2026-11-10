import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, ClipboardList, FileMusic, UsersRound, type LucideIcon } from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";
import { safeJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Help & FAQ",
  description:
    "Answers to common questions about auditions, accounts, the chorister portal, scores and the Music Hub at Jude Nnam Chorale.",
  alternates: { canonical: "https://www.jncchorale.com/help" },
};

const tasks: { title: string; text: string; href: string; icon: LucideIcon }[] = [
  {
    title: "Audition for the choir",
    text: "Apply as a singer, instrumentalist or production crew.",
    href: "/auditions",
    icon: ClipboardList,
  },
  {
    title: "Learn and practise",
    text: "Daily challenge, quizzes, articles and the leaderboard.",
    href: "/music-hub",
    icon: BookOpenText,
  },
  {
    title: "Find a score",
    text: "Download choir scores once you are signed in.",
    href: "/scores",
    icon: FileMusic,
  },
  {
    title: "Chorister portal",
    text: "For verified choristers: attendance, notices and scores.",
    href: "/choristers",
    icon: UsersRound,
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "How do I audition?",
    a: "Create a free account, open the Auditions page and complete the three short steps: your details, your voice or instrument, then a review. You can start the form before signing in, and your answers are kept while you create your account.",
  },
  {
    q: "How do I check my audition status?",
    a: "Sign in and open Auditions, then Track status. If you are accepted, you can download your audition card there.",
  },
  {
    q: "Do I need an account?",
    a: "You can read news, see events and watch videos without one. You need an account to apply for auditions, save quiz and challenge progress, vote, and download scores.",
  },
  {
    q: "How do I become a verified chorister?",
    a: "Create an account and choose the chorister option when you set up your profile. An admin checks the request. Once approved, the Chorister portal opens for you with attendance, notices and choristers-only scores.",
  },
  {
    q: "How do I download a score?",
    a: "Sign in, open the Scores bank and choose Download. Some scores are for verified choristers only.",
  },
  {
    q: "I forgot my password. What do I do?",
    a: "On the log in page choose Forgot password, enter your email, then enter the 6-digit code we send you and choose a new password. The code expires after 15 minutes.",
  },
  {
    q: "What is the Music Hub?",
    a: "A free area to build your musicianship: one theory question every day, quizzes, music challenges where you can share recordings and vote, and a weekly leaderboard.",
  },
  {
    q: "How do I contact the choir?",
    a: "Use the Contact page, call 08064087399 or 0803943856, or email jncplatform@gmail.com.",
  },
];

export default function HelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#08111f_52%,#101007_100%)]">
        <div className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-20">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">Help</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            How can we help?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
            Pick what you want to do, or read the common questions below.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <h2 className="text-xl font-semibold">What do you want to do?</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {tasks.map((task) => (
            <Link
              key={task.href}
              href={task.href}
              className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-amber-200/30 hover:bg-white/[0.07]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200/15 bg-amber-200/10 text-amber-100">
                <task.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">{task.title}</span>
                <span className="mt-1 block text-sm text-white/65">{task.text}</span>
              </span>
              <ArrowRight
                className="mt-1 h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-6">
        <h2 className="text-xl font-semibold">Common questions</h2>
        <div className="mt-5 grid gap-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] open:bg-white/[0.07]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-medium">
                {item.q}
                <span className="text-xs text-white/50 transition group-open:rotate-180" aria-hidden>
                  ▼
                </span>
              </summary>
              <p className="border-t border-white/10 px-5 py-4 text-sm leading-7 text-white/75">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-sm text-white/65">
          Still stuck?{" "}
          <Link href="/contact" className="text-amber-100 underline underline-offset-2">
            Contact us
          </Link>
          .
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
