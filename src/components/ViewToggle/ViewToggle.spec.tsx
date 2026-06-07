import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ViewTogglePageObject } from "src/components/ViewToggle/ViewToggle.po";
import { screen } from "test-utils";

let po: ViewTogglePageObject;

describe("ViewToggle", () => {
  beforeEach(() => {
    po = new ViewTogglePageObject();
  });

  it("renders component root", () => {
    po.renderViewToggle();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders all view buttons", () => {
    po.renderViewToggle();

    expect(
      screen.getByRole("button", { name: "Switch to card view" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch to list view" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch to random view" }),
    ).toBeInTheDocument();
  });

  it("highlights active view", () => {
    const { rerender } = po.renderViewToggle({ currentView: "card" });

    const cardButton = screen.getByRole("button", {
      name: "Switch to card view",
    });
    expect(cardButton.className).toContain("active");

    po.rerenderViewToggle(rerender, { currentView: "list" });
    const listButton = screen.getByRole("button", {
      name: "Switch to list view",
    });
    expect(listButton.className).toContain("active");
  });

  it("calls onViewChange when card view is clicked", async () => {
    const user = userEvent.setup();
    po.renderViewToggle({ currentView: "list" });

    const cardButton = screen.getByRole("button", {
      name: "Switch to card view",
    });
    await user.click(cardButton);

    expect(po.onViewChange).toHaveBeenCalledWith("card");
  });

  it("scrolls to top when a view mode button is clicked", async () => {
    const user = userEvent.setup();
    const scrollToSpy = po.mockScrollTo();
    po.renderViewToggle({ currentView: "list" });

    await user.click(
      screen.getByRole("button", { name: "Switch to card view" }),
    );

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  it("calls onViewChange when list view is clicked", async () => {
    const user = userEvent.setup();
    po.renderViewToggle({ currentView: "card" });

    const listButton = screen.getByRole("button", {
      name: "Switch to list view",
    });
    await user.click(listButton);

    expect(po.onViewChange).toHaveBeenCalledWith("list");
  });

  it("calls onViewChange when random view is clicked (not already in random)", async () => {
    const user = userEvent.setup();
    po.renderViewToggle({ currentView: "card" });

    const randomButton = screen.getByRole("button", {
      name: "Switch to random view",
    });
    await user.click(randomButton);

    expect(po.onViewChange).toHaveBeenCalledWith("random");
  });

  it("calls onRandomClick when random button is clicked while already in random view", async () => {
    const user = userEvent.setup();
    po.renderViewToggle({
      currentView: "random",
      onRandomClick: po.onRandomClick,
    });

    const randomButton = screen.getByRole("button", {
      name: "Get another random release",
    });
    await user.click(randomButton);

    expect(po.onRandomClick).toHaveBeenCalled();
    expect(po.onViewChange).not.toHaveBeenCalled();
  });

  it("does not show crates button when onCratesClick is not provided", () => {
    po.renderViewToggle();

    expect(
      screen.queryByRole("button", { name: /crates/i }),
    ).not.toBeInTheDocument();
  });

  it("shows crates button when onCratesClick is provided", () => {
    po.renderViewToggle({ onCratesClick: po.onCratesClick });

    expect(
      screen.getByRole("button", { name: "Open crates" }),
    ).toBeInTheDocument();
  });

  it("calls onCratesClick when crates button is clicked", async () => {
    const user = userEvent.setup();
    po.renderViewToggle({ onCratesClick: po.onCratesClick });

    const cratesButton = screen.getByRole("button", { name: "Open crates" });
    await user.click(cratesButton);

    expect(po.onCratesClick).toHaveBeenCalled();
  });

  it("does not scroll to top when the crates button is clicked", async () => {
    const user = userEvent.setup();
    const scrollToSpy = po.mockScrollTo();
    po.renderViewToggle({ onCratesClick: po.onCratesClick });

    await user.click(screen.getByRole("button", { name: "Open crates" }));

    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("highlights crates button when isCratesOpen is true", () => {
    po.renderViewToggle({
      onCratesClick: po.onCratesClick,
      isCratesOpen: true,
    });

    const cratesButton = screen.getByRole("button", { name: "Close crates" });
    expect(cratesButton.className).toContain("active");
  });

  it("updates crates button aria-label based on isCratesOpen", () => {
    const { rerender } = po.renderViewToggle({
      onCratesClick: po.onCratesClick,
      isCratesOpen: false,
    });

    expect(
      screen.getByRole("button", { name: "Open crates" }),
    ).toBeInTheDocument();

    po.rerenderViewToggle(rerender, {
      onCratesClick: po.onCratesClick,
      isCratesOpen: true,
    });

    expect(
      screen.getByRole("button", { name: "Close crates" }),
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = po.renderViewToggle({ className: "custom-class" });

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
