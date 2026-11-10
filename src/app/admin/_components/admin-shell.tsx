"use client";

import type { ElementType, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BellRing,
  BookOpenText,
  CalendarDays,
  ClipboardList,
  Home,
  Images,
  LayoutDashboard,
  Megaphone,
  Menu,
  Music2,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  UserCog,
  UsersRound,
  Video,
  BarChart3,
  LifeBuoy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
  /** Open-item counts per nav href, shown as badges (e.g. pending reviews). */
  badges?: Record<string, number>;
  userName?: string | null;
  userEmail?: string | null;
};

type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: ElementType;
  exact?: boolean;
};

const navGroups: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        description: "What needs your attention",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        description: "Visits, sources and funnels",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/admin/auditions",
        label: "Auditions",
        description: "Applications and schedule",
        icon: ClipboardList,
      },
      {
        href: "/admin/choristers/pending",
        label: "Verification requests",
        description: "Approve chorister access",
        icon: UserCheck,
      },
      {
        href: "/admin/choristers",
        label: "Choristers",
        description: "Profiles and attendance",
        icon: UsersRound,
      },
      {
        href: "/admin/rehearsals",
        label: "Rehearsals",
        description: "Dates and attendance",
        icon: CalendarDays,
      },
      {
        href: "/admin/choristers/notices",
        label: "Member notices",
        description: "Private updates",
        icon: BellRing,
      },
      {
        href: "/admin/users",
        label: "Users & roles",
        description: "Accounts and access",
        icon: UserCog,
      },
    ],
  },
  {
    label: "Website",
    items: [
      {
        href: "/admin/events",
        label: "Events",
        description: "Concerts and programmes",
        icon: CalendarDays,
      },
      {
        href: "/admin/announcements",
        label: "News",
        description: "Public updates",
        icon: Megaphone,
      },
      {
        href: "/admin/gallery",
        label: "Gallery",
        description: "Photos",
        icon: Images,
      },
      {
        href: "/admin/videos",
        label: "Videos",
        description: "Performance videos",
        icon: Video,
      },
      {
        href: "/admin/music",
        label: "Music & scores",
        description: "Tracks and scores bank",
        icon: Music2,
      },
    ],
  },
  {
    label: "Learning",
    items: [
      {
        href: "/admin/academy",
        label: "Academy",
        description: "Articles, quizzes, daily challenge",
        icon: BookOpenText,
      },
      {
        href: "/admin/challenges",
        label: "Music challenges",
        description: "Prompts and submissions",
        icon: Trophy,
      },
      {
        href: "/admin/spotlights",
        label: "Spotlights",
        description: "Weekly member stories",
        icon: Sparkles,
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        href: "/admin/help",
        label: "Admin guide",
        description: "How to do common tasks",
        icon: LifeBuoy,
      },
    ],
  },
];

const navItems = navGroups.flatMap((group) => group.items);

function isActive(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getCurrentItem(pathname: string) {
  return (
    [...navItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isActive(pathname, item)) ?? navItems[0]
  );
}

function AdminBrand() {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-3">
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-amber-200/20 bg-white/[0.08]">
        <Image src="/logo.svg" alt="JNC logo" fill sizes="48px" className="object-cover" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold text-white">
          JNC Admin
        </span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/62">
          Management console
        </span>
      </span>
    </Link>
  );
}

function AdminNav({
  pathname,
  mobile = false,
  badges = {},
}: {
  pathname: string;
  mobile?: boolean;
  badges?: Record<string, number>;
}) {
  return (
    <nav aria-label="Admin" className="grid gap-5">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/38">
            {group.label}
          </p>
          <div className="mt-1.5 grid gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              const count = badges[item.href] ?? 0;
              const link = (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                    active
                      ? "border-amber-200/28 bg-amber-200/12 text-white"
                      : "border-transparent text-white/70 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", active ? "text-amber-100" : "text-white/55")}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
                  {count > 0 ? (
                    <span
                      className="rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-semibold text-black"
                      aria-label={`${count} waiting`}
                    >
                      {count}
                    </span>
                  ) : null}
                </Link>
              );

              return mobile ? (
                <SheetClose key={item.href} asChild>
                  {link}
                </SheetClose>
              ) : (
                <div key={item.href}>{link}</div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AdminShell({ children, userName, userEmail, badges }: AdminShellProps) {
  const pathname = usePathname();
  const current = getCurrentItem(pathname);
  const CurrentIcon = current.icon;
  const currentGroup =
    navGroups.find((group) => group.items.some((item) => item.href === current.href))?.label ?? "Overview";

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-white/10 bg-black/34 px-4 py-5 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <AdminBrand />
          <div className="mt-6">
            <AdminNav pathname={pathname} badges={badges} />
          </div>
          <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-200" />
              <span className="text-sm font-semibold">Admin access</span>
            </div>
            <p className="mt-2 truncate text-xs text-white/55">
              {userEmail ?? userName ?? "Authorized account"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/">Site</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#040712]/82 backdrop-blur-xl">
          <div className="flex min-h-[4.5rem] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[21rem] border-white/10 bg-[#030711] p-0 text-white"
                  >
                    <SheetHeader className="border-b border-white/10 p-5 text-left">
                      <SheetTitle className="text-white">
                        <AdminBrand />
                      </SheetTitle>
                      <SheetDescription className="text-white/55">
                        Choose a section.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="overflow-y-auto px-4 py-5">
                      <AdminNav pathname={pathname} mobile badges={badges} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 lg:flex">
                <CurrentIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-white/50">
                  Admin <span aria-hidden>/</span> {currentGroup}
                </p>
                <h1 className="truncate text-lg font-semibold text-white sm:text-xl">
                  {current.label}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="hidden rounded-full bg-white/[0.08] px-3 py-1.5 text-white/76 hover:bg-white/[0.08] sm:inline-flex">
                {userName ?? "Administrator"}
              </Badge>
              <Button
                asChild
                variant="outline"
                className="hidden rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 sm:inline-flex"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                  View Site
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[94rem] px-4 py-6 sm:px-6 lg:px-8 xl:py-8">
          {children}
        </div>
      </section>
    </div>
  );
}
