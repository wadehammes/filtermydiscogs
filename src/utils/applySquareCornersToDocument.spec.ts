import { describe, expect, it } from "@jest/globals";
import { applySquareCornersToDocument } from "./applySquareCornersToDocument";

describe("applySquareCornersToDocument", () => {
  it("sets data-ui-radius when square corners are enabled", () => {
    applySquareCornersToDocument(true);

    expect(document.documentElement.getAttribute("data-ui-radius")).toBe(
      "square",
    );
  });

  it("removes data-ui-radius when square corners are disabled", () => {
    document.documentElement.setAttribute("data-ui-radius", "square");

    applySquareCornersToDocument(false);

    expect(document.documentElement.getAttribute("data-ui-radius")).toBeNull();
  });
});
