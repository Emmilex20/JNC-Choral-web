import Image from "next/image";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";

const columns = [
  {
    title: "Join",
    links: [
      { label: "Auditions", href: "/auditions" },
      { label: "Create an account", href: "/auth/register" },
      { label: "Events", href: "/events" },
      { label: "About the choir", href: "/about" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Music Hub", href: "/music-hub" },
      { label: "Academy articles", href: "/academy" },
      { label: "Scores bank", href: "/scores" },
      { label: "Videos", href: "/videos" },
      { label: "Gallery", href: "/gallery" },
      { label: "News", href: "/news" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help & FAQ", href: "/help" },
      { label: "Contact us", href: "/contact" },
      { label: "Chorister portal", href: "/choristers" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white/10">
                <Image
                  src="/logo.svg"
                  alt="JNC logo"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <p className="text-lg font-semibold text-white">Jude Nnam Chorale</p>
            </div>
            <p className="mt-3 text-sm text-white/70">
              A choir in Abuja, Nigeria. Auditions, events, music learning and scores.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="grid content-start gap-2 text-sm">
              <p className="font-semibold text-white">{column.title}</p>
              {column.links.map((link) => (
                <Link key={link.href} className="text-white/70 hover:text-white" href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}

          <div className="grid content-start gap-2 text-sm">
            <p className="font-semibold text-white">Contact</p>
            <p className="text-white/70">Abuja, Nigeria</p>
            <a className="text-white/70 hover:text-white" href="tel:+2348064087399">
              08064087399
            </a>
            <a className="text-white/70 hover:text-white" href="tel:+234803943856">
              0803943856
            </a>
            <a className="text-white/70 hover:text-white" href="mailto:jncplatform@gmail.com">
              jncplatform@gmail.com
            </a>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col gap-3 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Jude Nnam Chorale. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link className="hover:text-white" href="/privacy-policy">
              Privacy
            </Link>
            <Link className="hover:text-white" href="/terms-of-service">
              Terms
            </Link>
            <Link className="hover:text-white" href="/cookie-policy">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
