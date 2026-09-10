import type { RenderResult } from "@testing-library/react";
import { render } from "test-utils";
import {
  SegmentedControl,
  type SegmentedControlProps,
} from "./SegmentedControl.component";

export type SegmentedControlRenderProps = Partial<SegmentedControlProps>;

export class SegmentedControlPageObject {
  renderSegmentedControl(
    overrides: SegmentedControlRenderProps = {},
  ): RenderResult {
    return render(
      <SegmentedControl legend="Test group" {...overrides}>
        <button type="button">One</button>
        <button type="button">Two</button>
      </SegmentedControl>,
    );
  }
}
