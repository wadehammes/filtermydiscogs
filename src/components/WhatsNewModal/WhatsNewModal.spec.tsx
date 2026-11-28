import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { WhatsNewModalPageObject } from "src/components/WhatsNewModal/WhatsNewModal.po";
import { WHATS_NEW_MODAL_TITLE } from "src/constants/whatsNew.constants";
import {
  buildWhatsNewModalTestReleases,
  whatsNewModalTestCopy,
} from "src/tests/factories/WhatsNewRelease.factory";
import { screen, within } from "test-utils";

let po: WhatsNewModalPageObject;

describe("WhatsNewModal", () => {
  beforeEach(() => {
    po = new WhatsNewModalPageObject();
  });

  it("renders release highlights and a New badge for the latest feature", () => {
    po.renderWhatsNewModal();

    const dialog = screen.getByRole("dialog");

    expect(
      within(dialog).getByRole("heading", { name: WHATS_NEW_MODAL_TITLE }),
    ).toBeInTheDocument();

    const latestReleaseSection = within(dialog)
      .getByRole("heading", { name: whatsNewModalTestCopy.latestVersion })
      .closest("li");
    expect(latestReleaseSection).not.toBeNull();
    expect(
      within(latestReleaseSection as HTMLElement).getByText(
        whatsNewModalTestCopy.latestImprovedBulletText,
      ),
    ).toBeInTheDocument();
    expect(
      within(latestReleaseSection as HTMLElement).getByText("Improved"),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole("heading", {
        name: whatsNewModalTestCopy.priorVersion,
      }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getAllByText(
        /Other bug fixes and performance improvements/i,
      ),
    ).toHaveLength(buildWhatsNewModalTestReleases().length);
  });

  it("closes when the toolbar close control is activated", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    po.renderWhatsNewModal({ onClose });

    await user.click(screen.getByRole("button", { name: "Close modal" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
