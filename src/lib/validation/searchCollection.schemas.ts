import { z } from "zod";

export const searchCollectionFormSchema = z.object({
  query: z.string(),
});

export type SearchCollectionFormValues = z.infer<
  typeof searchCollectionFormSchema
>;
