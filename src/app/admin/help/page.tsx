import Link from "next/link";

import { AdminPageHeader } from "../_components/admin-page-header";

type Guide = {
  title: string;
  where: { label: string; href: string };
  steps: string[];
};

const guides: Guide[] = [
  {
    title: "Set the next audition date",
    where: { label: "Auditions", href: "/admin/auditions" },
    steps: [
      "Open Auditions and find the audition schedule box at the top.",
      "Pick the date and time, add the venue, then save.",
      "The homepage banner and the audition page update automatically, and expire after the date passes.",
    ],
  },
  {
    title: "Accept or decline an audition application",
    where: { label: "Auditions", href: "/admin/auditions" },
    steps: [
      "Open Auditions and click an application to read it.",
      "Change its status to Accepted or Rejected.",
      "Accepted applicants can download their audition card from their status page.",
      "Use Export to download all applications as a spreadsheet.",
    ],
  },
  {
    title: "Let a member into the chorister portal",
    where: { label: "Verification requests", href: "/admin/choristers/pending" },
    steps: [
      "Open Verification requests to see people who asked to join.",
      "Approve or decline each request.",
      "Approved members can open the chorister portal, mark attendance and download choristers-only scores.",
    ],
  },
  {
    title: "Add a rehearsal and approve attendance",
    where: { label: "Rehearsals", href: "/admin/rehearsals" },
    steps: [
      "Add the rehearsal date and time.",
      "Choristers mark themselves present or send an excuse on the day.",
      "Open the rehearsal and approve or change each record. People who do nothing are marked absent automatically.",
    ],
  },
  {
    title: "Add an event",
    where: { label: "Events", href: "/admin/events" },
    steps: [
      "Open Events and fill in the title, date, place and description.",
      "Upload a photo or video if you have one.",
      "Turn on Published to show it on the website. Leave it off to save a draft.",
      "Open an event to see who has said they are coming.",
    ],
  },
  {
    title: "Post news",
    where: { label: "News", href: "/admin/announcements" },
    steps: [
      "Open News and write a title and the text.",
      "Publish it to show it on the News page and the homepage.",
      "Unpublish it later if it is out of date.",
    ],
  },
  {
    title: "Upload photos, videos, songs and scores",
    where: { label: "Gallery, Videos, Music & scores", href: "/admin/music" },
    steps: [
      "Gallery: upload photos from rehearsals and concerts.",
      "Videos: upload a performance video and add a poster image.",
      "Music & scores: upload audio tracks, and upload PDF scores to the scores bank.",
      "For a score, choose who can download it: all signed-in users, or verified choristers only.",
    ],
  },
  {
    title: "Run the daily challenge and quizzes",
    where: { label: "Academy", href: "/admin/academy" },
    steps: [
      "Open Academy, then the Daily challenge tab, and write a question with four options.",
      "Use Quizzes to build a short quiz. Keep it unpublished until you have checked it.",
      "Use Articles to write learning content for the Music Hub.",
      "AI draft buttons can write a first version for you. Always read and edit it before publishing.",
    ],
  },
  {
    title: "Approve music challenge recordings",
    where: { label: "Music challenges", href: "/admin/challenges" },
    steps: [
      "Create a challenge with a prompt and dates.",
      "Members submit recordings. Each one waits for your approval.",
      "Approve the good ones to show them publicly so others can vote.",
    ],
  },
  {
    title: "Feature a chorister",
    where: { label: "Spotlights", href: "/admin/spotlights" },
    steps: [
      "Add a name, photo and short story.",
      "Publish it. The latest spotlight shows on the homepage.",
    ],
  },
  {
    title: "Change someone's role or fix an account",
    where: { label: "Users & roles", href: "/admin/users" },
    steps: [
      "Open Users & roles and find the person.",
      "Change their role, chorister status or add a private note.",
      "There must always be at least one admin, and you cannot remove your own admin role.",
    ],
  },
  {
    title: "Understand the analytics",
    where: { label: "Analytics", href: "/admin/analytics" },
    steps: [
      "Page views and visitors show how many people use the site.",
      "Where visitors come from shows which websites send people to you.",
      "The audition funnel shows how many people start and finish the form. A big drop between steps means that step needs fixing.",
      "No cookies or personal details are stored.",
    ],
  },
];

export default function AdminHelpPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Support"
        title="Admin guide"
        description="Short, step-by-step answers for the jobs you do most often."
      />

      <div className="grid gap-3">
        {guides.map((guide) => (
          <details
            key={guide.title}
            className="group rounded-2xl border border-white/10 bg-white/[0.04] open:bg-white/[0.06]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left">
              <span className="text-base font-semibold text-white">{guide.title}</span>
              <span className="text-xs text-white/50 transition group-open:rotate-180" aria-hidden>
                ▼
              </span>
            </summary>
            <div className="border-t border-white/10 px-5 py-4">
              <ol className="grid list-decimal gap-2 pl-5 text-sm leading-6 text-white/80">
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Link
                href={guide.where.href}
                className="mt-4 inline-flex rounded-xl border border-amber-200/30 bg-amber-200/10 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-200/20"
              >
                Open {guide.where.label}
              </Link>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
