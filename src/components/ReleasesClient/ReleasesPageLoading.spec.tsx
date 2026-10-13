import { describe, expect, it } from "@jest/globals";
import { ReleasesPageLoading } from "src/components/ReleasesClient/ReleasesPageLoading.component";
import { render, screen } from "test-utils";

describe("ReleasesPageLoading", () => {
  it("renders the releases workspace shell with a grid skeleton instead of the page spinner", () => {
    render(<ReleasesPageLoading />);

    expect(screen.getByTestId("fmdReleasesSkeleton")).toBeInTheDocument();
    expect(screen.getByTestId("fmdFiltersBarSkeleton")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Collection view mode" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Loading releases...")).toBeInTheDocument();
  });
});
