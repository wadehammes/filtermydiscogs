import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/basePageObject.po";
import { render } from "test-utils";
import Button from "./Button.component";

export type ButtonRenderProps = {
  children?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  className?: string;
  onPress?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export class ButtonPageObject extends BasePageObject {
  public testId = "fmdButton";
  public buttonText = "Click me";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderButton(overrides: ButtonRenderProps = {}): RenderResult {
    const { children = this.buttonText, ...props } = overrides;

    return render(<Button {...props}>{children}</Button>);
  }

  renderButtonWithLabelledBy(): RenderResult {
    return render(
      <div>
        <span id="label">Label</span>
        <Button aria-labelledby="label">{this.buttonText}</Button>
      </div>,
    );
  }
}
