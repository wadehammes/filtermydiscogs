import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ClearAllDataConfirmDialog } from "src/components/ClearAllDataConfirmDialog/ClearAllDataConfirmDialog.component";
import { ClearAllDataConfirmDialogPageObject } from "src/components/ClearAllDataConfirmDialog/ClearAllDataConfirmDialog.po";
import { CLEAR_ALL_DATA_CONFIRM_PHRASE } from "src/constants/clearData.constants";
import { fireEvent, screen } from "test-utils";

let po: ClearAllDataConfirmDialogPageObject;

describe("ClearAllDataConfirmDialog", () => {
  beforeEach(() => {
    po = new ClearAllDataConfirmDialogPageObject();
  });

  it("does not render when isOpen is false", () => {
    po.renderClearAllDataConfirmDialog({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog with a confirmation phrase field when open", () => {
    po.renderClearAllDataConfirmDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", {
        name: /type delete my account to confirm/i,
      }),
    ).toBeInTheDocument();
  });

  it("keeps the confirm action disabled until the exact phrase is entered", async () => {
    const user = userEvent.setup();
    po.renderClearAllDataConfirmDialog();

    const confirmButton = screen.getByRole("button", {
      name: "Clear all data",
    });
    expect(confirmButton).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", {
        name: /type delete my account to confirm/i,
      }),
      "DELETE MY",
    );
    expect(confirmButton).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", {
        name: /type delete my account to confirm/i,
      }),
      " ACCOUNT",
    );
    expect(confirmButton).toBeEnabled();
  });

  it("accepts lowercase typing because the phrase is normalized to uppercase", async () => {
    const user = userEvent.setup();
    po.renderClearAllDataConfirmDialog();

    const confirmButton = screen.getByRole("button", {
      name: "Clear all data",
    });

    await user.type(
      screen.getByRole("textbox", {
        name: /type delete my account to confirm/i,
      }),
      "delete my account",
    );

    expect(confirmButton).toBeEnabled();
  });

  it("calls onConfirm when the phrase matches and confirm is pressed", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();

    po.renderClearAllDataConfirmDialog({ onConfirm });

    await user.type(
      screen.getByRole("textbox", {
        name: /type delete my account to confirm/i,
      }),
      CLEAR_ALL_DATA_CONFIRM_PHRASE,
    );
    await user.click(screen.getByRole("button", { name: "Clear all data" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm when confirm is pressed without the phrase", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();

    po.renderClearAllDataConfirmDialog({ onConfirm });

    const confirmButton = screen.getByRole("button", {
      name: "Clear all data",
    });
    await user.click(confirmButton);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onClose when cancel is pressed", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    po.renderClearAllDataConfirmDialog({ onClose });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clears the phrase field when the dialog closes and reopens", async () => {
    const user = userEvent.setup();
    const { rerender } = po.renderClearAllDataConfirmDialog({ isOpen: true });

    const input = screen.getByRole("textbox", {
      name: /type delete my account to confirm/i,
    });
    await user.type(input, CLEAR_ALL_DATA_CONFIRM_PHRASE);
    expect(input).toHaveValue(CLEAR_ALL_DATA_CONFIRM_PHRASE);

    rerender(
      <ClearAllDataConfirmDialog
        isOpen={false}
        onConfirm={po.onConfirm}
        onClose={po.onClose}
      />,
    );

    rerender(
      <ClearAllDataConfirmDialog
        isOpen
        onConfirm={po.onConfirm}
        onClose={po.onClose}
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: /type delete my account to confirm/i,
      }),
    ).toHaveValue("");
  });

  it("disables the phrase field and confirm action while confirming", () => {
    po.renderClearAllDataConfirmDialog({ isConfirming: true });

    expect(
      screen.getByRole("textbox", {
        name: /type delete my account to confirm/i,
      }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clearing..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = jest.fn();
    po.renderClearAllDataConfirmDialog({ onClose });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
