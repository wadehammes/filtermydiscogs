import type * as ApiHelpers from "src/api/helpers";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";

const defaultCrateApiError = new Error("Crate API request failed");

/** Satisfy CrateProvider queries when tests mock `src/api/helpers` but omit crate endpoints. */
export function setupDefaultCrateApiMocks(
  mockApi: jest.Mocked<typeof ApiHelpers>,
) {
  const defaultCrate = crateFactory.defaultTestCrate();
  const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();

  mockApiResponse(
    true,
    mockApi.fetchCrates,
    cratesResponseFactory.withCrate(defaultCrateWithCount),
    defaultCrateApiError,
  );

  mockApiResponse(
    true,
    mockApi.fetchCrate,
    crateWithReleasesResponseFactory.empty(defaultCrate),
    defaultCrateApiError,
  );
}
