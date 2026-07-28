import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { FiltersDrawerPageObject } from "src/components/FiltersDrawer/FiltersDrawer.po";
import { screen } from "test-utils";

let po: FiltersDrawerPageObject;

describe("FiltersDrawer", () => {
  beforeEach(() => {
    po = new FiltersDrawerPageObject();
  });

  it("renders search and filter sections when open with a loaded collection", () => {
    po.renderFiltersDrawer();

    expect(screen.getByTestId(po.drawerTestId)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Filters" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByTestId(po.searchBarTestId)).toBeInTheDocument();
    expect(screen.getByText("Genre & Style")).toBeInTheDocument();
    expect(screen.getByText("Release Year")).toBeInTheDocument();
    expect(screen.getByText("Format Type")).toBeInTheDocument();
    expect(screen.getByText("Sort")).toBeInTheDocument();
  });

  it("calls onClose when the close button is pressed", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    po.renderFiltersDrawer({ onClose });

    await user.click(screen.getByRole("button", { name: "Close filters" }));

    expect(onClose).toHaveBeenCalled();
  });
});
