import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createOrUpdateEventResponse,
  getEventResponseSummaryMap,
} from "@/lib/event-responses";
import { prisma } from "@/lib/prisma";

const ResponseSchema = z.object({
  status: z.enum(["ATTENDING", "MAYBE", "NOT_ATTENDING"]),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(5).max(40),
  note: z.string().trim().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = ResponseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid RSVP details" }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { id, isPublished: true },
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const email = parsed.data.email.toLowerCase();

  const saved = await createOrUpdateEventResponse({
    eventId: event.id,
    status: parsed.data.status,
    fullName: parsed.data.fullName,
    email,
    phone: parsed.data.phone,
    note: parsed.data.note?.trim() || null,
  });

  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 503 });
  }

  const summaryMap = await getEventResponseSummaryMap([event.id]);

  return NextResponse.json({
    ok: true,
    summary: summaryMap.get(event.id) ?? {
      attending: 0,
      maybe: 0,
      notAttending: 0,
      total: 0,
    },
  });
}
