import { describe, expect, it } from "@jest/globals";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import {
  expectLastFetchCalledWith,
  expectLastFetchCalledWithBody,
  mockFetchErrorOnce,
  mockFetchJsonOnce,
} from "src/tests/msw/mswFetchTestHelpers";
import { setupMswInJest } from "src/tests/msw/setupMswInJest";
import { clearReleaseRating, updateReleaseRating } from "./collection";

setupMswInJest();

describe("updateReleaseRating", () => {
  it("updates a release rating", async () => {
    mockFetchJsonOnce("put", "/api/collection/releases/249504/rating", {
      username: "testuser",
      release_id: 249504,
      rating: 5,
    });

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
    await expectLastFetchCalledWithBody(
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
    mockFetchErrorOnce("put", "/api/collection/releases/249504/rating", 500);

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
  it("clears a release rating", async () => {
    mockFetchJsonOnce(
      "delete",
      "/api/collection/releases/249504/rating",
      crateMutationSuccessFactory.build(),
    );

    const result = await clearReleaseRating({
      username: "testuser",
      releaseId: 249504,
    });

    expect(result).toEqual({ success: true });
    expectLastFetchCalledWith(
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
