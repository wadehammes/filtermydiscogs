import { describe, expect, it } from "@jest/globals";
import { render, screen } from "test-utils";
import { BrowserOnly } from "./BrowserOnly.component";

describe("BrowserOnly", () => {
  it("renders children after the browser gate resolves", async () => {
    render(
      <BrowserOnly>
        <span>Client content</span>
      </BrowserOnly>,
    );

    expect(await screen.findByText("Client content")).toBeInTheDocument();
  });
});
