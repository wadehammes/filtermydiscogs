import { beforeEach, describe, expect, it } from "@jest/globals";
import { CratesClientPageObject } from "src/components/Crates/CratesClient.po";
import { screen, waitFor } from "test-utils";

let po: CratesClientPageObject;

describe("CratesClient", () => {
  beforeEach(() => {
    po = new CratesClientPageObject();
  });

  it("renders the crates hub with links to each crate", async () => {
    po.renderCratesHub();

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /Weekend Set/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Crates" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Weekend Set/i })).toHaveAttribute(
      "href",
      "/crates/crate-a",
    );
    expect(screen.getByRole("link", { name: /Deep Cuts/i })).toHaveAttribute(
      "href",
      "/crates/crate-b",
    );
    expect(screen.getByText("4 releases")).toBeInTheDocument();
  });
});

describe("CrateDetailClient", () => {
  beforeEach(() => {
    po = new CratesClientPageObject();
  });

  it("renders the crate detail workspace with table shell", async () => {
    po.renderCrateDetail();

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: /Select crate/i }),
      ).toHaveTextContent("Weekend Set (0)");
    });

    expect(screen.getByTestId(po.detailTestId)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← All crates" })).toHaveAttribute(
      "href",
      "/crates",
    );
    expect(screen.getByTestId("fmdCrateReleasesTable")).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdCrateDetailHeaderActions"),
    ).toBeInTheDocument();
  });
});
