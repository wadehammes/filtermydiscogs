import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  mockFetchError,
  mockFetchSuccess,
  resetFetchMock,
} from "src/tests/mocks/mockFetchResponse";
import { clearReleaseRating, updateReleaseRating } from "./helpers";

global.fetch = jest.fn();
const mockFetch = jest.mocked(fetch);

describe("updateReleaseRating", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("updates a release rating", async () => {
    mockFetch.mockResolvedValueOnce(
      mockFetchSuccess({
        username: "testuser",
        release_id: 249504,
        rating: 5,
      }),
    );

    const result = await updateReleaseRating({
      username: "testuser",
      releaseId: 249504,
      rating: 5,
    });

    expect(result).toEqual({
      username: "testuser",
      release_id: 249504,
      rating: 5,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/collection/releases/249504/rating",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: "testuser",
          rating: 5,
        }),
      },
    );
  });

  it("throws when the response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(500));

    await expect(
      updateReleaseRating({
        username: "testuser",
        releaseId: 249504,
        rating: 5,
      }),
    ).rejects.toThrow();
  });
});

describe("clearReleaseRating", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("clears a release rating", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));

    const result = await clearReleaseRating({
      username: "testuser",
      releaseId: 249504,
    });

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/collection/releases/249504/rating?username=testuser",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );
  });
});
