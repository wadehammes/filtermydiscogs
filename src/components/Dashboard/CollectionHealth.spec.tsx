import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { CollectionHealthPageObject } from "src/components/Dashboard/CollectionHealth.po";
import { screen } from "test-utils";

let po: CollectionHealthPageObject;

describe("CollectionHealth", () => {
  beforeEach(() => {
    po = new CollectionHealthPageObject();
  });

  it("when exact duplicates exist, opens the detail modal from Show details", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    po.renderCollectionHealth();

    await user.click(screen.getByRole("button", { name: "Show details" }));

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Exact duplicates" }),
    ).toBeInTheDocument();
  });
});
