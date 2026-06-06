import { getEventResponseRowsMap } from "@/lib/event-responses";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "../_components/admin-page-header";
import AdminEventsClient from "./ui/admin-events-client";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    take: 200,
  });

  const responseMap = await getEventResponseRowsMap(events.map((event) => event.id));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Programming"
        title="Events"
        description="Create public events, upload event media, and review audience responses from one page."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Events</p>
            <p className="admin-metric-value">{events.length}</p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Published</p>
            <p className="admin-metric-value">
              {events.filter((event) => event.isPublished).length}
            </p>
          </div>
          <div className="admin-stat-card min-h-0">
            <p className="text-sm text-white/68">Responses</p>
            <p className="admin-metric-value">
              {Array.from(responseMap.values()).reduce(
                (total, responses) => total + responses.length,
                0
              )}
            </p>
          </div>
        </div>
      </AdminPageHeader>

      <AdminEventsClient
        initialEvents={events.map((event) => ({
          ...event,
          responses: responseMap.get(event.id) ?? [],
        }))}
      />
    </div>
  );
}
