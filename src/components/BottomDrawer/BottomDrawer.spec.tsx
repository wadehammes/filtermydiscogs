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

  it("uses header close button when chrome is enabled", () => {
    po.renderBottomDrawer({ chrome: true, title: "Filters" });

    expect(
      screen.getByRole("button", { name: "Close drawer" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("fmdBottomDrawerCloseButton"),
    ).toBeInTheDocument();
  });

  it("applies data attribute when provided", () => {
    po.renderBottomDrawer({ dataAttribute: "data-test-drawer" });

    const overlay = screen.getByRole("button", {
      name: "Close drawer overlay",
    });
    expect(overlay).toHaveAttribute("data-test-drawer", "true");
  });

  it("applies data attribute to the drawer when hideOverlay is true", () => {
    po.renderBottomDrawer({
      dataAttribute: "data-test-drawer",
      hideOverlay: true,
    });

    expect(
      screen.queryByRole("button", { name: "Close drawer overlay" }),
    ).toBeNull();
    expect(screen.getByTestId(po.testId)).toHaveAttribute(
      "data-test-drawer",
      "true",
    );
  });

  it("does not render overlay when hideOverlay is true", () => {
    po.renderBottomDrawer({ hideOverlay: true });

    expect(
      screen.queryByRole("button", { name: "Close drawer overlay" }),
    ).toBeNull();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false");
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

  it("keeps floating close on the shell outside the header row", () => {
    po.renderBottomDrawer({
      chrome: true,
      closeButtonPlacement: "floating",
      closeButtonAriaLabel: "Close test drawer",
      headerContent: <button type="button">Header action</button>,
    });

    const shell = screen.getByTestId(po.testId);
    const closeButton = screen.getByRole("button", {
      name: "Close test drawer",
    });
    const headerAction = screen.getByRole("button", { name: "Header action" });

    expect(shell.firstElementChild).toBe(closeButton);
    expect(closeButton.className).toContain("floatingShellClose");
    expect(headerAction.closest('[class*="headerChrome"]')).not.toBeNull();
    expect(
      headerAction.closest('[class*="headerChrome"]'),
    ).not.toContainElement(closeButton);
  });
});
