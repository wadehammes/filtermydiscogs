import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  COLLECTION_LOADING_TOAST_ID,
  DashboardClientPageObject,
} from "src/components/Dashboard/DashboardClient.po";
import { screen, waitFor } from "test-utils";

type CollectionLoadState = ReturnType<
  typeof import("src/hooks/useCollectionData.hook").useCollectionLoadState
>;

const mockUseCollectionLoadState: jest.Mock<() => CollectionLoadState> =
  jest.fn();

jest.mock("src/hooks/usePaintDeferredMount.hook", () => ({
  usePaintDeferredMount: (ready: boolean) => ready,
}));

jest.mock("src/hooks/useCollectionData.hook", () => {
  const actual = jest.requireActual<
    typeof import("src/hooks/useCollectionData.hook")
  >("src/hooks/useCollectionData.hook");

  return {
    ...actual,
    useCollectionLoadState: () => mockUseCollectionLoadState(),
  };
});

const restoreUseCollectionLoadStateMock = () => {
  const actual = jest.requireActual<
    typeof import("src/hooks/useCollectionData.hook")
  >("src/hooks/useCollectionData.hook");
  mockUseCollectionLoadState.mockImplementation(() =>
    actual.useCollectionLoadState(),
  );
};

let po: DashboardClientPageObject;

describe("DashboardClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreUseCollectionLoadStateMock();
    po = new DashboardClientPageObject();
  });

  it("does not flash empty state while collection context is still fetching", () => {
    mockUseCollectionLoadState.mockReturnValue({
      isLoading: false,
      isError: false,
      queryError: null,
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    po.renderDashboardClient({ releaseCount: 3 });

    expect(screen.queryByTestId("fmdEmptyState")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nothing on the shelf yet"),
    ).not.toBeInTheDocument();
  });

  it("renders the dashboard with stats after the collection loads", async () => {
    po.renderDashboardClient({ releaseCount: 3 });

    await waitFor(() => {
      expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "testuser's collection",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("fmdDashboardHeroCount")).toHaveAttribute(
      "aria-label",
      "3",
    );
    expect(screen.getByText("Estimated value")).toBeInTheDocument();
    expect(screen.getByText("$500")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Exact Duplicates")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { level: 2, name: "This week" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByTestId("fmdChartStub").length).toBeGreaterThan(0);
    });
  });

  it("shows loading indication while additional release pages are fetching", async () => {
    po.renderDashboardClient({ paginatedFirstPage: true });

    await waitFor(() => {
      expect(po.mockToastLoading).toHaveBeenCalledWith(
        "Loading 2,500 releases from Discogs…",
        expect.objectContaining({
          id: COLLECTION_LOADING_TOAST_ID,
          duration: Number.POSITIVE_INFINITY,
          position: "bottom-center",
        }),
      );
    });

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();
  });

  it("shows an empty state when the collection has no releases", async () => {
    po.renderDashboardClient({ releaseCount: 0 });

    await waitFor(() => {
      expect(screen.getByTestId("fmdEmptyState")).toBeInTheDocument();
      expect(screen.getByText("Nothing on the shelf yet")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Add records to your Discogs collection to see them here.",
      ),
    ).toBeInTheDocument();
  });
});
