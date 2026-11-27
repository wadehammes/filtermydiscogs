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
    expect(screen.getByText("v2026.11.27")).toBeInTheDocument();
    expect(
      screen.getByText(/What's New\? in the account menu/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/open Ask in the filters bar, the mobile header/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/apply filters, save a view, or create a crate/i),
    ).toBeInTheDocument();
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
