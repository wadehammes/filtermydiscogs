import { ApiFetchError, parseRetryAfterMs } from "src/api/apiFetchError";
import {
  messageFromFailedApiResponse,
  parseSuccessResponse,
} from "src/api/endpoints/http";
import { COLLECTION_PAGE_SIZE } from "src/constants/collection";
import type {
  DiscogsCollection,
  DiscogsCollectionFieldsResponse,
} from "src/types";
import type { CollectionValue } from "src/types/dashboard.types";

export interface FetchDiscogsCollectionParams {
  username: string;
  page?: number;
  perPage?: number;
}

export const fetchDiscogsCollection = async ({
  username,
  page = 1,
  perPage = COLLECTION_PAGE_SIZE,
}: FetchDiscogsCollectionParams): Promise<DiscogsCollection> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort: "added",
      sort_order: "desc",
      username,
    });

    const response = await fetch(`/api/collection?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new ApiFetchError(
        response.status,
        await messageFromFailedApiResponse(response),
        parseRetryAfterMs(response),
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch collection");
  }
};

export const fetchCollectionFields = async (
  username: string,
): Promise<DiscogsCollectionFieldsResponse> => {
  try {
    const params = new URLSearchParams({ username });
    const response = await fetch(`/api/collection/fields?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await messageFromFailedApiResponse(response));
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch collection fields");
  }
};

export interface UpdateCollectionNoteParams {
  username: string;
  instanceId: string;
  fieldId: number;
  releaseId: number;
  folderId: number;
  value: string;
}

export const updateCollectionNote = async ({
  username,
  instanceId,
  fieldId,
  releaseId,
  folderId,
  value,
}: UpdateCollectionNoteParams): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(
      `/api/collection/instances/${instanceId}/fields/${fieldId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          releaseId,
          folderId,
          value,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await messageFromFailedApiResponse(response));
    }

    return parseSuccessResponse<{ success: boolean }>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update collection note");
  }
};

interface UpdateReleaseRatingParams {
  username: string;
  releaseId: number;
  rating: number;
}

export const updateReleaseRating = async ({
  username,
  releaseId,
  rating,
}: UpdateReleaseRatingParams): Promise<{
  username: string;
  release_id: number;
  rating: number;
}> => {
  try {
    const response = await fetch(
      `/api/collection/releases/${releaseId}/rating`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          rating,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await messageFromFailedApiResponse(response));
    }

    return parseSuccessResponse<{
      username: string;
      release_id: number;
      rating: number;
    }>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update release rating");
  }
};

interface ClearReleaseRatingParams {
  username: string;
  releaseId: number;
}

export const clearReleaseRating = async ({
  username,
  releaseId,
}: ClearReleaseRatingParams): Promise<{ success: boolean }> => {
  try {
    const params = new URLSearchParams({ username });
    const response = await fetch(
      `/api/collection/releases/${releaseId}/rating?${params.toString()}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(await messageFromFailedApiResponse(response));
    }

    return parseSuccessResponse<{ success: boolean }>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to clear release rating");
  }
};

export const fetchCollectionValue = async (
  username: string,
): Promise<CollectionValue> => {
  try {
    const params = new URLSearchParams({
      username,
    });

    const response = await fetch(`/api/collection/value?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Failed to fetch collection value: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch collection value");
  }
};
