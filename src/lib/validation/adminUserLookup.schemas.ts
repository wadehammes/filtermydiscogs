import { discogsUsernameSchema } from "src/lib/validation/discogs.shared.schemas";
import { z } from "zod";

export const adminUserLookupFormSchema = z.object({
  username: discogsUsernameSchema,
});

export type AdminUserLookupFormValues = z.infer<
  typeof adminUserLookupFormSchema
>;
