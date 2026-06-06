import type { Metadata } from "next";
import Link from "next/link";

import LegalPageShell, { type LegalSection } from "@/components/legal-page-shell";

const siteUrl = "https://www.jnc.vercel.app";
const lastUpdated = "June 6, 2026";
const title = "Privacy Policy";
const description =
  "Learn how Jude Nnam Choral Platform collects, uses, protects, and manages personal information for accounts, auditions, choristers, events, and score downloads.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/privacy-policy",
  },
  keywords: [
    "Jude Nnam Choral privacy policy",
    "JNC privacy policy",
    "choir website privacy policy",
    "Sir Jude Nnam scores privacy",
    "JNC data protection",
  ],
  openGraph: {
    title,
    description,
    url: "/privacy-policy",
    type: "article",
    images: ["/logo.svg"],
  },
};

const sections: LegalSection[] = [
  {
    title: "Who We Are",
    body: (
      <>
        Jude Nnam Choral Platform is the official digital platform for Jude Nnam Choral
        activities, including public information, auditions, events, media, score access,
        and chorister administration. For privacy questions, contact{" "}
        <Link className="text-amber-100 underline-offset-4 hover:underline" href="mailto:jncplatform@gmail.com">
          jncplatform@gmail.com
        </Link>
        .
      </>
    ),
  },
  {
    title: "Information We Collect",
    body:
      "We collect information that helps us operate the platform and support choir activities.",
    points: [
      "Account details such as name, email address, profile photo, role, login provider, and password hash for credential accounts.",
      "Audition and event details such as name, phone number, email address, category, voice part, application notes, event response, and related documents.",
      "Chorister records such as phone number, address, voice part, emergency contact, parish, attendance records, excuse notes, and passport images when submitted.",
      "Music and score access information needed to provide registered downloads and protect restricted files.",
      "Technical information such as device, browser, session, security, and cookie preference data.",
    ],
  },
  {
    title: "How We Use Information",
    body:
      "We use personal information only for platform, choir, communication, security, and administrative purposes.",
    points: [
      "Create and manage accounts, profiles, authentication, and registered download access.",
      "Process auditions, event responses, chorister verification, attendance, notices, and internal administration.",
      "Communicate important updates about auditions, rehearsals, events, score access, and support requests.",
      "Protect the platform, prevent misuse, maintain records, and troubleshoot technical issues.",
      "Improve public content, user experience, and the way JNC presents music, media, and scores online.",
    ],
  },
  {
    title: "Sharing and Service Providers",
    body:
      "We do not sell personal information. We may share limited information with trusted service providers and authorized administrators when necessary to run the platform.",
    points: [
      "Hosting, database, authentication, storage, and media upload providers that help operate the website.",
      "Authorized JNC administrators and leadership members who need access for auditions, chorister records, events, scores, or support.",
      "Legal, safety, or regulatory recipients when required by law or necessary to protect rights, users, or the platform.",
    ],
  },
  {
    title: "Cookies and Similar Storage",
    body: (
      <>
        We use essential cookies and similar browser storage for account sessions, security,
        and consent preferences. Optional analytics or embedded media cookies are not required
        for basic browsing. More details are available in our{" "}
        <Link className="text-amber-100 underline-offset-4 hover:underline" href="/cookie-policy">
          Cookie Policy
        </Link>
        .
      </>
    ),
  },
  {
    title: "Data Retention",
    body:
      "We keep information for as long as needed to provide the platform, manage choir records, comply with lawful obligations, resolve disputes, secure the service, and preserve legitimate JNC administrative records. You may request review, correction, or deletion where applicable.",
  },
  {
    title: "Your Choices and Rights",
    body:
      "Depending on your location and applicable law, you may have rights to access, correct, update, delete, restrict, or object to certain uses of your personal information. You may also withdraw optional consent where processing is based on consent.",
    points: [
      "You can update basic profile information from your account profile page.",
      "You can choose essential-only cookie settings from the cookie consent panel.",
      "You can contact us to request help with access, correction, deletion, or privacy questions.",
    ],
  },
  {
    title: "Security",
    body:
      "We use reasonable technical and organizational measures to protect account and platform data. No online service can guarantee perfect security, so users should protect their passwords, use secure devices, and report suspicious activity promptly.",
  },
  {
    title: "Children and Young Choristers",
    body:
      "The platform is not designed to intentionally collect information from children without appropriate parent or guardian involvement. If you believe a child submitted information without proper consent, contact us for review.",
  },
  {
    title: "Changes to This Policy",
    body:
      "We may update this Privacy Policy as the platform, choir activities, or legal requirements change. The latest version will always show the current last updated date.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: `${siteUrl}/privacy-policy`,
  dateModified: "2026-06-06",
  isPartOf: {
    "@type": "WebSite",
    name: "Jude Nnam Choral",
    url: siteUrl,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPageShell
        eyebrow="Privacy Notice"
        title="Privacy Policy"
        description={description}
        lastUpdated={lastUpdated}
        sections={sections}
      />
    </>
  );
}
