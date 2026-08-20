import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseSimilarReleaseItem } from "src/components/ReleaseSimilarReleaseItem/ReleaseSimilarReleaseItem.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { render, screen } from "test-utils";

const mockAddToCrate = jest.fn();

jest.mock("src/context/crate.context", () => ({
  useCrate: () => ({
    addToCrate: mockAddToCrate,
    removeFromCrate: jest.fn(),
    isInCrate: jest.fn(() => false),
    openDrawer: jest.fn(),
  }),
}));

describe("ReleaseSimilarReleaseItem", () => {
  beforeEach(() => {
    mockAddToCrate.mockReset();
  });

  it("toggles crate staging from the row action", async () => {
    const user = userEvent.setup();
    const similarRelease = releaseFactory.build({
      instance_id: "similar-instance",
      basic_information: {
        ...releaseFactory.withStyles(["Techno", "House"]).basic_information,
        master_id: 200,
        title: "Similar Album",
      },
    });

    render(<ReleaseSimilarReleaseItem release={similarRelease} />, {
      includeCrate: false,
    });

    await user.click(
      screen.getByRole("button", { name: "Add Similar Album to crate" }),
    );

    expect(mockAddToCrate).toHaveBeenCalledWith(similarRelease);
  });
});
