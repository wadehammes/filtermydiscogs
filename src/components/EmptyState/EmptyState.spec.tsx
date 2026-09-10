import { beforeEach, describe, expect, it } from "@jest/globals";
import { EmptyStatePageObject } from "src/components/EmptyState/EmptyState.po";
import { screen } from "test-utils";

let po: EmptyStatePageObject;

describe("EmptyState", () => {
  beforeEach(() => {
    po = new EmptyStatePageObject();
  });

  it("renders title and description", () => {
    po.renderEmptyState();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters.")).toBeInTheDocument();
  });

  it("renders page variant title styling", () => {
    po.renderEmptyState({
      variant: "page",
      title: "Nothing on the shelf yet",
      description: "Add records to your Discogs collection.",
    });

    expect(screen.getByText("Nothing on the shelf yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add records to your Discogs collection."),
    ).toBeInTheDocument();
  });

  it("renders optional children and custom test id", () => {
    po.renderEmptyState({
      title: "No crates yet",
      children: <a href="/releases">Go to Releases</a>,
      testId: "fmdCustomEmptyState",
    });

    expect(screen.getByTestId("fmdCustomEmptyState")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to Releases" }),
    ).toHaveAttribute("href", "/releases");
  });
});
