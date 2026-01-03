import { z } from "zod";
export const SubscriptionTierSchema = z.enum(["basic", "pro", "vip"]);
