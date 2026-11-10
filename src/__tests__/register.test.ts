import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ user: { findFirst: vi.fn(), create: vi.fn() } }));
const limiter = vi.hoisted(() => ({ consumeRateLimit: vi.fn(), getClientIp: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/rate-limit", () => limiter);

import { registerUserAction } from "@/app/auth/register/actions";

const input = { name: "Jane", email: "Jane@Example.com", password: "Passw0rdOK" };

beforeEach(() => {
  vi.resetAllMocks();
  limiter.consumeRateLimit.mockResolvedValue(true);
  limiter.getClientIp.mockResolvedValue("1.1.1.1");
  db.user.findFirst.mockResolvedValue(null);
});

describe("registerUserAction", () => {
  it("stores a lowercased email, USER role and a bcrypt hash", async () => {
    expect(await registerUserAction(input)).toEqual({ ok: true });
    const data = db.user.create.mock.calls[0][0].data;
    expect(data.email).toBe("jane@example.com");
    expect(data.role).toBe("USER");
    expect(data.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("ignores a client-supplied role", async () => {
    await registerUserAction({ ...input, role: "ADMIN" });
    expect(db.user.create.mock.calls[0][0].data.role).toBe("USER");
  });

  it("rejects duplicates regardless of case", async () => {
    db.user.findFirst.mockResolvedValue({ id: "u1" });
    expect((await registerUserAction(input)).ok).toBe(false);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("turns a unique-constraint race into a normal error", async () => {
    db.user.create.mockRejectedValue({ code: "P2002" });
    expect(await registerUserAction(input)).toEqual({
      ok: false,
      error: "Email already exists",
    });
  });

  it("enforces the password policy and the rate limit", async () => {
    expect((await registerUserAction({ ...input, password: "short" })).ok).toBe(false);
    limiter.consumeRateLimit.mockResolvedValue(false);
    expect((await registerUserAction(input)).ok).toBe(false);
    expect(db.user.create).not.toHaveBeenCalled();
  });
});
