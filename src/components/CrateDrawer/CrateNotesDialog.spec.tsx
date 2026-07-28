import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import * as apiHelpers from "src/api/helpers";
import { CrateDrawerFooter } from "src/components/CrateDrawer/CrateDrawerFooter.component";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import {
  crateDrawerDefaultCrate,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CRATE_NOTES_MAX_LENGTH } from "src/constants/crate";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { screen, waitFor, within } from "test-utils";
import {
  crateDrawerDefaultDetail,
  crateDrawerReleaseUnpacked,
} from "./crateDrawerTestSetup";

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

const getDialogSaveButton = (dialog: HTMLElement) => {
  const buttons = within(dialog).getAllByTestId("fmdButton");
  expect(buttons.length).toBeGreaterThanOrEqual(2);
  return buttons[1] as HTMLElement;
};

describe("CrateNotesDialog", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("shows the notes length counter when opened", async () => {
    mockApi.fetchCrate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleases(crateDrawerDefaultDetail, [
        crateDrawerReleaseUnpacked,
      ]),
    );

    const user = userEvent.setup();

    renderCrateDrawerTree(<CrateDrawerFooter />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^notes$/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    const dialog = await screen.findByTestId("fmdCrateNotesDialog");

    await waitFor(() => {
      expect(
        within(dialog).getByText(`0 / ${CRATE_NOTES_MAX_LENGTH}`),
      ).toBeInTheDocument();
    });
  });

  it("updates the length counter while typing", async () => {
    mockApi.fetchCrate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleases(crateDrawerDefaultDetail, [
        crateDrawerReleaseUnpacked,
      ]),
    );

    const user = userEvent.setup();

    renderCrateDrawerTree(<CrateDrawerFooter />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^notes$/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    const dialog = await screen.findByTestId("fmdCrateNotesDialog");
    const notesInput = within(dialog).getByLabelText(/^notes$/i);
    await user.type(notesInput, "Set list");

    expect(
      within(dialog).getByText(`8 / ${CRATE_NOTES_MAX_LENGTH}`),
    ).toBeInTheDocument();
  });

  it("keeps save disabled until notes change", async () => {
    mockApi.fetchCrates.mockResolvedValue(
      cratesResponseFactory.withCrates([
        {
          ...crateDrawerDefaultCrate,
          notes: "Existing notes",
        },
      ]),
    );
    mockApi.fetchCrate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleases(crateDrawerDefaultDetail, [
        crateDrawerReleaseUnpacked,
      ]),
    );

    const user = userEvent.setup();

    renderCrateDrawerTree(<CrateDrawerFooter />);

    await waitFor(() => {
      expect(screen.getByText("Existing notes")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    const dialog = await screen.findByTestId("fmdCrateNotesDialog");

    await waitFor(() => {
      expect(within(dialog).getByText("Edit crate notes")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(within(dialog).getByLabelText(/^notes$/i)).toHaveValue(
        "Existing notes",
      );
    });

    expect(getDialogSaveButton(dialog)).toBeDisabled();
  });

  it("saves updated crate notes", async () => {
    const updatedCrate = crateFactory.defaultTestCrate({
      id: "crate-1",
      notes: "Bring spare needles",
    });

    mockApi.fetchCrates.mockResolvedValue(
      cratesResponseFactory.withCrates([
        {
          ...crateDrawerDefaultCrate,
          notes: null,
        },
      ]),
    );
    mockApi.fetchCrate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleases(crateDrawerDefaultDetail, [
        crateDrawerReleaseUnpacked,
      ]),
    );
    mockApi.updateCrate.mockResolvedValue({ crate: updatedCrate });

    const user = userEvent.setup();

    renderCrateDrawerTree(<CrateDrawerFooter />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^notes$/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    const dialog = await screen.findByTestId("fmdCrateNotesDialog");
    const notesInput = within(dialog).getByLabelText(/^notes$/i);
    await user.type(notesInput, "Bring spare needles");

    const saveButton = getDialogSaveButton(dialog);
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockApi.updateCrate).toHaveBeenCalledWith("crate-1", {
        notes: "Bring spare needles",
      });
    });
  });
});
