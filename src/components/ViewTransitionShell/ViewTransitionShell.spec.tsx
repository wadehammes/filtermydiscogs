import { describe, expect, it } from "@jest/globals";
import { render, screen } from "test-utils";
import { ViewTransitionShell } from "./ViewTransitionShell.component";

describe("ViewTransitionShell", () => {
  it("renders children", () => {
    render(
      <ViewTransitionShell mode="content">
        <span>Transition content</span>
      </ViewTransitionShell>,
    );

    expect(screen.getByText("Transition content")).toBeInTheDocument();
  });
});
