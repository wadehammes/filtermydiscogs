import { beforeEach, describe, expect, it } from "@jest/globals";
import { COLLECTION_LOADING_TOAST_ID } from "src/components/CollectionLoadingToast/collectionLoadingToast";
import { DashboardClientPageObject } from "src/components/Dashboard/DashboardClient.po";
import { toast } from "src/utils/toast";
import { screen, waitFor } from "test-utils";

jest.mock("src/utils/toast", () => ({
  toast: {
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const mockToastLoading = jest.mocked(toast.loading);

let po: DashboardClientPageObject;

describe("DashboardClient", () => {
  beforeEach(() => {
    po = new DashboardClientPageObject();
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
    expect(screen.getByText("Exact Duplicates")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "This week" }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("fmdChartStub").length).toBeGreaterThan(0);
  });

  it("shows loading indication while additional release pages are fetching", async () => {
    po.renderDashboardClient({ paginatedFirstPage: true });

    await waitFor(() => {
      expect(mockToastLoading).toHaveBeenCalledWith(
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
      expect(
        screen.getByRole("heading", { name: "Nothing on the shelf yet" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Add records to your Discogs collection to see them here.",
      ),
    ).toBeInTheDocument();
  });
});
