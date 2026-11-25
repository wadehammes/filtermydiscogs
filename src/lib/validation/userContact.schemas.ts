import { z } from "zod";

const userEmailSchema = z
  .string()
  .trim()
  .max(320, { message: "email must be 320 characters or fewer" })
  .email({ message: "email must be a valid email address" });

export const settingsAccountEmailFormSchema = z.object({
  email: z.union([userEmailSchema, z.literal("")]),
});

export type SettingsAccountEmailFormValues = z.infer<
  typeof settingsAccountEmailFormSchema
>;

export const userContactPatchSchema = z
  .object({
    email: z.union([userEmailSchema, z.literal(""), z.null()]).optional(),
    marketingEmailsOptIn: z
      .boolean({ error: "marketingEmailsOptIn must be a boolean" })
      .optional(),
    resendEmailVerification: z.literal(true).optional(),
  })
  .refine(
    (value) =>
      value.email !== undefined ||
      value.marketingEmailsOptIn !== undefined ||
      value.resendEmailVerification === true,
    { message: "At least one contact field is required" },
  )
  .refine(
    (value) =>
      value.resendEmailVerification !== true ||
      (value.email === undefined && value.marketingEmailsOptIn === undefined),
    {
      message:
        "resendEmailVerification must be the only field in the request body",
    },
  );
