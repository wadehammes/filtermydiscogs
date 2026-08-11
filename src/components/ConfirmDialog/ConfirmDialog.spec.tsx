import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ConfirmDialogPageObject } from "src/components/ConfirmDialog/ConfirmDialog.po";
import { fireEvent, screen } from "test-utils";

let po: ConfirmDialogPageObject;

describe("ConfirmDialog", () => {
  beforeEach(() => {
    po = new ConfirmDialogPageObject();
  });

  it("does not render when isOpen is false", () => {
    po.renderConfirmDialog({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    po.renderConfirmDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders component root when open", () => {
    po.renderConfirmDialog();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("displays title", () => {
    po.renderConfirmDialog();
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
  });

  it("displays message", () => {
    po.renderConfirmDialog();
    expect(
      screen.getByText("Are you sure you want to proceed?"),
    ).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    po.renderConfirmDialog({ onConfirm });

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    po.renderConfirmDialog({ onCancel });

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when backdrop is clicked", async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    po.renderConfirmDialog({ onCancel });

    const backdrop = screen.getByTestId(`${po.testId}-backdrop`);
    await user.click(backdrop);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel when dialog content is clicked", async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    po.renderConfirmDialog({ onCancel });

    const title = screen.getByText("Confirm Action");
    await user.click(title);

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when Escape key is pressed", () => {
    const onCancel = jest.fn();

    po.renderConfirmDialog({ onCancel });

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses custom confirm label", () => {
    po.renderConfirmDialog({ confirmLabel: "Delete" });
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("uses custom cancel label", () => {
    po.renderConfirmDialog({ cancelLabel: "Go Back" });
    expect(screen.getByRole("button", { name: "Go Back" })).toBeInTheDocument();
  });

  it("applies danger variant to confirm button", () => {
    po.renderConfirmDialog({ variant: "danger" });
    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    expect(confirmButton.className).toContain("danger");
  });

  it("disables buttons when isConfirming is true", () => {
    po.renderConfirmDialog({ isConfirming: true });
    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("does not call onConfirm when isConfirming is true", async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    po.renderConfirmDialog({ onConfirm, isConfirming: true });

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    await user.click(confirmButton);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("has correct aria attributes", () => {
    po.renderConfirmDialog();
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "dialog-title");
    expect(dialog).toHaveAttribute("aria-describedby", "dialog-message");
  });
});
