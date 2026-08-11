import { describe, expect, it } from "@jest/globals";
import { render, screen } from "test-utils";
import { AppPageLoading } from "./AppPageLoading.component";

jest.mock("src/components/StickyHeaderBar/StickyHeaderBar.component", () => ({
  StickyHeaderBar: () => <div data-testid="sticky-header-bar" />,
}));

describe("AppPageLoading", () => {
  it("renders skeleton children without an inline status bar", () => {
    render(
      <AppPageLoading currentPage="dashboard" loadedCount={400}>
        <div data-testid="skeleton" />
      </AppPageLoading>,
    );

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(
      screen.queryByText("Loading releases… 400 releases loaded"),
    ).not.toBeInTheDocument();
  });

  it("shows default message without loaded count", () => {
    render(<AppPageLoading currentPage="mosaic" />);

    expect(screen.getByText("Loading mosaic...")).toBeInTheDocument();
  });
});
