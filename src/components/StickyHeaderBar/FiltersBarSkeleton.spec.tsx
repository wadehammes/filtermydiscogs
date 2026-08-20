import { describe, expect, it } from "@jest/globals";
import { render, screen } from "test-utils";
import { FiltersBarSkeleton } from "./FiltersBarSkeleton.component";
import styles from "./FiltersBarSkeleton.module.css";

describe("FiltersBarSkeleton", () => {
  it("renders placeholder fields with input chrome", () => {
    const { container } = render(<FiltersBarSkeleton />);

    expect(screen.getByTestId("fmdFiltersBarSkeleton")).toBeInTheDocument();
    expect(container.querySelectorAll("svg")).toHaveLength(6);
  });

  it("renders the genre combobox skeleton with filter trigger chrome", () => {
    render(<FiltersBarSkeleton />);

    const genreTrigger = screen
      .getByTestId("fmdFiltersBarSkeleton")
      .querySelector(
        `[data-testid="fmdAutocompleteSelect"] [data-filter-control-trigger]`,
      );

    expect(genreTrigger).toBeInTheDocument();
    expect(genreTrigger).toHaveClass(styles.styleFilterPrimaryShell);
    expect(
      genreTrigger?.querySelector(`.${styles.placeholderLineWide}`),
    ).toBeInTheDocument();
    expect(
      genreTrigger?.querySelector(`.${styles.chevron}`),
    ).toBeInTheDocument();
  });
});
