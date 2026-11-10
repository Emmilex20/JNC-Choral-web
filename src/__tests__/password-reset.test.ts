import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  passwordReset: {
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  user: { findFirst: vi.fn(), update: vi.fn() },
}));
const sendMail = vi.hoisted(() => vi.fn());
const limiter = vi.hoisted(() => ({ consumeRateLimit: vi.fn(), getClientIp: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/mailer", () => ({ sendMail }));
vi.mock("@/lib/rate-limit", () => limiter);

import { requestPasswordResetAction } from "@/app/auth/forgot/actions";
import { resetPasswordAction } from "@/app/auth/reset/actions";
import { hashResetCode } from "@/lib/reset-code";

const EMAIL = "user@example.com";

beforeEach(() => {
  vi.resetAllMocks();
  limiter.consumeRateLimit.mockResolvedValue(true);
  limiter.getClientIp.mockResolvedValue("1.1.1.1");
  sendMail.mockResolvedValue({ ok: true });
});

describe("requestPasswordResetAction", () => {
  it("emails the code and never returns it", async () => {
    db.user.findFirst.mockResolvedValue({ id: "u1", email: EMAIL, passwordHash: "x" });

    const res = await requestPasswordResetAction({ email: "User@Example.com" });

    expect(res).toEqual({ ok: true });
    expect(sendMail).toHaveBeenCalledTimes(1);
    const body = sendMail.mock.calls[0][0].text as string;
    const code = body.match(/\b(\d{6})\b/)?.[1];
    expect(code).toBeTruthy();
    const stored = db.passwordReset.create.mock.calls[0][0].data;
    expect(stored.codeHash).toBe(hashResetCode(EMAIL, code!));
    expect(stored.email).toBe(EMAIL);
  });

  it("answers identically for unknown accounts and sends nothing", async () => {
    db.user.findFirst.mockResolvedValue(null);
    const res = await requestPasswordResetAction({ email: "nobody@example.com" });
    expect(res).toEqual({ ok: true });
    expect(sendMail).not.toHaveBeenCalled();
    expect(db.passwordReset.create).not.toHaveBeenCalled();
  });

  it("is rate limited", async () => {
    limiter.consumeRateLimit.mockResolvedValue(false);
    const res = await requestPasswordResetAction({ email: EMAIL });
    expect(res.ok).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe("resetPasswordAction", () => {
  const record = (over = {}) => ({
    id: "r1",
    email: EMAIL,
    codeHash: hashResetCode(EMAIL, "123456"),
    attempts: 0,
    ...over,
  });
  const valid = { email: EMAIL, code: "123456", password: "Passw0rdOK" };

  it("resets the password with the right code", async () => {
    db.passwordReset.findFirst.mockResolvedValue(record());
    db.user.findFirst.mockResolvedValue({ id: "u1" });
    db.passwordReset.updateMany.mockResolvedValue({ count: 1 });

    expect(await resetPasswordAction(valid)).toEqual({ ok: true });
    expect(db.user.update).toHaveBeenCalledTimes(1);
    expect(db.user.update.mock.calls[0][0].data.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("counts a wrong guess and does not change the password", async () => {
    db.passwordReset.findFirst.mockResolvedValue(record());

    const res = await resetPasswordAction({ ...valid, code: "000000" });

    expect(res.ok).toBe(false);
    expect(db.passwordReset.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { attempts: { increment: 1 } },
    });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects even the correct code after 5 failed attempts", async () => {
    db.passwordReset.findFirst.mockResolvedValue(record({ attempts: 5 }));
    expect((await resetPasswordAction(valid)).ok).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects a code that was claimed concurrently", async () => {
    db.passwordReset.findFirst.mockResolvedValue(record());
    db.user.findFirst.mockResolvedValue({ id: "u1" });
    db.passwordReset.updateMany.mockResolvedValue({ count: 0 });

    expect((await resetPasswordAction(valid)).ok).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects weak passwords and non-numeric codes before touching the db", async () => {
    expect((await resetPasswordAction({ ...valid, password: "weak" })).ok).toBe(false);
    expect((await resetPasswordAction({ ...valid, code: "12ab56" })).ok).toBe(false);
    expect(db.passwordReset.findFirst).not.toHaveBeenCalled();
  });

  it("is rate limited", async () => {
    limiter.consumeRateLimit.mockResolvedValue(false);
    expect((await resetPasswordAction(valid)).ok).toBe(false);
    expect(db.passwordReset.findFirst).not.toHaveBeenCalled();
  });
});
