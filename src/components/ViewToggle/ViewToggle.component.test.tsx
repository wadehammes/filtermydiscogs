import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "test-utils";
import { ViewToggle } from "./ViewToggle.component";

describe("ViewToggle", () => {
  const mockOnViewChange = jest.fn();
  const mockOnRandomClick = jest.fn();
  const mockOnCratesClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all view buttons", () => {
    render(<ViewToggle currentView="card" onViewChange={mockOnViewChange} />);

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
    const { rerender } = render(
      <ViewToggle currentView="card" onViewChange={mockOnViewChange} />,
    );

    const cardButton = screen.getByRole("button", {
      name: "Switch to card view",
    });
    expect(cardButton.className).toContain("active");

    rerender(<ViewToggle currentView="list" onViewChange={mockOnViewChange} />);
    const listButton = screen.getByRole("button", {
      name: "Switch to list view",
    });
    expect(listButton.className).toContain("active");
  });

  it("calls onViewChange when card view is clicked", async () => {
    const user = userEvent.setup();
    render(<ViewToggle currentView="list" onViewChange={mockOnViewChange} />);

    const cardButton = screen.getByRole("button", {
      name: "Switch to card view",
    });
    await user.click(cardButton);

    expect(mockOnViewChange).toHaveBeenCalledWith("card");
  });

  it("calls onViewChange when list view is clicked", async () => {
    const user = userEvent.setup();
    render(<ViewToggle currentView="card" onViewChange={mockOnViewChange} />);

    const listButton = screen.getByRole("button", {
      name: "Switch to list view",
    });
    await user.click(listButton);

    expect(mockOnViewChange).toHaveBeenCalledWith("list");
  });

  it("calls onViewChange when random view is clicked (not already in random)", async () => {
    const user = userEvent.setup();
    render(<ViewToggle currentView="card" onViewChange={mockOnViewChange} />);

    const randomButton = screen.getByRole("button", {
      name: "Switch to random view",
    });
    await user.click(randomButton);

    expect(mockOnViewChange).toHaveBeenCalledWith("random");
  });

  it("calls onRandomClick when random button is clicked while already in random view", async () => {
    const user = userEvent.setup();
    render(
      <ViewToggle
        currentView="random"
        onViewChange={mockOnViewChange}
        onRandomClick={mockOnRandomClick}
      />,
    );

    const randomButton = screen.getByRole("button", {
      name: "Get another random release",
    });
    await user.click(randomButton);

    expect(mockOnRandomClick).toHaveBeenCalled();
    expect(mockOnViewChange).not.toHaveBeenCalled();
  });

  it("does not show crates button when onCratesClick is not provided", () => {
    render(<ViewToggle currentView="card" onViewChange={mockOnViewChange} />);

    expect(
      screen.queryByRole("button", { name: /crates/i }),
    ).not.toBeInTheDocument();
  });

  it("shows crates button when onCratesClick is provided", () => {
    render(
      <ViewToggle
        currentView="card"
        onViewChange={mockOnViewChange}
        onCratesClick={mockOnCratesClick}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Open crates" }),
    ).toBeInTheDocument();
  });

  it("calls onCratesClick when crates button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ViewToggle
        currentView="card"
        onViewChange={mockOnViewChange}
        onCratesClick={mockOnCratesClick}
      />,
    );

    const cratesButton = screen.getByRole("button", { name: "Open crates" });
    await user.click(cratesButton);

    expect(mockOnCratesClick).toHaveBeenCalled();
  });

  it("highlights crates button when isCratesOpen is true", () => {
    render(
      <ViewToggle
        currentView="card"
        onViewChange={mockOnViewChange}
        onCratesClick={mockOnCratesClick}
        isCratesOpen={true}
      />,
    );

    const cratesButton = screen.getByRole("button", { name: "Close crates" });
    expect(cratesButton.className).toContain("active");
  });

  it("updates crates button aria-label based on isCratesOpen", () => {
    const { rerender } = render(
      <ViewToggle
        currentView="card"
        onViewChange={mockOnViewChange}
        onCratesClick={mockOnCratesClick}
        isCratesOpen={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Open crates" }),
    ).toBeInTheDocument();

    rerender(
      <ViewToggle
        currentView="card"
        onViewChange={mockOnViewChange}
        onCratesClick={mockOnCratesClick}
        isCratesOpen={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Close crates" }),
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ViewToggle
        currentView="card"
        onViewChange={mockOnViewChange}
        className="custom-class"
      />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
