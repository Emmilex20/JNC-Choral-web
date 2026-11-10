import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  choristerProfile: { findUnique: vi.fn(), upsert: vi.fn() },
}));
const session = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("next-auth", () => ({ getServerSession: session }));
vi.mock("@/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/notifications", () => ({
  createOrUpdateNotification: vi.fn(),
  NotificationAudience: {},
  NotificationType: {},
}));
vi.mock("@/lib/gamification", () => ({ updateGamificationForUser: vi.fn() }));

import { upsertChoristerProfileAction } from "@/app/choristers/actions";
import { PASSPORT_KEEP } from "@/lib/passport";

const stored =
  "https://res.cloudinary.com/demo/image/authenticated/s--x--/v1/jnc-platform/passport-images/u1/a.jpg";

beforeEach(() => {
  vi.resetAllMocks();
  session.mockResolvedValue({ user: { id: "u1" } });
  db.user.findUnique.mockResolvedValue({ id: "u1", role: "USER", isChorister: true, choristerVerified: true });
  db.choristerProfile.findUnique.mockResolvedValue({ passportImageUrl: stored });
});

describe("upsertChoristerProfileAction passport handling", () => {
  it("keeps the stored passport when the browser sends the keep marker", async () => {
    const res = await upsertChoristerProfileAction({ phone: "123", passportImageUrl: PASSPORT_KEEP });
    expect(res.ok).toBe(true);
    const update = db.choristerProfile.upsert.mock.calls[0][0].update;
    expect("passportImageUrl" in update).toBe(false);
  });

  it("accepts a new private upload in the user's own folder", async () => {
    const url = stored.replace("a.jpg", "b.jpg");
    expect((await upsertChoristerProfileAction({ passportImageUrl: url })).ok).toBe(true);
    expect(db.choristerProfile.upsert.mock.calls[0][0].update.passportImageUrl).toBe(url);
  });

  it("rejects public, foreign-folder and non-cloudinary passport URLs", async () => {
    for (const url of [
      "https://res.cloudinary.com/demo/image/upload/v1/jnc-platform/passport-images/u1/a.jpg",
      stored.replace("/u1/", "/u2/").replace("a.jpg", "z.jpg"),
      "https://evil.com/x.jpg",
    ]) {
      expect((await upsertChoristerProfileAction({ passportImageUrl: url })).ok).toBe(false);
    }
    expect(db.choristerProfile.upsert).not.toHaveBeenCalled();
  });
});
