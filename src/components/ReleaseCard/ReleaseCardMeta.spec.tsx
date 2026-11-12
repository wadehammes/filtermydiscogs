import { describe, expect, it } from "@jest/globals";
import {
  ReleaseCardDateAdded,
  ReleaseCardMeta,
} from "src/components/ReleaseCard/ReleaseCardMeta.component";
import styles from "src/components/ReleaseCard/ReleaseCardMeta.module.css";
import { render, screen } from "test-utils";

describe("ReleaseCardMeta", () => {
  it("when dateAdded is set, ReleaseCardDateAdded renders a segmented Added label and date", () => {
    render(<ReleaseCardDateAdded dateAdded="2023-06-15T12:00:00.000Z" />);

    expect(
      screen.getByRole("group", { name: "Added Jun 15, 2023" }),
    ).toHaveClass(styles.dateAddedSegmented);
    expect(screen.getByText("Added")).toHaveClass(styles.dateAddedLabel);
    const time = screen.getByRole("time");
    expect(time).toHaveAttribute("datetime", "2023-06-15T12:00:00.000Z");
    expect(time).toHaveTextContent("Jun 15, 2023");
    expect(time).toHaveClass(styles.dateAddedValue);
  });

  it("when label year and catno are set, ReleaseCardMeta joins them on one line", () => {
    render(<ReleaseCardMeta labelName="Warp" year={1998} catno="WARP 42" />);

    expect(screen.getByText("Warp")).toBeInTheDocument();
    expect(screen.getByText("1998")).toBeInTheDocument();
    expect(screen.getByText("WARP 42")).toBeInTheDocument();
  });
});
