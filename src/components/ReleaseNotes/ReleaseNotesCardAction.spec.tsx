import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import * as apiHelpers from "src/api/helpers";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render, screen, waitFor } from "test-utils";
import { ReleaseNotesCardAction } from "./ReleaseNotesCardAction.component";
import { ReleaseNotesEditorProvider } from "./ReleaseNotesEditor.context";

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

describe("ReleaseNotesCardAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockApiResponse(
      true,
      mockApi.fetchCollectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      new Error("Failed to fetch collection fields"),
    );
  });

  const renderAction = (release = releaseFactory.withEmptyNotes()) =>
    render(
      <ReleaseNotesEditorProvider release={release}>
        <ReleaseNotesCardAction />
      </ReleaseNotesEditorProvider>,
      { authInitialState: testAuthenticatedAuthState },
    );

  it("does not show a notes indicator when the release has no notes", async () => {
    renderAction();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add release notes" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("fmdReleaseNotesIndicator"),
    ).not.toBeInTheDocument();
  });

  it("shows a notes indicator when the release has notes", async () => {
    const release = releaseFactory.withNotes([
      { field_id: 3, value: "Signed copy" },
    ]);

    renderAction(release);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Edit release notes" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("fmdReleaseNotesIndicator")).toBeInTheDocument();
  });

  it("opens the note edit dialog when clicked", async () => {
    const user = userEvent.setup();

    renderAction();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add release notes" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add release notes" }));

    expect(await screen.findByTestId("fmdNoteEditDialog")).toBeInTheDocument();
  });
});
