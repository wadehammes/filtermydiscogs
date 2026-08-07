import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { BottomDrawerPageObject } from "src/components/BottomDrawer/BottomDrawer.po";
import { screen } from "test-utils";

let po: BottomDrawerPageObject;

describe("BottomDrawer", () => {
  beforeEach(() => {
    po = new BottomDrawerPageObject();
  });

  it("renders component root when open", () => {
    po.renderBottomDrawer();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    po.renderBottomDrawer({ isOpen: false });

    expect(screen.queryByText("Content")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    po.renderBottomDrawer();

    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    po.renderBottomDrawer({ title: "Test Drawer" });

    expect(screen.getByText("Test Drawer")).toBeInTheDocument();
  });

  it("renders headerContent when provided", () => {
    po.renderBottomDrawer({
      headerContent: <div>Header Content</div>,
    });

    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    po.renderBottomDrawer({
      footer: <div>Footer Content</div>,
    });

    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("renders close button in the header when closeButtonPlacement is header", () => {
    po.renderBottomDrawer({
      title: "Test Drawer",
      closeButtonPlacement: "header",
      closeButtonAriaLabel: "Close test drawer",
    });

    expect(
      screen.getByRole("button", { name: "Close test drawer" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Close test drawer" }),
    ).toHaveLength(1);
  });

  it("calls onClose when header close button is clicked", async () => {
    const user = userEvent.setup();
    po.renderBottomDrawer({
      title: "Test Drawer",
      closeButtonPlacement: "header",
      closeButtonAriaLabel: "Close test drawer",
    });

    await user.click(screen.getByRole("button", { name: "Close test drawer" }));

    expect(po.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders close button", () => {
    po.renderBottomDrawer();

    const buttons = screen.getAllByRole("button");
    const closeButton = buttons.find(
      (btn) => btn.getAttribute("aria-label") === "Close drawer",
    );
    expect(closeButton).toBeInTheDocument();
  });

  it("uses custom closeButtonAriaLabel when provided", () => {
    po.renderBottomDrawer({
      closeButtonAriaLabel: "Close test drawer",
    });

    expect(
      screen.getByRole("button", { name: "Close test drawer" }),
    ).toBeInTheDocument();
  });

  it("calls onClose when overlay is clicked", async () => {
    const user = userEvent.setup();
    po.renderBottomDrawer();

    const overlay = screen.getByRole("button", {
      name: "Close drawer overlay",
    });
    await user.click(overlay);

    expect(po.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    po.renderBottomDrawer({
      closeButtonAriaLabel: "Close test drawer",
    });

    const closeButton = screen.getByRole("button", {
      name: "Close test drawer",
    });
    await user.click(closeButton);

    expect(po.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", async () => {
    const user = userEvent.setup();
    po.renderBottomDrawer();

    const drawer = screen.getByRole("dialog");
    drawer.focus();
    await user.keyboard("{Escape}");

    expect(po.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside drawer content", async () => {
    const user = userEvent.setup();
    po.renderBottomDrawer();

    const content = screen.getByText("Content");
    await user.click(content);

    expect(po.onClose).not.toHaveBeenCalled();
  });

  it("applies data attribute when provided", () => {
    po.renderBottomDrawer({ dataAttribute: "data-test-drawer" });

    const overlay = screen.getByRole("button", {
      name: "Close drawer overlay",
    });
    expect(overlay).toHaveAttribute("data-test-drawer", "true");
  });

  it("has correct accessibility attributes", () => {
    po.renderBottomDrawer();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders without header when neither title nor headerContent is provided", () => {
    po.renderBottomDrawer();

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
