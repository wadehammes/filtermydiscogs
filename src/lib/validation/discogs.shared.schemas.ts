import { isValidDiscogsUsername } from "src/lib/discogs-username";
import { z } from "zod";

export const discogsUsernameSchema = z
  .string({ error: "Username is required" })
  .min(1, { message: "Username is required" })
  .refine(isValidDiscogsUsername, { message: "Invalid username format" });
