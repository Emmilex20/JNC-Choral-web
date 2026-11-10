import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  isAnalyticsEvent,
  isBot,
  normalizePath,
  referrerHost,
  visitorHash,
} from "@/lib/analytics";
import { buildFunnel, fillDays, lagosDay, parseRange } from "@/lib/analytics-report";

describe("analytics input handling", () => {
  it("only accepts known events", () => {
    expect(isAnalyticsEvent("pageview")).toBe(true);
    expect(isAnalyticsEvent("audition_submitted")).toBe(true);
    expect(isAnalyticsEvent("drop table")).toBe(false);
    expect(isAnalyticsEvent(undefined)).toBe(false);
  });

  it("normalises paths and drops queries, hashes and junk", () => {
    expect(normalizePath("/music-hub/quizzes/?a=1#x")).toBe("/music-hub/quizzes");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("//evil.com")).toBeNull();
    expect(normalizePath("https://evil.com")).toBeNull();
    expect(normalizePath("/a b")).toBeNull();
    expect(normalizePath("/" + "a".repeat(300))).toBeNull();
    expect(normalizePath(42)).toBeNull();
  });

  it("keeps only the referrer hostname and ignores the site itself", () => {
    expect(referrerHost("https://www.google.com/search?q=jnc", "www.jncchorale.com")).toBe("google.com");
    expect(referrerHost("https://www.jncchorale.com/about", "www.jncchorale.com")).toBeNull();
    expect(referrerHost("", "x")).toBeNull();
    expect(referrerHost("not a url", "x")).toBeNull();
  });

  it("recognises bots", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Safari/604.1")).toBe(false);
  });
});

describe("visitor hash", () => {
  it("is stable within a day and different across days, ips and browsers", () => {
    const day1 = new Date("2026-11-10T08:00:00Z");
    const later = new Date("2026-11-10T21:00:00Z");
    const day2 = new Date("2026-11-11T08:00:00Z");
    const a = visitorHash("1.1.1.1", "UA", day1);
    expect(visitorHash("1.1.1.1", "UA", later)).toBe(a);
    expect(visitorHash("1.1.1.1", "UA", day2)).not.toBe(a);
    expect(visitorHash("2.2.2.2", "UA", day1)).not.toBe(a);
    expect(visitorHash("1.1.1.1", "Other", day1)).not.toBe(a);
    expect(a).not.toContain("1.1.1.1");
  });
});

describe("report helpers", () => {
  it("parses the range with a safe default", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange("90")).toBe(90);
    expect(parseRange("1000")).toBe(30);
    expect(parseRange(undefined)).toBe(30);
  });

  it("fills missing days with zeros in order", () => {
    const now = new Date("2026-11-10T12:00:00Z");
    const rows = fillDays([{ day: lagosDay(now), pageviews: 5, visitors: 3 }], 3, now);
    expect(rows).toHaveLength(3);
    expect(rows[2]).toEqual({ day: lagosDay(now), pageviews: 5, visitors: 3 });
    expect(rows[0].pageviews).toBe(0);
  });

  it("computes funnel conversion from the previous step", () => {
    const funnel = buildFunnel({
      audition_form_view: 100,
      audition_step_2: 50,
      audition_step_3: 25,
      audition_submitted: 10,
    });
    expect(funnel.map((s) => s.fromPrevious)).toEqual([null, 50, 50, 40]);
    expect(buildFunnel({}).every((s) => s.visitors === 0)).toBe(true);
  });
});
