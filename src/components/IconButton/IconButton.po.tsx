import type { RenderResult } from "@testing-library/react";
import { render } from "test-utils";
import { IconButton, type IconButtonProps } from "./IconButton.component";

export type IconButtonRenderProps = Partial<IconButtonProps>;

export class IconButtonPageObject {
  public testId = "fmdIconButton";

  private iconButtonElement(overrides: IconButtonRenderProps = {}) {
    return (
      <IconButton aria-label="Test icon button" {...overrides}>
        <svg />
      </IconButton>
    );
  }

  renderIconButton(overrides: IconButtonRenderProps = {}): RenderResult {
    return render(this.iconButtonElement(overrides));
  }

  rerenderIconButton(
    rerender: RenderResult["rerender"],
    overrides: IconButtonRenderProps = {},
  ): void {
    rerender(this.iconButtonElement(overrides));
  }
}
