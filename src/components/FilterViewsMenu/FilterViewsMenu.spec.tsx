import { beforeEach, describe, expect, it } from "@jest/globals";
import { FilterViewsMenuPageObject } from "src/components/FilterViewsMenu/FilterViewsMenu.po";
import iconButtonStyles from "src/styles/modules/icon-button.module.css";
import {
  persistedFiltersFactory,
  userPreferencesFactory,
} from "src/tests/factories/UserPreferences.factory";
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

  it("bar variant omits the Views label until a saved view is active", () => {
    po.renderFilterViewsMenu();

    const button = screen.getByRole("button", {
      name: "Views and filter actions",
    });

    expect(button).not.toHaveTextContent("Views");
    expect(button).toHaveClass(styles.menuTriggerIconOnly);
    expect(button.children[0]).toHaveAttribute("aria-hidden", "true");
    expect(button.className).toContain(iconButtonStyles.labeled);
  });

  it("drawer variant keeps the Views label when no saved view is active", () => {
    po.renderFilterViewsMenu({ variant: "drawer" });

    const button = screen.getByRole("button", {
      name: "Views and filter actions",
    });

    expect(button).toHaveTextContent("Views");
  });

  it("derives the active saved view when multi-select order differs", async () => {
    const deepAcidFilters = persistedFiltersFactory.withDefaults({
      selectedStyles: ["Acid", "Deep House"],
    });
    const savedView = createFilterView("Deep Acid", deepAcidFilters);

    po.mockUserPreferences(
      userPreferencesFactory.asApiResponse({
        filterViews: [savedView],
      }),
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
