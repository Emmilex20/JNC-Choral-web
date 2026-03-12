import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma";

const MUSIC_SHEETS_MIGRATION_ERROR =
  "Music sheets are not available yet. Apply the latest database migration and refresh.";

export function isMissingMusicSheetsTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    typeof error.meta?.table === "string" &&
    error.meta.table.includes("MusicSheet")
  );
}

export function getMusicSheetsMigrationErrorMessage() {
  return MUSIC_SHEETS_MIGRATION_ERROR;
}

export async function getMusicSheetAccess(session: Session | null) {
  if (!session?.user?.id) {
    return {
      isSignedIn: false,
      canAccessAllUserSheets: false,
      canAccessChoristerSheets: false,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isChorister: true,
      choristerVerified: true,
    },
  });

  const canAccessChoristerSheets =
    user?.role === "ADMIN" || Boolean(user?.isChorister && user?.choristerVerified);

  return {
    isSignedIn: true,
    canAccessAllUserSheets: true,
    canAccessChoristerSheets,
  };
}

export async function listMusicSheetsForAdmin() {
  try {
    return await prisma.musicSheet.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    });
  } catch (error) {
    if (isMissingMusicSheetsTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function listVisibleMusicSheets(access: {
  isSignedIn: boolean;
  canAccessChoristerSheets: boolean;
}) {
  if (!access.isSignedIn) {
    return [];
  }

  try {
    return await prisma.musicSheet.findMany({
      where: access.canAccessChoristerSheets ? undefined : { audience: "ALL_USERS" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch (error) {
    if (isMissingMusicSheetsTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function findMusicSheetById(id: string) {
  try {
    return {
      sheet: await prisma.musicSheet.findUnique({
        where: { id },
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          mimeType: true,
          audience: true,
        },
      }),
      missingTable: false,
    } as const;
  } catch (error) {
    if (isMissingMusicSheetsTableError(error)) {
      return {
        sheet: null,
        missingTable: true,
      } as const;
    }
    throw error;
  }
}
