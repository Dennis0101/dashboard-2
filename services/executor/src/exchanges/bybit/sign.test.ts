import { describe, expect, it } from "vitest";
import { hmacSha256Hex } from "../common/http.js";

describe("bybit signing", () => {
  it("hmac sha256 hex is stable", () => {
    // reference computed by node crypto (deterministic)
    expect(hmacSha256Hex("secret", "payload")).toBe("b82fcb791acec57859b989b430a826488ce2e479fdf92326bd0a2e8375a42ba4");
  });
});

