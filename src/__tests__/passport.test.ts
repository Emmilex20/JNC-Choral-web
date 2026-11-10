import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cloudinary", () => ({
  cloudinary: { url: vi.fn((id: string) => `signed:${id}`) },
}));

import {
  getPassportDeliveryUrl,
  isOwnPrivatePassportUrl,
  parseCloudinaryImageUrl,
} from "@/lib/passport";

const priv = (user: string) =>
  `https://res.cloudinary.com/demo/image/authenticated/s--abc--/v123/jnc-platform/passport-images/${user}/photo1.jpg`;

describe("passport urls", () => {
  it("parses private and public cloudinary image urls", () => {
    expect(parseCloudinaryImageUrl(priv("u1"))).toEqual({
      type: "authenticated",
      publicId: "jnc-platform/passport-images/u1/photo1",
      format: "jpg",
    });
    expect(
      parseCloudinaryImageUrl("https://res.cloudinary.com/demo/image/upload/v1/jnc-platform/x.png")
    ).toMatchObject({ type: "upload", publicId: "jnc-platform/x", format: "png" });
  });

  it("rejects other hosts and schemes", () => {
    expect(parseCloudinaryImageUrl("https://evil.com/image/upload/v1/a.jpg")).toBeNull();
    expect(parseCloudinaryImageUrl("http://res.cloudinary.com/demo/image/upload/v1/a.jpg")).toBeNull();
    expect(parseCloudinaryImageUrl("javascript:alert(1)")).toBeNull();
  });

  it("only accepts new uploads that are private and in the owner's folder", () => {
    expect(isOwnPrivatePassportUrl(priv("u1"), "u1")).toBe(true);
    expect(isOwnPrivatePassportUrl(priv("u2"), "u1")).toBe(false);
    expect(
      isOwnPrivatePassportUrl(
        "https://res.cloudinary.com/demo/image/upload/v1/jnc-platform/passport-images/u1/a.jpg",
        "u1"
      )
    ).toBe(false);
  });

  it("signs private files and passes legacy public ones through", () => {
    expect(getPassportDeliveryUrl(priv("u1"))).toBe("signed:jnc-platform/passport-images/u1/photo1");
    const legacy = "https://res.cloudinary.com/demo/image/upload/v1/jnc-platform/old.jpg";
    expect(getPassportDeliveryUrl(legacy)).toBe(legacy);
    expect(getPassportDeliveryUrl("not a url")).toBeNull();
  });
});
