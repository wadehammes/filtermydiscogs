import { ApiFetchError } from "src/api/apiFetchError";
import { getDiscogsApiErrorStatus } from "src/lib/discogsApiError";

export const getErrorHttpStatus = (error: unknown): number | undefined => {
  const discogsStatus = getDiscogsApiErrorStatus(error);
  if (discogsStatus !== undefined) {
    return discogsStatus;
  }

  if (error instanceof ApiFetchError) {
    return error.status;
  }

  return undefined;
};
