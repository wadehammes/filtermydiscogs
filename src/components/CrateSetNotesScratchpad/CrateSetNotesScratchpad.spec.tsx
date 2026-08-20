import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import * as apiHelpers from "src/api/helpers";
import { CrateDrawerProvider } from "src/components/CrateDrawer/CrateDrawer.context";
import {
  crateDrawerDefaultCrate,
  crateDrawerDefaultDetail,
  crateDrawerReleaseUnpacked,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CrateSetNotesScratchpad } from "src/components/CrateSetNotesScratchpad/CrateSetNotesScratchpad.component";
import { CRATE_NOTES_MAX_LENGTH } from "src/constants/crate";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render, screen, waitFor, within } from "test-utils";

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

const renderScratchpad = (ui: ReactElement = <CrateSetNotesScratchpad />) =>
  render(<CrateDrawerProvider>{ui}</CrateDrawerProvider>, {
    wrapper: ({ children }) => (
      <TestProviders authInitialState={testAuthenticatedAuthState}>
        {children}
      </TestProviders>
    ),
  });

describe("CrateSetNotesScratchpad", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);

    mockApi.fetchCrates.mockResolvedValue(
      cratesResponseFactory.withCrates([
        { ...crateDrawerDefaultCrate, notes: null },
      ]),
    );
    mockApi.fetchCrate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleases(
        { ...crateDrawerDefaultDetail, notes: null },
        [crateDrawerReleaseUnpacked],
      ),
    );
  });

  it("renders an inline textarea with placeholder and char counter", async () => {
    renderScratchpad();

    const scratchpad = await screen.findByTestId("fmdCrateSetNotesScratchpad");
    const textarea = within(scratchpad).getByPlaceholderText(
      "Add set notes for this gig",
    );

    await waitFor(() => {
      expect(textarea).not.toBeDisabled();
    });

    expect(textarea).toBeInTheDocument();
    expect(
      within(scratchpad).getByText(`0 / ${CRATE_NOTES_MAX_LENGTH}`),
    ).toBeInTheDocument();
  });

  it("autosaves notes on blur", async () => {
    mockApi.updateCrate.mockResolvedValue({
      crate: crateFactory.defaultTestCrate({
        id: crateDrawerDefaultDetail.id,
        notes: "Headline set",
      }),
    });

    const user = userEvent.setup();

    renderScratchpad();

    const textarea = await screen.findByPlaceholderText(
      "Add set notes for this gig",
    );

    await waitFor(() => {
      expect(textarea).not.toBeDisabled();
    });

    await user.type(textarea, "Headline set");
    await user.tab();

    await waitFor(() => {
      expect(mockApi.updateCrate).toHaveBeenCalledWith(
        crateDrawerDefaultDetail.id,
        { notes: "Headline set" },
      );
    });
  });
});
