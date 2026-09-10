import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { ReleasesTableRowActions } from "src/components/ReleasesTable/ReleasesTableRowActions.component";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render, screen } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("ReleasesTableRowActions", () => {
  beforeEach(() => {
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      new Error("API request failed"),
    );
  });

  it("opens release details and notes from icon actions", async () => {
    const release = releaseFactory.forNotesEditor(12345, { notes: [] });
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    render(
      <ReleasePlaybackTestTree>
        <ReleasesTableRowActions
          release={release}
          onReleaseClick={onReleaseClick}
        />
      </ReleasePlaybackTestTree>,
      {
        wrapper: ({ children }) => (
          <TestProviders authInitialState={testAuthenticatedAuthState}>
            {children}
          </TestProviders>
        ),
      },
    );

    await user.click(
      screen.getByRole("button", { name: "Open release details" }),
    );
    expect(onReleaseClick).toHaveBeenCalledWith(release);

    await user.click(screen.getByRole("button", { name: "Add release notes" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
