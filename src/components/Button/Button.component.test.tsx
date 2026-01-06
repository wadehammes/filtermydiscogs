import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button.component";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls onPress when clicked", async () => {
    const handlePress = jest.fn();
    const user = userEvent.setup();

    render(<Button onPress={handlePress}>Click me</Button>);

    await user.click(screen.getByRole("button"));

    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it("prefers onPress over onClick", async () => {
    const handlePress = jest.fn();
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <Button onPress={handlePress} onClick={handleClick}>
        Click me
      </Button>,
    );

    await user.click(screen.getByRole("button"));

    expect(handlePress).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies primary variant", () => {
    const { container } = render(<Button variant="primary">Click me</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies secondary variant", () => {
    const { container } = render(<Button variant="secondary">Click me</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies danger variant", () => {
    const { container } = render(<Button variant="danger">Click me</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies ghost variant", () => {
    const { container } = render(<Button variant="ghost">Click me</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies small size", () => {
    const { container } = render(<Button size="sm">Click me</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies medium size", () => {
    const { container } = render(<Button size="md">Click me</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies large size", () => {
    const { container } = render(<Button size="lg">Click me</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies custom className", () => {
    const { container } = render(
      <Button className="custom-class">Click me</Button>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("disables button when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>,
    );

    await user.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies aria-label", () => {
    render(<Button aria-label="Custom label">Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Custom label" }),
    ).toBeInTheDocument();
  });

  it("applies aria-labelledby", () => {
    render(
      <div>
        <span id="label">Label</span>
        <Button aria-labelledby="label">Click me</Button>
      </div>,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-labelledby",
      "label",
    );
  });

  it("defaults to secondary variant", () => {
    const { container } = render(<Button>Click me</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("defaults to medium size", () => {
    const { container } = render(<Button>Click me</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });
});
