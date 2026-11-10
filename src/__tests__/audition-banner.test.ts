import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audition-settings", () => ({ getCurrentAuditionSetting: vi.fn() }));

import { toAuditionBanner } from "@/lib/audition-banner";

const now = new Date("2026-11-10T12:00:00Z");

describe("toAuditionBanner", () => {
  it("says coming soon when there is no setting", () => {
    expect(toAuditionBanner(null, now)).toEqual({ state: "soon" });
    expect(toAuditionBanner({ startsAt: null, venue: null, note: null }, now)).toEqual({
      state: "soon",
    });
  });

  it("expires automatically once the audition date has passed", () => {
    const past = new Date("2026-02-01T14:30:00Z");
    expect(toAuditionBanner({ startsAt: past, venue: "Abuja", note: null }, now)).toEqual({
      state: "soon",
    });
  });

  it("shows the date, year and venue for a future audition", () => {
    const future = new Date("2027-02-06T14:30:00Z");
    const banner = toAuditionBanner(
      { startsAt: future, venue: " Wuye, Abuja ", note: "  " },
      now
    );
    expect(banner).toMatchObject({ state: "upcoming", year: 2027, venue: "Wuye, Abuja", note: null });
    if (banner.state === "upcoming") expect(banner.dateLabel).toContain("2027");
  });
});
