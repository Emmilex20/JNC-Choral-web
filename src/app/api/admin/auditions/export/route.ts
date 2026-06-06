import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth";
import { isAdminSession } from "@/lib/authz";
import { getServerSession } from "next-auth";

function escapeCsv(value: unknown) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.auditionApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "id",
    "fullName",
    "phone",
    "email",
    "city",
    "category",
    "voicePart",
    "instrument",
    "instrumentLevel",
    "canSightRead",
    "productionRole",
    "portfolioLink",
    "notes",
    "status",
    "createdAt",
  ];

  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.fullName,
        r.phone,
        r.email,
        r.city,
        r.category,
        r.voicePart,
        r.instrument,
        r.instrumentLevel,
        r.canSightRead,
        r.productionRole,
        r.portfolioLink,
        r.notes,
        r.status,
        r.createdAt.toISOString(),
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="auditions.csv"`,
    },
  });
}
