import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseSummaryHero } from "src/components/ReleaseModal/ReleaseSummaryHero.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { render, screen } from "test-utils";

const mockAddToCrate = jest.fn();
const mockRemoveFromCrate = jest.fn();
const mockIsInCrate = jest.fn(() => false);
const mockOpenDrawer = jest.fn();
const mockUseMediaQuery = jest.fn(() => false);

jest.mock("src/context/crate.context", () => {
  const actual = jest.requireActual<typeof import("src/context/crate.context")>(
    "src/context/crate.context",
  );

  return {
    ...actual,
    useCrate: () => ({
      addToCrate: mockAddToCrate,
      removeFromCrate: mockRemoveFromCrate,
      isInCrate: mockIsInCrate,
      openDrawer: mockOpenDrawer,
    }),
  };
});

jest.mock("src/hooks/useMediaQuery.hook", () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useSelectedFormats: () => [],
  useSelectedStyles: () => [],
}));

jest.mock("src/hooks/usePillClickHandler.hook", () => ({
  usePillClickHandler: () => jest.fn(),
}));

describe("ReleaseSummaryHero", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsInCrate.mockReturnValue(false);
    mockUseMediaQuery.mockReturnValue(false);
  });

  it("exports toolbar layout classes for the modal hero structure", async () => {
    const styles = await import("./ReleaseSummaryHero.module.css");

    expect(styles.default.heroToolbar).toBeTruthy();
    expect(styles.default.heroMain).toBeTruthy();
    expect(styles.default.toolbarActions).toBeTruthy();
  });

  it("adds release to crate and opens drawer on desktop", async () => {
    const release = releaseFactory.build();
    const user = userEvent.setup();

    render(<ReleaseSummaryHero release={release} />);

    await user.click(screen.getByRole("button", { name: "Add to crate" }));

    expect(mockAddToCrate).toHaveBeenCalledWith(release);
    expect(mockOpenDrawer).toHaveBeenCalled();
    expect(mockRemoveFromCrate).not.toHaveBeenCalled();
  });

  it("removes release from crate when already in crate", async () => {
    const release = releaseFactory.build();
    const user = userEvent.setup();
    mockIsInCrate.mockReturnValue(true);

    render(<ReleaseSummaryHero release={release} />);

    await user.click(screen.getByRole("button", { name: "Remove from crate" }));

    expect(mockRemoveFromCrate).toHaveBeenCalledWith(release.instance_id);
    expect(mockAddToCrate).not.toHaveBeenCalled();
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  it("does not open drawer on mobile when adding to crate", async () => {
    const release = releaseFactory.build();
    const user = userEvent.setup();
    mockUseMediaQuery.mockReturnValue(true);

    render(<ReleaseSummaryHero release={release} />);

    await user.click(screen.getByRole("button", { name: "Add to crate" }));

    expect(mockAddToCrate).toHaveBeenCalledWith(release);
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  it("shows catalog number, format tags, and style tags", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        labels: [{ name: "Test Label", catno: "ABC-123" }],
        formats: [{ name: "Vinyl", descriptions: ["LP"] }],
        styles: ["Rock", "Indie Rock"],
      },
    });

    render(<ReleaseSummaryHero release={release} />);

    expect(
      screen.getByText(/Test Label · \d{4} · ABC-123/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Vinyl format" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Rock style" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Indie Rock style" }),
    ).toBeInTheDocument();
  });
});
