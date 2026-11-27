import { ApiFetchError, parseRetryAfterMs } from "src/api/apiFetchError";
import {
  messageFromFailedApiResponse,
  parseSuccessResponse,
} from "src/api/endpoints/http";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";

export const interpretCollectionCommand = async (
  prompt: string,
): Promise<{ intent: CollectionCommandIntent }> => {
  const response = await fetch("/api/collection/interpret-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new ApiFetchError(
      response.status,
      await messageFromFailedApiResponse(response),
      parseRetryAfterMs(response),
    );
  }

  return parseSuccessResponse(response);
};
