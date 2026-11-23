import { z } from "zod";

export const adminWelcomeEmailSendBodySchema = z.object({
  discogsUserId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
