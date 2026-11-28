import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { WhatsNewModalPageObject } from "src/components/WhatsNewModal/WhatsNewModal.po";
import {
  WHATS_NEW_MODAL_TITLE,
  WHATS_NEW_RELEASES,
} from "src/constants/whatsNew.constants";
import { screen } from "test-utils";

let po: WhatsNewModalPageObject;

describe("WhatsNewModal", () => {
  beforeEach(() => {
    po = new WhatsNewModalPageObject();
  });

  it("renders release highlights and a New badge for the latest feature", () => {
    po.renderWhatsNewModal();

    expect(
      screen.getByRole("heading", { name: WHATS_NEW_MODAL_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText("v2026.11.28")).toBeInTheDocument();
    expect(
      screen.getByText(/scrolls with your releases instead of sitting in a fixed overlay/i),
    ).toBeInTheDocument();
    expect(screen.getByText("v2026.11.27")).toBeInTheDocument();
    expect(
      screen.getByText(/What's New\? in the account menu/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Collection Ask/i)).toBeInTheDocument();
    expect(
      screen.getByText(/apply them, save a view, or create a crate/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Genre & Style, Format Type, and Release Year: row Exclude/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Collection radio is off for now/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/I may ship a revised version later/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Removed")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Other bug fixes and performance improvements/i),
    ).toHaveLength(WHATS_NEW_RELEASES.length);
  });

  it("closes when the toolbar close control is activated", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    po.renderWhatsNewModal({ onClose });

    await user.click(screen.getByRole("button", { name: "Close modal" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
