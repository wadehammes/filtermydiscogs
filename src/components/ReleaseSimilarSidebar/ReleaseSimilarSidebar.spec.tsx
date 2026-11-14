import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseSimilarSidebarPageObject } from "src/components/ReleaseSimilarSidebar/ReleaseSimilarSidebar.po";
import { RELEASE_SIMILAR_SIDEBAR_TITLE } from "src/constants/releaseSimilarSidebar.constants";
import { screen } from "test-utils";

let po: ReleaseSimilarSidebarPageObject;

describe("ReleaseSimilarSidebar", () => {
  beforeEach(() => {
    po = new ReleaseSimilarSidebarPageObject();
  });

  it("renders the similar sidebar root and pool count", () => {
    po.renderReleaseSimilarSidebar({ similarPageCount: 1 });

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByText(RELEASE_SIMILAR_SIDEBAR_TITLE)).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleaseSimilarSidebarCount"),
    ).toHaveTextContent("12 similar");
  });

  it("when pagination handlers are passed, shows page navigation with chevrons", async () => {
    const user = userEvent.setup();
    po.renderReleaseSimilarSidebar();

    expect(
      screen.getByTestId("fmdReleaseSimilarSidebarCount"),
    ).toHaveTextContent("12 similar");
    expect(
      screen.getByTestId("fmdReleaseSimilarSidebarPage"),
    ).toHaveTextContent("2 of 3");

    await user.click(
      screen.getByRole("button", { name: "Next similar releases page" }),
    );

    expect(po.onSimilarPageNext).toHaveBeenCalledTimes(1);
  });

  it("when loading, shows the similar loading state", () => {
    po.renderReleaseSimilarSidebar({
      similarReleases: [],
      isLoading: true,
    });

    expect(
      screen.getByTestId("fmdReleaseSimilarSidebarLoading"),
    ).toBeInTheDocument();
  });
});
