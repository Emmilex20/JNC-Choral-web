import { describe, expect, it } from "vitest";

import { hashResetCode, safeEqualHex } from "@/lib/reset-code";
import { passwordSchema } from "@/lib/password";
import { safeJsonLd } from "@/lib/json-ld";
import { ipFromHeaders } from "@/lib/rate-limit";

describe("reset code hashing", () => {
  it("matches the same email+code and rejects others", () => {
    const hash = hashResetCode("a@b.com", "123456");
    expect(safeEqualHex(hash, hashResetCode("a@b.com", "123456"))).toBe(true);
    expect(safeEqualHex(hash, hashResetCode("a@b.com", "654321"))).toBe(false);
    expect(safeEqualHex(hash, hashResetCode("c@d.com", "123456"))).toBe(false);
  });

  it("does not throw on malformed hashes", () => {
    expect(safeEqualHex("zz", "abcd")).toBe(false);
  });
});

describe("password policy", () => {
  it.each([
    ["short1", false],
    ["nodigitsatall", false],
    ["12345678", false],
    ["Passw0rdOK", true],
    ["a1".repeat(36), true],
    ["a1".repeat(37), false],
  ])("%s -> %s", (value, ok) => {
    expect(passwordSchema.safeParse(value).success).toBe(ok);
  });
});

describe("safeJsonLd", () => {
  it("cannot break out of a script tag", () => {
    const out = safeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("ipFromHeaders", () => {
  it("uses the first forwarded address", () => {
    const get = (n: string) => (n === "x-forwarded-for" ? "1.2.3.4, 5.6.7.8" : null);
    expect(ipFromHeaders(get)).toBe("1.2.3.4");
  });

  it("falls back to unknown", () => {
    expect(ipFromHeaders(() => null)).toBe("unknown");
  });
});

import { safeHttpUrl } from "@/lib/safe-url";
import { auditionSchema } from "@/lib/audition-schema";

describe("safeHttpUrl", () => {
  it("allows http(s) and neutralises everything else", () => {
    expect(safeHttpUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(safeHttpUrl("javascript:alert(1)")).toBe("#");
    expect(safeHttpUrl("data:text/html,x")).toBe("#");
    expect(safeHttpUrl("not a url")).toBe("#");
    expect(safeHttpUrl(null)).toBe("#");
  });
});

describe("auditionSchema", () => {
  const base = {
    fullName: "Jane Doe",
    phone: "08012345678",
    email: "jane@example.com",
    category: "SINGER" as const,
    voicePart: "ALTO" as const,
  };

  it("rejects non-http portfolio links and oversized notes", () => {
    expect(auditionSchema.safeParse({ ...base, portfolioLink: "javascript:alert(1)" }).success).toBe(false);
    expect(auditionSchema.safeParse({ ...base, notes: "x".repeat(2001) }).success).toBe(false);
  });

  it("accepts a normal application", () => {
    expect(auditionSchema.safeParse({ ...base, portfolioLink: "https://example.com" }).success).toBe(true);
  });
});
