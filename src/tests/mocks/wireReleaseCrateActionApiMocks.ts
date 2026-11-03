import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  pageObjectApiError,
  type pageObjectMockApi,
} from "src/tests/mocks/pageObjectMockedApi";

export const wireReleaseCrateActionApiMocks = (
  mockApi: typeof pageObjectMockApi,
): void => {
  mockApiResponse(
    true,
    mockApi.addReleaseToCrate,
    crateMutationSuccessFactory.build(),
    pageObjectApiError,
  );
  mockApiResponse(
    true,
    mockApi.removeReleaseFromCrate,
    crateMutationSuccessFactory.build(),
    pageObjectApiError,
  );
  mockApiResponse(
    true,
    mockApi.releaseCrateMembership,
    releaseCrateMembershipResponseFactory.build(),
    pageObjectApiError,
  );
};
