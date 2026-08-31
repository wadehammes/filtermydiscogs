import { beforeEach, describe, expect, it } from "@jest/globals";
import { api } from "src/api/urls";
import { FilterViewsMenuPageObject } from "src/components/FilterViewsMenu/FilterViewsMenu.po";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { defaultPersistedFilters } from "src/utils/filtersStorage";
import { createFilterView } from "src/utils/filterViews";
import { screen, waitFor } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(api);

let po: FilterViewsMenuPageObject;

describe("FilterViewsMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    setupMockMatchMedia({ desktop: true });
    po = new FilterViewsMenuPageObject();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      new Error("Preferences request failed"),
    );
    mockApiResponse(
      true,
      mockApi.updateUserPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      new Error("Preferences update failed"),
    );
  });

  it("renders the Views trigger", () => {
    po.renderFilterViewsMenu();

    expect(
      screen.getByRole("button", { name: "Views and filter actions" }),
    ).toBeInTheDocument();
  });

  it("derives the active saved view when multi-select order differs", async () => {
    const deepAcidFilters = {
      ...defaultPersistedFilters,
      selectedStyles: ["Acid", "Deep House"],
    };
    const savedView = createFilterView("Deep Acid", deepAcidFilters);

    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.asApiResponse({
        filterViews: [savedView],
      }),
      new Error("Preferences request failed"),
    );

    po.renderFilterViewsMenu({
      sessionFilters: {
        selectedStyles: ["Deep House", "Acid"],
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Views, Deep Acid selected" }),
      ).toBeInTheDocument();
    });
  });
});
