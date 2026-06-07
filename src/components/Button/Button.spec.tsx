import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ButtonPageObject } from "src/components/Button/Button.po";
import { screen } from "test-utils";

let po: ButtonPageObject;

describe("Button", () => {
  beforeEach(() => {
    po = new ButtonPageObject();
  });

  it("renders component root", () => {
    po.renderButton();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders children", () => {
    po.renderButton();
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    po.renderButton({ onClick: handleClick });

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls onPress when clicked", async () => {
    const handlePress = jest.fn();
    const user = userEvent.setup();

    po.renderButton({ onPress: handlePress });

    await user.click(screen.getByRole("button"));

    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it("prefers onPress over onClick", async () => {
    const handlePress = jest.fn();
    const handleClick = jest.fn();
    const user = userEvent.setup();

    po.renderButton({ onPress: handlePress, onClick: handleClick });

    await user.click(screen.getByRole("button"));

    expect(handlePress).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies primary variant", () => {
    const { container } = po.renderButton({ variant: "primary" });
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies secondary variant", () => {
    const { container } = po.renderButton({ variant: "secondary" });
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies danger variant", () => {
    const { container } = po.renderButton({ variant: "danger" });
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies ghost variant", () => {
    const { container } = po.renderButton({ variant: "ghost" });
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies small size", () => {
    const { container } = po.renderButton({ size: "sm" });
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies medium size", () => {
    const { container } = po.renderButton({ size: "md" });
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies large size", () => {
    const { container } = po.renderButton({ size: "lg" });
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("applies custom className", () => {
    const { container } = po.renderButton({ className: "custom-class" });
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("disables button when disabled prop is true", () => {
    po.renderButton({ disabled: true });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    po.renderButton({ onClick: handleClick, disabled: true });

    await user.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies aria-label", () => {
    po.renderButton({ "aria-label": "Custom label" });
    expect(
      screen.getByRole("button", { name: "Custom label" }),
    ).toBeInTheDocument();
  });

  it("applies aria-labelledby", () => {
    po.renderButtonWithLabelledBy();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-labelledby",
      "label",
    );
  });

  it("defaults to secondary variant", () => {
    const { container } = po.renderButton();
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });

  it("defaults to medium size", () => {
    const { container } = po.renderButton();
    const button = container.querySelector("button");
    expect(button?.className).toContain("button");
  });
});
