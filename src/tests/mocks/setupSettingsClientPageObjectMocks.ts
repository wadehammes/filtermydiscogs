import { collectionFactory } from "src/tests/factories/Collection.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  pageObjectApiError,
  pageObjectMockApi,
} from "src/tests/mocks/pageObjectMockedApi";
import { bootstrapAuthenticatedDesktopPageObject } from "src/tests/mocks/setupAuthenticatedDesktopPageObjectMocks";

export const setupSettingsClientPageObjectMocks = (): void => {
  bootstrapAuthenticatedDesktopPageObject();
  wireDefaultUserPreferencesPageObjectMocks();
  wireDefaultUpdateUserPreferencesPageObjectMocks();
  mockApiResponse(
    true,
    pageObjectMockApi.discogsCollection,
    collectionFactory.empty(),
    pageObjectApiError,
  );
  mockApiResponse(
    true,
    pageObjectMockApi.collectionFields,
    discogsCollectionFieldsResponseFactory.forReleaseNotes(),
    pageObjectApiError,
  );
  mockApiResponse(
    true,
    pageObjectMockApi.clearData,
    crateMutationSuccessFactory.build(),
    pageObjectApiError,
  );
  mockApiResponse(
    true,
    pageObjectMockApi.logout,
    crateMutationSuccessFactory.build(),
    pageObjectApiError,
  );
};

export const wireDefaultUserPreferencesPageObjectMocks = (): void => {
  mockApiResponse(
    true,
    pageObjectMockApi.userPreferences,
    userPreferencesFactory.defaultsApiResponse(),
    pageObjectApiError,
  );
};

export const wireDefaultUpdateUserPreferencesPageObjectMocks = (): void => {
  mockApiResponse(
    true,
    pageObjectMockApi.updateUserPreferences,
    userPreferencesFactory.defaultsApiResponse(),
    pageObjectApiError,
  );
};
