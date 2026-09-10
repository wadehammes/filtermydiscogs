import { beforeEach, describe, expect, it } from "@jest/globals";
import { FilterViewsMenuPageObject } from "src/components/FilterViewsMenu/FilterViewsMenu.po";
import iconButtonStyles from "src/styles/modules/icon-button.module.css";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { defaultPersistedFilters } from "src/utils/filtersStorage";
import { createFilterView } from "src/utils/filterViews";
import { screen, waitFor } from "test-utils";
import styles from "./FilterViewsMenu.module.css";

let po: FilterViewsMenuPageObject;

describe("FilterViewsMenu", () => {
  beforeEach(() => {
    po = new FilterViewsMenuPageObject();
  });

  it("renders the Views trigger", () => {
    po.renderFilterViewsMenu();

    expect(
      screen.getByRole("button", { name: "Views and filter actions" }),
    ).toBeInTheDocument();
  });

  it("lays out the Views trigger icon before the label in separate flex children", () => {
    po.renderFilterViewsMenu();

    const button = screen.getByRole("button", {
      name: "Views and filter actions",
    });

    expect(button.className).toContain(iconButtonStyles.labeled);
    expect(button.children[0]).toHaveAttribute("aria-hidden", "true");
    expect(button.children[1]).toHaveClass(styles.menuTriggerLabel);
    expect(button.children[1]).toHaveTextContent("Views");
  });

  it("derives the active saved view when multi-select order differs", async () => {
    const deepAcidFilters = {
      ...defaultPersistedFilters,
      selectedStyles: ["Acid", "Deep House"],
    };
    const savedView = createFilterView("Deep Acid", deepAcidFilters);

    mockApiResponse(
      true,
      po.mockApi.userPreferences,
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
