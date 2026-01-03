import { describe, expect, it } from "vitest";
import { signSessionJwt, verifySessionJwt } from "./jwt.js";

describe("jwt session", () => {
  it("sign/verify roundtrip", async () => {
    const secret = "0123456789abcdef0123456789abcdef";
    const token = await signSessionJwt({ secret, userId: "3f3e58b1-6a0e-4ef8-bc7c-2e6c88888888", tier: "basic", expiresIn: "10m" });
    const claims = await verifySessionJwt({ secret, token });
    expect(claims.sub).toBe("3f3e58b1-6a0e-4ef8-bc7c-2e6c88888888");
    expect(claims.tier).toBe("basic");
  });
});

