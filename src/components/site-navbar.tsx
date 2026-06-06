"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, User } from "lucide-react";
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

const baseNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Auditions", href: "/auditions" },
  { label: "Contact", href: "/contact" },
];

const mediaNav = [
  { label: "Scores", href: "/scores" },
  { label: "Gallery", href: "/gallery" },
  { label: "Music", href: "/music" },
  { label: "Videos", href: "/videos" },
];

const userNav = [
  { label: "Events", href: "/events" },
  { label: "News", href: "/news" },
  { label: "Academy", href: "/academy" },
  { label: "Choristers", href: "/choristers" },
];

const adminNav = [
  { label: "Admin", href: "/admin" },
];

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const role = session?.user?.role;
  const avatar = session?.user?.image;
  const onboardingComplete = Boolean(session?.user?.onboardingComplete);
  const isAdmin = role === "ADMIN";
  const nav = [
    ...baseNav.slice(0, 3),
    ...userNav,
    ...baseNav.slice(3),
    ...(isAdmin ? adminNav : []),
  ];
  const isMediaActive = mediaNav.some((item) => pathname.startsWith(item.href));

  function isActiveHref(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function navLinkClass(active: boolean) {
    return cn(
      "relative py-2 text-sm font-medium text-white/74 transition duration-200 hover:text-white",
      "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-amber-200 after:transition-transform after:duration-200 hover:after:scale-x-100",
      active && "text-white after:scale-x-100"
    );
  }

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
      <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
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
            <p className="text-base font-semibold tracking-tight text-white">
              Jude Nnam Choral
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-100/58">
              JNC Platform
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(isActiveHref(item.href))}
            >
              {item.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={navLinkClass(isMediaActive)}
              suppressHydrationWarning
            >
              Media
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black text-white border-white/10">
              {mediaNav.map((item) => (
                <DropdownMenuItem key={item.href} asChild className="cursor-pointer">
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <NotificationBell />
          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
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
                className="bg-black text-white border-white/10"
              >
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logout
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
                <Link href="/auth/register">Register</Link>
              </Button>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <NotificationBell compact />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-2xl text-white">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-black text-white border-white/10 overflow-y-auto">
              <div className="flex min-h-full flex-col">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 grid gap-3">
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                      Media
                    </div>
                    <div className="mt-3 grid gap-2">
                      {mediaNav.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {isAuthed ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition"
                      >
                        Profile
                      </Link>
                      <Button
                        className="rounded-2xl mt-2"
                        onClick={() => signOut({ callbackUrl: "/" })}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className="rounded-2xl mt-2 text-white hover:bg-white/10 hover:text-white"
                      >
                        <Link href="/auth/login" onClick={() => setOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                      <Button asChild className="rounded-2xl">
                        <Link href="/auth/register" onClick={() => setOpen(false)}>
                          Register
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
