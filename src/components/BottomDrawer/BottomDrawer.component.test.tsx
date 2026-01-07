import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "test-utils";
import { BottomDrawer } from "./BottomDrawer.component";

describe("BottomDrawer", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <BottomDrawer isOpen={false} onClose={mockOnClose}>
        <div>Content</div>
      </BottomDrawer>,
    );

    expect(screen.queryByText("Content")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <BottomDrawer isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomDrawer>,
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <BottomDrawer isOpen={true} onClose={mockOnClose} title="Test Drawer">
        <div>Content</div>
      </BottomDrawer>,
    );

    expect(screen.getByText("Test Drawer")).toBeInTheDocument();
  });

  it("renders headerContent when provided", () => {
    render(
      <BottomDrawer
        isOpen={true}
        onClose={mockOnClose}
        headerContent={<div>Header Content</div>}
      >
        <div>Content</div>
      </BottomDrawer>,
    );

    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    render(
      <BottomDrawer
        isOpen={true}
        onClose={mockOnClose}
        footer={<div>Footer Content</div>}
      >
        <div>Content</div>
      </BottomDrawer>,
    );

    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(
      <BottomDrawer isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomDrawer>,
    );

    const buttons = screen.getAllByRole("button");
    const closeButton = buttons.find(
      (btn) => btn.getAttribute("aria-label") === "Close drawer",
    );
    expect(closeButton).toBeInTheDocument();
  });

  it("uses custom closeButtonAriaLabel when provided", () => {
    render(
      <BottomDrawer
        isOpen={true}
        onClose={mockOnClose}
        closeButtonAriaLabel="Close test drawer"
      >
        <div>Content</div>
      </BottomDrawer>,
    );

    expect(
      screen.getByRole("button", { name: "Close test drawer" }),
    ).toBeInTheDocument();
  });

  it("calls onClose when overlay is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BottomDrawer isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomDrawer>,
    );

    const overlay = screen.getByRole("button", {
      name: "Close drawer overlay",
    });
    await user.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BottomDrawer
        isOpen={true}
        onClose={mockOnClose}
        closeButtonAriaLabel="Close test drawer"
      >
        <div>Content</div>
      </BottomDrawer>,
    );

    const closeButton = screen.getByRole("button", {
      name: "Close test drawer",
    });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", async () => {
    const user = userEvent.setup();
    render(
      <BottomDrawer isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomDrawer>,
    );

    const drawer = screen.getByRole("dialog");
    drawer.focus();
    await user.keyboard("{Escape}");

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside drawer content", async () => {
    const user = userEvent.setup();
    render(
      <BottomDrawer isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomDrawer>,
    );

    const content = screen.getByText("Content");
    await user.click(content);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("applies data attribute when provided", () => {
    render(
      <BottomDrawer
        isOpen={true}
        onClose={mockOnClose}
        dataAttribute="data-test-drawer"
      >
        <div>Content</div>
      </BottomDrawer>,
    );

    const overlay = screen.getByRole("button", {
      name: "Close drawer overlay",
    });
    expect(overlay).toHaveAttribute("data-test-drawer", "true");
  });

  it("has correct accessibility attributes", () => {
    render(
      <BottomDrawer isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomDrawer>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders without header when neither title nor headerContent is provided", () => {
    render(
      <BottomDrawer isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </BottomDrawer>,
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
