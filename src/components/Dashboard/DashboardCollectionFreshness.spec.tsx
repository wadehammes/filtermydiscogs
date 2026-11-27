import { describe, expect, it } from "@jest/globals";
import { DashboardCollectionFreshness } from "src/components/Dashboard/DashboardCollectionFreshness.component";
import { render, screen } from "test-utils";

describe("DashboardCollectionFreshness", () => {
  it("when label is null, renders nothing", () => {
    const { container } = render(<DashboardCollectionFreshness label={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("when label is set, exposes a status line", () => {
    render(<DashboardCollectionFreshness label="Collection synced just now" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Collection synced just now",
    );
  });
});
