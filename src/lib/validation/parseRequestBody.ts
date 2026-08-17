import type { z } from "zod";

export type ParseBodyResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: string };

export async function parseRequestBody<T extends z.ZodType>(
  request: Request,
  schema: T,
  options?: { invalidJsonMessage?: string },
): Promise<ParseBodyResult<z.infer<T>>> {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return {
      error: options?.invalidJsonMessage ?? "Invalid request body",
    };
  }

  const parseResult = schema.safeParse(requestBody);

  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    return { error: issue?.message ?? "Invalid request body" };
  }

  return { data: parseResult.data };
}
