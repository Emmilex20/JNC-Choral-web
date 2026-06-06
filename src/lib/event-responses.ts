import { prisma } from "@/lib/prisma";

type EventResponseStatus = "ATTENDING" | "MAYBE" | "NOT_ATTENDING";

type EventResponseRow = {
  id: string;
  eventId: string;
  status: EventResponseStatus;
  fullName: string;
  email: string;
  phone: string;
  note: string | null;
  createdAt: Date;
};

type EventResponseGroupByRow = {
  eventId: string;
  status: EventResponseStatus;
  _count?: {
    _all?: number;
  };
};

type EventResponseModel = {
  groupBy?: (args: unknown) => Promise<EventResponseGroupByRow[]>;
  findMany?: (args: unknown) => Promise<EventResponseRow[]>;
  upsert?: (args: unknown) => Promise<unknown>;
};

function getEventResponseModel() {
  return (prisma as unknown as {
    eventResponse?: EventResponseModel;
  }).eventResponse;
}

function isEventResponseUnavailable(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? (error as { code?: string }).code
      : undefined;

  return code === "P2021" || code === "P2022";
}

export async function getEventResponseSummaryMap(eventIds: string[]) {
  const summaryMap = new Map<
    string,
    { attending: number; maybe: number; notAttending: number; total: number }
  >();

  if (eventIds.length === 0) return summaryMap;

  const eventResponse = getEventResponseModel();
  if (!eventResponse?.groupBy) return summaryMap;

  try {
    const rows = await eventResponse.groupBy({
      by: ["eventId", "status"],
      where: { eventId: { in: eventIds } },
      _count: { _all: true },
    });

    eventIds.forEach((eventId) => {
      summaryMap.set(eventId, {
        attending: 0,
        maybe: 0,
        notAttending: 0,
        total: 0,
      });
    });

    rows.forEach((row) => {
      const current = summaryMap.get(row.eventId) ?? {
        attending: 0,
        maybe: 0,
        notAttending: 0,
        total: 0,
      };

      const count = row._count?._all ?? 0;
      if (row.status === "ATTENDING") current.attending = count;
      if (row.status === "MAYBE") current.maybe = count;
      if (row.status === "NOT_ATTENDING") current.notAttending = count;
      current.total = current.attending + current.maybe + current.notAttending;
      summaryMap.set(row.eventId, current);
    });

    return summaryMap;
  } catch (error) {
    if (isEventResponseUnavailable(error)) return summaryMap;
    throw error;
  }
}

export async function getEventResponseRowsMap(eventIds: string[]) {
  const responseMap = new Map<string, EventResponseRow[]>();

  if (eventIds.length === 0) return responseMap;

  const eventResponse = getEventResponseModel();
  if (!eventResponse?.findMany) return responseMap;

  try {
    const rows = await eventResponse.findMany({
      where: { eventId: { in: eventIds } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        eventId: true,
        status: true,
        fullName: true,
        email: true,
        phone: true,
        note: true,
        createdAt: true,
      },
    });

    rows.forEach((row) => {
      const current = responseMap.get(row.eventId) ?? [];
      current.push(row);
      responseMap.set(row.eventId, current);
    });

    return responseMap;
  } catch (error) {
    if (isEventResponseUnavailable(error)) return responseMap;
    throw error;
  }
}

export async function createOrUpdateEventResponse(input: {
  eventId: string;
  status: EventResponseStatus;
  fullName: string;
  email: string;
  phone: string;
  note: string | null;
}) {
  const eventResponse = getEventResponseModel();
  if (!eventResponse?.upsert) {
    return { ok: false as const, error: "RSVP is temporarily unavailable." };
  }

  try {
    await eventResponse.upsert({
      where: {
        eventId_email: {
          eventId: input.eventId,
          email: input.email,
        },
      },
      create: input,
      update: {
        status: input.status,
        fullName: input.fullName,
        phone: input.phone,
        note: input.note,
      },
    });

    return { ok: true as const };
  } catch (error) {
    if (isEventResponseUnavailable(error)) {
      return {
        ok: false as const,
        error: "RSVP is unavailable until the database migration is applied.",
      };
    }
    throw error;
  }
}
