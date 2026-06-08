import type { Metadata } from "next";
import Link from "next/link";

import LegalPageShell, { type LegalSection } from "@/components/legal-page-shell";

const siteUrl = "https://www.jncchorale.com";
const lastUpdated = "June 6, 2026";
const title = "Terms of Service";
const description =
  "Read the terms for using Jude Nnam Chorale Platform, including accounts, auditions, chorister access, media, score downloads, and acceptable use.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/terms-of-service",
  },
  keywords: [
    "Jude Nnam Chorale terms",
    "JNC terms of service",
    "Sir Jude Nnam score download terms",
    "JNC platform rules",
  ],
  openGraph: {
    title,
    description,
    url: "/terms-of-service",
    type: "article",
    images: ["/logo.svg"],
  },
};

const sections: LegalSection[] = [
  {
    title: "Acceptance of Terms",
    body:
      "By accessing or using Jude Nnam Chorale Platform, you agree to these Terms of Service and any related policies referenced here. If you do not agree, you should not use the platform.",
  },
  {
    title: "Platform Purpose",
    body:
      "The platform exists to present JNC public information, auditions, events, media, music, score access, and chorister administration. Some features are public, while downloads, chorister tools, and admin areas require an account or specific authorization.",
  },
  {
    title: "Accounts and Security",
    body:
      "You are responsible for keeping your account information accurate and protecting your login details. You must not share access to restricted areas, impersonate another person, or attempt to bypass platform security.",
    points: [
      "Use accurate information when registering, applying for auditions, or submitting event responses.",
      "Keep passwords confidential and notify JNC if you suspect unauthorized access.",
      "Administrators may update, suspend, or remove access where needed for security, moderation, or choir administration.",
    ],
  },
  {
    title: "Auditions, Events, and Chorister Access",
    body:
      "Audition submissions, event responses, attendance records, excuse notes, and chorister verification are handled by authorized JNC administrators. Decisions about auditions, membership, attendance approval, and choir administration remain at JNC discretion.",
  },
  {
    title: "Scores, Music, and Downloads",
    body:
      "Scores, music sheets, audio, videos, images, and related content may be protected by copyright, performer rights, composer rights, or JNC administrative restrictions. Download access is provided for permitted personal, educational, rehearsal, or choir-related use only unless written permission says otherwise.",
    points: [
      "Do not resell, republish, redistribute, or upload JNC score files or protected media to another platform without permission.",
      "Respect composer, arranger, performer, choir, and platform rights attached to each file.",
      "JNC may update, restrict, or remove score access when necessary.",
    ],
  },
  {
    title: "User Submissions",
    body:
      "When you submit profile details, audition information, event responses, chorister data, images, notes, or other content, you confirm that the information is accurate and that you have the right to provide it. You grant JNC permission to use submitted information for platform and choir administration purposes.",
  },
  {
    title: "Acceptable Use",
    body:
      "You agree not to misuse the platform or interfere with its operation.",
    points: [
      "Do not upload harmful files, spam, false information, abusive material, or content that violates the rights of another person.",
      "Do not scrape restricted data, reverse engineer protected features, or attempt unauthorized admin access.",
      "Do not use the platform in a way that damages JNC, other users, performers, or the public reputation of the choir.",
    ],
  },
  {
    title: "Third-Party Services",
    body:
      "The platform may use third-party providers for hosting, authentication, media storage, email, embedded content, or other technical services. Those providers may have their own terms and privacy notices.",
  },
  {
    title: "Availability and Changes",
    body:
      "We work to keep the platform available and accurate, but we may change, pause, update, or remove features, files, pages, or account access as needed. Public content and schedules may change without prior notice.",
  },
  {
    title: "No Warranty",
    body:
      "The platform is provided on an as available basis. While we aim for accuracy, we do not guarantee that every page, file, date, media item, or feature will always be error-free, complete, or uninterrupted.",
  },
  {
    title: "Limitation of Liability",
    body:
      "To the extent permitted by applicable law, JNC will not be liable for indirect, incidental, special, or consequential losses arising from use of the platform, inability to access the platform, or reliance on public content.",
  },
  {
    title: "Privacy and Cookies",
    body: (
      <>
        Use of the platform is also governed by our{" "}
        <Link className="text-amber-100 underline-offset-4 hover:underline" href="/privacy-policy">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link className="text-amber-100 underline-offset-4 hover:underline" href="/cookie-policy">
          Cookie Policy
        </Link>
        .
      </>
    ),
  },
  {
    title: "Contact",
    body: (
      <>
        For questions about these terms, contact{" "}
        <Link className="text-amber-100 underline-offset-4 hover:underline" href="mailto:jncplatform@gmail.com">
          jncplatform@gmail.com
        </Link>
        .
      </>
    ),
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: `${siteUrl}/terms-of-service`,
  dateModified: "2026-06-06",
  isPartOf: {
    "@type": "WebSite",
    name: "Jude Nnam Chorale",
    url: siteUrl,
  },
};

export default function TermsOfServicePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPageShell
        eyebrow="Platform Terms"
        title="Terms of Service"
        description={description}
        lastUpdated={lastUpdated}
        sections={sections}
      />
    </>
  );
}
