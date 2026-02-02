import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://www.jnc-choral.vercel.app";
const ogImage = "/og/og-image.svg";
const siteName = "Jude Nnam Choral";
const tagline =
  "Spreading joy through music in Abuja and beyond.";
const description =
  "Jude Nnam Choral is a vibrant choir in Abuja, Nigeria. Join auditions, attend events, and experience uplifting choral music and community.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  alternates: {
    canonical: siteUrl,
  },
  keywords: [
    "Jude Nnam Choral",
    "choir in Abuja",
    "choral auditions Abuja",
    "choir Nigeria",
    "gospel choir Nigeria",
    "music auditions Abuja",
    "choral group Abuja",
    "African choir",
    "live choral performance",
    "JNC choral platform",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: siteName,
    description,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
