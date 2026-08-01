import { beforeEach, describe, expect, it } from "@jest/globals";
import { DashboardClientPageObject } from "src/components/Dashboard/DashboardClient.po";
import { screen, waitFor, within } from "test-utils";

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
      screen.getByRole("heading", { level: 1, name: "Collection Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total Releases")).toBeInTheDocument();
    const totalReleasesCard = screen
      .getByText("Total Releases")
      .closest(".statCard");
    expect(totalReleasesCard).toBeTruthy();
    expect(
      within(totalReleasesCard as HTMLElement).getByText("3"),
    ).toBeInTheDocument();
    expect(screen.getByText("Estimated Collection Value")).toBeInTheDocument();
    expect(screen.getByText("$500")).toBeInTheDocument();
    expect(screen.getByText("Collection Health")).toBeInTheDocument();
    expect(screen.getAllByTestId("fmdDynamicChartStub").length).toBeGreaterThan(
      0,
    );
  });

  it("shows loading indication while additional release pages are fetching", async () => {
    po.renderDashboardClient({ paginatedFirstPage: true });

    await waitFor(() => {
      expect(
        screen.getByText("Loading releases… 50 releases loaded"),
      ).toBeInTheDocument();
    });

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();
  });

  it("shows an empty state when the collection has no releases", async () => {
    po.renderDashboardClient({ releaseCount: 0 });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "No collection data" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Your collection appears to be empty."),
    ).toBeInTheDocument();
  });
});
