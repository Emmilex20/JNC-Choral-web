import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, FileText, Mail, ShieldCheck } from "lucide-react";

import SiteFooter from "@/components/site-footer";
import SiteNavbar from "@/components/site-navbar";

export type LegalSection = {
  title: string;
  body: ReactNode;
  points?: string[];
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

function sectionId(index: number) {
  return `section-${index + 1}`;
}

export default function LegalPageShell({
  eyebrow,
  title,
  description,
  lastUpdated,
  sections,
}: LegalPageShellProps) {
  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <SiteNavbar />

      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#02040a_0%,#07111f_48%,#03151a_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:py-18">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-50">
              <ShieldCheck className="h-3.5 w-3.5" />
              {eyebrow}
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">{description}</p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/72">
              <CalendarDays className="h-4 w-4 text-amber-100" />
              Last updated: {lastUpdated}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:py-14">
        <aside className="h-fit rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 lg:sticky lg:top-28">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            <FileText className="h-4 w-4" />
            Legal Center
          </div>
          <nav className="mt-5 grid gap-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-white/10 bg-black/22 px-4 py-3 text-sm font-medium text-white/76 transition hover:border-amber-200/30 hover:bg-amber-200/8 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              On This Page
            </p>
            <div className="mt-3 grid gap-2">
              {sections.map((section, index) => (
                <Link
                  key={section.title}
                  href={`#${sectionId(index)}`}
                  className="text-sm leading-6 text-white/58 transition hover:text-white"
                >
                  {section.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200/15 bg-amber-200/8 p-4 text-sm leading-6 text-amber-50/84">
            <Mail className="mb-3 h-4 w-4" />
            Questions about privacy, access, or account data can be sent to{" "}
            <Link className="font-semibold text-amber-50 underline-offset-4 hover:underline" href="mailto:jncplatform@gmail.com">
              jncplatform@gmail.com
            </Link>
            .
          </div>
        </aside>

        <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 md:p-8">
          {sections.map((section, index) => (
            <section
              id={sectionId(index)}
              key={section.title}
              className="scroll-mt-28 border-b border-white/10 py-7 first:pt-0 last:border-b-0 last:pb-0"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {section.title}
              </h2>
              <div className="mt-3 text-sm leading-7 text-white/68">{section.body}</div>
              {section.points ? (
                <ul className="mt-5 grid gap-3">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-6 text-white/72">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </section>

      <SiteFooter />
    </main>
  );
}
