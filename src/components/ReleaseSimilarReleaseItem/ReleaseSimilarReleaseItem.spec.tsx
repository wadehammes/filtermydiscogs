import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { ReleaseSimilarReleaseItem } from "src/components/ReleaseSimilarReleaseItem/ReleaseSimilarReleaseItem.component";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render, screen, waitFor } from "test-utils";

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");
const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();

jest.mock("src/api/urls");

describe("ReleaseSimilarReleaseItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      apiError,
    );
  });

  it("adds a release to a crate from the row action menu", async () => {
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
      authInitialState: testAuthenticatedAuthState,
    });

    await user.click(screen.getByRole("button", { name: "Add to crates" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(defaultCrateWithCount.name, "i"),
      }),
    );

    await waitFor(() => {
      expect(mockApi.addReleaseToCrate).toHaveBeenCalled();
    });
  });
});
