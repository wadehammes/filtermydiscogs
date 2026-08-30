import { z } from "zod";

const trackMetadataLookupSchema = z.object({
  id: z.string().trim().min(1, "lookup id is required"),
  artist: z.string().trim().min(1, "artist is required"),
  title: z.string().trim().min(1, "title is required"),
});

export const trackMetadataBatchRequestSchema = z.object({
  lookups: z
    .array(trackMetadataLookupSchema)
    .min(1, "At least one lookup is required")
    .max(20, "No more than 20 lookups per request"),
});
