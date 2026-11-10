import { getCurrentAuditionSetting } from "@/lib/audition-settings";

export type AuditionBanner =
  | {
      state: "upcoming";
      /** ISO string so it can cross the server/client boundary. */
      startsAt: string;
      year: number;
      dateLabel: string;
      venue: string | null;
      note: string | null;
    }
  | { state: "soon" };

const DATE_FORMAT = new Intl.DateTimeFormat("en-NG", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});

/** Pure: decides what the homepage should say about auditions at `now`. */
export function toAuditionBanner(
  setting: { startsAt: Date | null; venue: string | null; note: string | null } | null,
  now = new Date()
): AuditionBanner {
  if (!setting?.startsAt || setting.startsAt.getTime() <= now.getTime()) {
    return { state: "soon" };
  }

  return {
    state: "upcoming",
    startsAt: setting.startsAt.toISOString(),
    year: Number(
      new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Africa/Lagos" }).format(
        setting.startsAt
      )
    ),
    dateLabel: DATE_FORMAT.format(setting.startsAt),
    venue: setting.venue?.trim() || null,
    note: setting.note?.trim() || null,
  };
}

export async function getAuditionBanner(): Promise<AuditionBanner> {
  try {
    return toAuditionBanner(await getCurrentAuditionSetting());
  } catch (error) {
    // Never take the homepage down because of the audition setting.
    console.error("[audition-banner]", error);
    return { state: "soon" };
  }
}
