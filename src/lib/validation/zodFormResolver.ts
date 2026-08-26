import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Resolver,
  ResolverError,
  ResolverResult,
} from "react-hook-form";
import type { z } from "zod";

const toFieldErrors = <TFieldValues extends FieldValues>(
  issues: z.ZodError<TFieldValues>["issues"],
): FieldErrors<TFieldValues> => {
  const errors: Record<string, FieldError> = {};

  for (const issue of issues) {
    const path = issue.path.map(String).join(".");

    if (!path || errors[path]) {
      continue;
    }

    errors[path] = {
      message: issue.message,
      type: issue.code,
    };
  }

  return errors as FieldErrors<TFieldValues>;
};

export const zodFormResolver =
  <TFieldValues extends FieldValues>(
    schema: z.ZodType<TFieldValues>,
  ): Resolver<TFieldValues> =>
  async (values): Promise<ResolverResult<TFieldValues, TFieldValues>> => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    return {
      values: {},
      errors: toFieldErrors(result.error.issues),
    } as ResolverError<TFieldValues>;
  };
