import { describe, expect, it } from "@jest/globals";
import { render, screen } from "test-utils";
import { FiltersBarSkeleton } from "./FiltersBarSkeleton.component";

describe("FiltersBarSkeleton", () => {
  it("renders placeholder fields with input chrome", () => {
    const { container } = render(<FiltersBarSkeleton />);

    expect(screen.getByTestId("fmdFiltersBarSkeleton")).toBeInTheDocument();
    expect(container.querySelectorAll("svg")).toHaveLength(5);
  });
});
