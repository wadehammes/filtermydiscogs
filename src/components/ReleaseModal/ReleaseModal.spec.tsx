import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseModalPageObject } from "src/components/ReleaseModal/ReleaseModal.po";
import { fireEvent, screen, waitFor } from "test-utils";

let po: ReleaseModalPageObject;

describe("ReleaseModal", () => {
  beforeEach(() => {
    po = new ReleaseModalPageObject();
  });

  it("renders nothing when closed", () => {
    po.renderReleaseModal({ isOpen: false });

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();
  });

  it("renders the dialog with release details when open", async () => {
    po.renderReleaseModal();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Never Gonna Give You Up" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Never Gonna Give You Up (Instrumental)"),
    ).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = jest.fn();

    po.renderReleaseModal({ onClose });

    fireEvent.keyDown(screen.getByTestId(po.testId), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    po.renderReleaseModal({ onClose });

    const backdrop = screen.getByTestId(po.testId);
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
