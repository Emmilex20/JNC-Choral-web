"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type NavLink = { label: string; href: string };
type NavGroup = { label: string; items: NavLink[] };

const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Auditions", href: "/auditions" },
  { label: "Events", href: "/events" },
];

// Learn and play: everything in the Music Hub in one place.
const musicHubNav: NavGroup = {
  label: "Music Hub",
  items: [
    { label: "Music Hub home", href: "/music-hub" },
    { label: "Academy articles", href: "/academy" },
    { label: "Daily challenge", href: "/music-hub/daily-challenge" },
    { label: "Quizzes", href: "/music-hub/quizzes" },
    { label: "Music challenges", href: "/music-hub/challenges" },
    { label: "Leaderboard", href: "/music-hub/leaderboard" },
    { label: "Scores bank", href: "/scores" },
  ],
};

// Watch and listen.
const mediaNav: NavGroup = {
  label: "Media",
  items: [
    { label: "Videos", href: "/videos" },
    { label: "Music", href: "/music" },
    { label: "Gallery", href: "/gallery" },
    { label: "News", href: "/news" },
  ],
};

const contactNav: NavLink = { label: "Contact", href: "/contact" };

function navLinkClass(active: boolean) {
  return cn(
    "relative inline-flex items-center gap-1 whitespace-nowrap py-2 text-sm font-medium text-white/74 transition duration-200 hover:text-white",
    "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-amber-200 after:transition-transform after:duration-200 hover:after:scale-x-100",
    active && "text-white after:scale-x-100"
  );
}

const MOBILE_LINK_CLASS =
  "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition";

function DesktopGroup({ group, active }: { group: NavGroup; active: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={navLinkClass(active)} suppressHydrationWarning>
        {group.label}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border-white/10 bg-black text-white">
        {group.items.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileGroup({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">{group.label}</div>
      <div className="mt-3 grid gap-2">
        {group.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const avatar = session?.user?.image;
  const onboardingComplete = Boolean(session?.user?.onboardingComplete);
  const isAdmin = session?.user?.role === "ADMIN";

  function isActiveHref(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => isActiveHref(item.href));

  const mobileLinkClass = MOBILE_LINK_CLASS;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/62 backdrop-blur-xl">
      {isAuthed && !onboardingComplete ? (
        <div className="border-b border-amber-500/20 bg-amber-500/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-amber-100 md:px-6">
            <span>Complete your profile to finish onboarding.</span>
            <Link
              href="/onboarding"
              className="rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-amber-100 hover:bg-amber-400/20"
            >
              Finish now
            </Link>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-amber-200/15 bg-white/10 shadow-[0_0_28px_rgba(251,191,36,0.12)]">
            <Image
              src="/logo.svg"
              alt="JNC logo"
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <div className="leading-tight">
            <p className="whitespace-nowrap text-base font-semibold tracking-tight text-white">
              Jude Nnam Chorale
            </p>
            <p className="hidden whitespace-nowrap text-xs font-medium uppercase tracking-[0.18em] text-amber-100/58 xl:block">
              JNC Platform
            </p>
          </div>
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-5 lg:flex xl:gap-7"
        >
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(isActiveHref(item.href))}
              aria-current={isActiveHref(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <DesktopGroup group={musicHubNav} active={isGroupActive(musicHubNav)} />
          <DesktopGroup group={mediaNav} active={isGroupActive(mediaNav)} />
          <Link
            href={contactNav.href}
            className={navLinkClass(isActiveHref(contactNav.href))}
            aria-current={isActiveHref(contactNav.href) ? "page" : undefined}
          >
            {contactNav.label}
          </Link>
          <NotificationBell />
          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Account menu"
                  className="rounded-2xl border border-white/0 text-white transition hover:border-white/10 hover:bg-white/10 hover:text-white"
                >
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt="Profile"
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-white/10 bg-black text-white"
              >
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">My profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/choristers">Chorister portal</Link>
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin">Admin dashboard</Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className="rounded-2xl text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild className="rounded-2xl">
                <Link href="/auth/register">Create account</Link>
              </Button>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <NotificationBell compact />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="rounded-2xl text-white"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto border-white/10 bg-black text-white">
              <div className="flex min-h-full flex-col">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 grid gap-3">
                  {primaryNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={mobileLinkClass}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <MobileGroup group={musicHubNav} onNavigate={() => setOpen(false)} />
                  <MobileGroup group={mediaNav} onNavigate={() => setOpen(false)} />
                  <Link
                    href={contactNav.href}
                    onClick={() => setOpen(false)}
                    className={mobileLinkClass}
                  >
                    {contactNav.label}
                  </Link>
                  {isAuthed ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className={mobileLinkClass}
                      >
                        My profile
                      </Link>
                      <Link
                        href="/choristers"
                        onClick={() => setOpen(false)}
                        className={mobileLinkClass}
                      >
                        Chorister portal
                      </Link>
                      {isAdmin ? (
                        <Link
                          href="/admin"
                          onClick={() => setOpen(false)}
                          className={mobileLinkClass}
                        >
                          Admin dashboard
                        </Link>
                      ) : null}
                      <Button
                        className="mt-2 rounded-2xl"
                        onClick={() => signOut({ callbackUrl: "/" })}
                      >
                        Log out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className="mt-2 rounded-2xl text-white hover:bg-white/10 hover:text-white"
                      >
                        <Link href="/auth/login" onClick={() => setOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                      <Button asChild className="rounded-2xl">
                        <Link href="/auth/register" onClick={() => setOpen(false)}>
                          Create account
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
