"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

const userNav = [
  { label: "Events", href: "/events" },
  { label: "News", href: "/news" },
];

const adminNav = [
  { label: "Admin", href: "/admin" },
];

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const role = (session?.user as { role?: string } | null)?.role;
  const avatar = (session?.user as { image?: string } | null)?.image;
  const isAdmin = role === "ADMIN";
  const nav = [
    ...baseNav.slice(0, 3),
    ...(isAdmin ? [] : userNav),
    ...baseNav.slice(3),
    ...(isAdmin ? adminNav : []),
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white/10">
            <img src="/logo.svg" alt="JNC logo" className="h-full w-full object-cover" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">Jude Nnam Choral (JNC)</p>
            <p className="text-xs text-white/70">Choral Platform</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-white/80 hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl text-white hover:bg-white/10 hover:text-white"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile"
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

        <div className="md:hidden">
          {mounted ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-black text-white border-white/10">
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
                        <Link
                          href="/auth/register"
                          onClick={() => setOpen(false)}
                        >
                          Register
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" className="text-white">
              <Menu />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
