import { beforeEach, describe, expect, it } from "@jest/globals";
import { HorizontalScrollRowPageObject } from "src/components/HorizontalScrollRow/HorizontalScrollRow.po";
import { screen } from "test-utils";

let po: HorizontalScrollRowPageObject;

describe("HorizontalScrollRow", () => {
  beforeEach(() => {
    po = new HorizontalScrollRowPageObject();
  });

  it("renders pill row content", () => {
    po.renderHorizontalScrollRow();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });
});
