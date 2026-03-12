import { getEventResponseRowsMap } from "@/lib/event-responses";
import { prisma } from "@/lib/prisma";
import AdminEventsClient from "./ui/admin-events-client";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    take: 200,
  });

  const responseMap = await getEventResponseRowsMap(events.map((event) => event.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Events</h1>
        <p className="mt-2 text-sm text-white/70">
          Create events and publish them to show on the public Events page.
        </p>
      </div>

      <AdminEventsClient
        initialEvents={events.map((event) => ({
          ...event,
          responses: responseMap.get(event.id) ?? [],
        }))}
      />
    </div>
  );
}
