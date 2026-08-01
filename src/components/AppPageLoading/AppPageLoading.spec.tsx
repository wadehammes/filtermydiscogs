import { describe, expect, it } from "@jest/globals";
import { render, screen } from "test-utils";
import { AppPageLoading } from "./AppPageLoading.component";

jest.mock("src/components/StickyHeaderBar/StickyHeaderBar.component", () => ({
  StickyHeaderBar: () => <div data-testid="sticky-header-bar" />,
}));

describe("AppPageLoading", () => {
  it("combines loading message with loaded count", () => {
    render(
      <AppPageLoading currentPage="dashboard" loadedCount={400}>
        <div data-testid="skeleton" />
      </AppPageLoading>,
    );

    expect(
      screen.getByText("Loading releases… 400 releases loaded"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("combines releases loading message with loaded count", () => {
    render(
      <AppPageLoading currentPage="releases" loadedCount={400}>
        <div data-testid="skeleton" />
      </AppPageLoading>,
    );

    expect(
      screen.getByText("Loading releases… 400 loaded"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("shows default message without loaded count", () => {
    render(<AppPageLoading currentPage="mosaic" />);

    expect(screen.getByText("Loading mosaic...")).toBeInTheDocument();
  });
});
