import { beforeEach, describe, expect, it } from "@jest/globals";
import { ScrollRevealPageObject } from "src/components/ScrollReveal/ScrollReveal.po";
import { screen } from "test-utils";

let po: ScrollRevealPageObject;

describe("ScrollReveal", () => {
  beforeEach(() => {
    po = new ScrollRevealPageObject();
  });

  it("renders ScrollReveal", () => {
    po.renderScrollReveal();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
