import type { Api } from "src/api/urls";
import { api } from "src/api/urls";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";

const defaultCrateApiError = new Error("Crate API request failed");

export function setupDefaultCrateApiMocks(
  mockApi: jest.Mocked<Api> = jest.mocked(api),
) {
  const defaultCrate = crateFactory.defaultTestCrate();
  const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();

  mockApiResponse(
    true,
    mockApi.crates,
    cratesResponseFactory.withCrate(defaultCrateWithCount),
    defaultCrateApiError,
  );

  mockApiResponse(
    true,
    mockApi.crate,
    crateWithReleasesResponseFactory.empty(defaultCrate),
    defaultCrateApiError,
  );
}
