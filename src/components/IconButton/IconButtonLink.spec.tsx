import { describe, expect, it } from "@jest/globals";
import { IconButtonLink } from "src/components/IconButton/IconButtonLink.component";
import { render, screen } from "test-utils";
import { iconButtonClasses } from "./iconButtonClasses";

describe("IconButtonLink", () => {
  it("renders an external link with shared variant classes", () => {
    render(
      <IconButtonLink
        href="https://www.discogs.com/release/1"
        variant="external"
        aria-label="View on Discogs"
      >
        <svg />
      </IconButtonLink>,
    );

    const link = screen.getByRole("link", { name: "View on Discogs" });

    expect(link.className).toContain(iconButtonClasses("external"));
    expect(link).toHaveAttribute("href", "https://www.discogs.com/release/1");
  });

  it("renders an internal Next.js link when internal is set", () => {
    render(
      <IconButtonLink
        internal
        href="/crates/crate-1"
        label="Open crate"
        aria-label="Open crate"
      >
        <svg />
      </IconButtonLink>,
    );

    expect(screen.getByRole("link", { name: "Open crate" })).toHaveAttribute(
      "href",
      "/crates/crate-1",
    );
  });
});
