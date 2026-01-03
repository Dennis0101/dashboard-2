import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";

// NOTE: This is a “production direction” verifier.
// In development, you may allow unsigned tokens to unblock UI wiring,
// but production MUST verify signature + issuer + audience.

export const ProviderSchema = z.enum(["google", "apple"]);
export type Provider = z.infer<typeof ProviderSchema>;

export type VerifiedIdentity = {
  provider: Provider;
  subject: string; // stable provider user id
  email?: string;
};

const GoogleIssuer = "https://accounts.google.com";
const GoogleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

const AppleIssuer = "https://appleid.apple.com";
const AppleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export async function verifyProviderIdToken(params: {
  provider: Provider;
  idToken: string;
  // audience/client_id for your app (must be configured in prod)
  audience?: string;
  acceptUnsignedDevTokens?: boolean;
}): Promise<VerifiedIdentity> {
  const { provider, idToken, audience, acceptUnsignedDevTokens } = params;

  if (acceptUnsignedDevTokens) {
    // dev-only: accept a trivial token format "dev:<subject>"
    if (idToken.startsWith("dev:")) {
      return { provider, subject: idToken.slice(4) };
    }
  }

  if (!audience) throw new Error("audience is required to verify idToken");

  if (provider === "google") {
    const { payload } = await jwtVerify(idToken, GoogleJwks, { issuer: GoogleIssuer, audience });
    return {
      provider,
      subject: String(payload.sub),
      email: payload.email ? String(payload.email) : undefined
    };
  }

  const { payload } = await jwtVerify(idToken, AppleJwks, { issuer: AppleIssuer, audience });
  return {
    provider,
    subject: String(payload.sub),
    email: payload.email ? String(payload.email) : undefined
  };
}

