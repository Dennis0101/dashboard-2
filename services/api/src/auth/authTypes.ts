import { z } from "zod";

export const SubscriptionTierSchema = z.enum(["basic", "pro", "vip"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export type AuthContext = {
  userId: string;
  tier: SubscriptionTier;
};

