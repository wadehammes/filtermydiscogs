import { isValidViewState } from "src/types/view.types";
import { isValidStoredFiltersPatch } from "src/utils/filtersStorage";
import { isValidStoredTheme } from "src/utils/storedTheme";
import { z } from "zod";

export const userPreferencesPatchSchema = z
  .object({
    persistFilters: z
      .boolean({ error: "persistFilters must be a boolean" })
      .optional(),
    theme: z
      .string()
      .optional()
      .refine((value) => value === undefined || isValidStoredTheme(value), {
        message: "theme must be a supported theme value",
      }),
    view: z
      .object({
        currentView: z.string(),
        previousView: z.string(),
      })
      .optional()
      .refine((value) => value === undefined || isValidViewState(value), {
        message: "view must include valid currentView and previousView values",
      }),
    filters: z
      .unknown()
      .optional()
      .refine(
        (value) => value === undefined || isValidStoredFiltersPatch(value),
        { message: "filters must include valid filter fields" },
      ),
    analyticsConsent: z
      .boolean({ error: "analyticsConsent must be a boolean" })
      .optional(),
  })
  .refine(
    (patch) =>
      patch.persistFilters !== undefined ||
      patch.theme !== undefined ||
      patch.view !== undefined ||
      patch.filters !== undefined ||
      patch.analyticsConsent !== undefined,
    { message: "No supported preference fields to update" },
  );

export const getUserPreferencesPatchError = (patch: unknown): string | null => {
  const parseResult = userPreferencesPatchSchema.safeParse(patch);

  if (parseResult.success) {
    return null;
  }

  return parseResult.error.issues[0]?.message ?? "Invalid request body";
};
