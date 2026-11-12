import { beforeEach, describe, expect, it } from "@jest/globals";
import { ReleasesPageLoading } from "src/components/ReleasesClient/ReleasesPageLoading.component";
import { VIEW_STATE_STORAGE_KEY } from "src/constants/storageKeys";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { render, screen } from "test-utils";

describe("ReleasesPageLoading", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the releases workspace shell with a grid skeleton instead of the page spinner", () => {
    setupMockMatchMedia({ desktop: true });
    render(<ReleasesPageLoading ssrView="card" />);

    expect(screen.getByTestId("fmdReleasesSkeleton")).toBeInTheDocument();
    expect(screen.getByTestId("fmdFiltersBarSkeleton")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Collection view mode" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Loading releases...")).toBeInTheDocument();
    expect(screen.getAllByTestId("fmdDesktopReleaseCardSkeleton")).toHaveLength(
      15,
    );
  });

  it("renders a table skeleton when list view is saved on desktop", () => {
    setupMockMatchMedia({ desktop: true });
    localStorage.setItem(
      VIEW_STATE_STORAGE_KEY,
      JSON.stringify({ currentView: "list", previousView: "card" }),
    );

    render(<ReleasesPageLoading />);

    expect(screen.getByTestId("fmdReleasesTableSkeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("fmdDesktopReleaseCardSkeleton")).toBeNull();
  });
});
