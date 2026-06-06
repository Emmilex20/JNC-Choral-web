import { CalendarDays, Sparkles, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminSpotlightsClient from "./ui/admin-spotlights-client";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AdminSpotlightsPage() {
  const [spotlights, featuredUsers] = await Promise.all([
    prisma.choristerSpotlight.findMany({
      orderBy: [{ weekStart: "desc" }, { createdAt: "desc" }],
      take: 120,
      include: {
        featuredUser: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [{ isChorister: true }, { choristerVerified: true }],
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      take: 400,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    }),
  ]);

  const publishedCount = spotlights.filter((spotlight) => spotlight.isPublished).length;
  const latestSpotlight = spotlights[0] ?? null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Chorister Spotlight"
        title="Feature the people inside the sound."
        description="Create weekly member stories with photos, musical journeys, favorite songs, and advice for the public community spotlight page."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <Sparkles className="h-4 w-4 text-amber-100" />
              Spotlights
            </div>
            <p className="admin-metric-value">{spotlights.length}</p>
            <p className="text-sm admin-subtle">{publishedCount} published</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <UsersRound className="h-4 w-4 text-cyan-100" />
              Eligible Members
            </div>
            <p className="admin-metric-value">{featuredUsers.length}</p>
            <p className="text-sm admin-subtle">Chorister-linked accounts</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/68">
              <CalendarDays className="h-4 w-4 text-emerald-100" />
              Latest Week
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">
              {latestSpotlight ? toDateInputValue(latestSpotlight.weekStart) : "None"}
            </p>
            <p className="mt-3 text-sm admin-subtle">
              {latestSpotlight?.name ?? "No spotlight created yet"}
            </p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminSpotlightsClient
        initialSpotlights={spotlights.map((spotlight) => ({
          id: spotlight.id,
          featuredUserId: spotlight.featuredUserId,
          name: spotlight.name,
          photoUrl: spotlight.photoUrl,
          photoPublicId: spotlight.photoPublicId,
          story: spotlight.story,
          musicalJourney: spotlight.musicalJourney,
          favoriteSong: spotlight.favoriteSong,
          advice: spotlight.advice,
          weekStart: toDateInputValue(spotlight.weekStart),
          isPublished: spotlight.isPublished,
          createdAt: spotlight.createdAt.toISOString(),
          updatedAt: spotlight.updatedAt.toISOString(),
          featuredUser: spotlight.featuredUser,
        }))}
        featuredUsers={featuredUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }))}
      />
    </div>
  );
}
