import type { Metadata } from "next";
import Link from "next/link";

import LegalPageShell, { type LegalSection } from "@/components/legal-page-shell";

const siteUrl = "https://www.jnc.vercel.app";
const lastUpdated = "June 6, 2026";
const title = "Cookie Policy";
const description =
  "Learn how Jude Nnam Choral Platform uses essential cookies, browser storage, consent preferences, and optional future analytics or media cookies.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/cookie-policy",
  },
  keywords: [
    "Jude Nnam Choral cookie policy",
    "JNC cookies",
    "JNC consent settings",
    "choir website cookie policy",
  ],
  openGraph: {
    title,
    description,
    url: "/cookie-policy",
    type: "article",
    images: ["/logo.svg"],
  },
};

const sections: LegalSection[] = [
  {
    title: "What Cookies Are",
    body:
      "Cookies are small files or identifiers stored by your browser. Similar technologies include local storage and session storage. They help websites remember sessions, preferences, security states, and other settings.",
  },
  {
    title: "How JNC Uses Cookies",
    body:
      "Jude Nnam Choral Platform uses cookies and similar storage in a limited way so the website can function properly and remember your consent choice.",
    points: [
      "Essential authentication and session cookies help registered users stay signed in securely.",
      "Security and platform cookies help protect forms, admin areas, downloads, and account access.",
      "Preference storage remembers whether you accepted all cookies or chose essential-only settings.",
      "Optional analytics or embedded media cookies may be added later only where appropriate and after consent.",
    ],
  },
  {
    title: "Essential Cookies",
    body:
      "Essential cookies are needed for requested services such as login, secure account sessions, protected downloads, admin access, and platform security. These cannot be turned off from the cookie banner because the website may not work correctly without them.",
  },
  {
    title: "Optional Cookies",
    body:
      "Optional cookies may support analytics, media embeds, performance measurement, or future improvements. The current platform does not require optional cookies for basic browsing, account access, auditions, event pages, or score discovery.",
  },
  {
    title: "Managing Consent",
    body:
      "When you first visit the site, the cookie banner lets you accept all cookies or continue with essential cookies only. After you make a choice, the banner is not shown again on that browser unless the site storage is cleared.",
    points: [
      "Accept all stores consent for essential and optional categories.",
      "Essential only stores consent for strictly necessary platform use.",
      "Changing browser, clearing site storage, or using another device may cause the banner to appear again.",
    ],
  },
  {
    title: "Third-Party Services",
    body:
      "Some features may involve third-party services such as authentication providers, hosting providers, media storage, score file delivery, or embedded media. Those services may use cookies or similar technologies under their own policies when their features are used.",
  },
  {
    title: "Browser Controls",
    body:
      "Most browsers let you delete or block cookies. Blocking essential cookies may affect login, account sessions, protected downloads, and other secure features.",
  },
  {
    title: "Related Policies",
    body: (
      <>
        For more information about personal data, see our{" "}
        <Link className="text-amber-100 underline-offset-4 hover:underline" href="/privacy-policy">
          Privacy Policy
        </Link>
        . Platform use is also covered by our{" "}
        <Link className="text-amber-100 underline-offset-4 hover:underline" href="/terms-of-service">
          Terms of Service
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
  url: `${siteUrl}/cookie-policy`,
  dateModified: "2026-06-06",
  isPartOf: {
    "@type": "WebSite",
    name: "Jude Nnam Choral",
    url: siteUrl,
  },
};

export default function CookiePolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPageShell
        eyebrow="Cookie Notice"
        title="Cookie Policy"
        description={description}
        lastUpdated={lastUpdated}
        sections={sections}
      />
    </>
  );
}
