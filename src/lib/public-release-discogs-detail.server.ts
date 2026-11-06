import "server-only";

import { connection } from "next/server";
import { cache } from "react";
import {
  getDiscogsApiErrorStatus,
  isDiscogsFetchTimeoutError,
} from "src/lib/discogs-api-error";
import { fetchDiscogsReleaseRecord } from "src/lib/fetchDiscogsReleaseRecord.server";
import { isValidDiscogsReleaseIdParam } from "src/lib/fetchDiscogsReleaseRecordsSequential.server";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

const loadPublicReleaseDiscogsDetailUncached = async (
  releaseId: string,
): Promise<DiscogsReleaseDetail | null> => {
  if (!isValidDiscogsReleaseIdParam(releaseId)) {
    return null;
  }

  await connection();

  const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;

  try {
    const payloadUnknown = await fetchDiscogsReleaseRecord({
      releaseUrl,
      useAuthenticatedSession: false,
    });
    const detail = payloadUnknown as DiscogsReleaseDetail;
    const title = typeof detail.title === "string" ? detail.title.trim() : "";

    if (!title) {
      return null;
    }

    return detail;
  } catch (error) {
    if (getDiscogsApiErrorStatus(error) === 404) {
      return null;
    }

    if (isDiscogsFetchTimeoutError(error)) {
      return null;
    }

    throw error;
  }
};

export const loadPublicReleaseDiscogsDetailForPage = cache(
  loadPublicReleaseDiscogsDetailUncached,
);
