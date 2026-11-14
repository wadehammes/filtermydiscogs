import { beforeEach, describe, expect, it } from "@jest/globals";
import { ReleaseSimilarSidebarPageObject } from "src/components/ReleaseSimilarSidebar/ReleaseSimilarSidebar.po";
import { RELEASE_SIMILAR_SIDEBAR_TITLE } from "src/constants/releaseSimilarSidebar.constants";
import { screen } from "test-utils";

let po: ReleaseSimilarSidebarPageObject;

describe("ReleaseSimilarSidebar", () => {
  beforeEach(() => {
    po = new ReleaseSimilarSidebarPageObject();
  });

  it("renders the similar sidebar root and pool count", () => {
    po.renderReleaseSimilarSidebar();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByText(RELEASE_SIMILAR_SIDEBAR_TITLE)).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleaseSimilarSidebarCount"),
    ).toHaveTextContent("12 similar");
  });

  it("when shuffle handlers are passed, shows the shuffle control", () => {
    po.renderReleaseSimilarSidebar();

    expect(
      screen.getByRole("button", { name: "Shuffle similar releases" }),
    ).toBeInTheDocument();
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
