import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PublicReleaseNoPlayableTracksNote } from "src/components/PublicReleasePage/PublicReleaseNoPlayableTracksNote.component";
import {
  PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_INFO_TOOLTIP,
  PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_NOTE,
} from "src/constants/publicReleaseListen.constants";
import { render, screen } from "test-utils";

describe("PublicReleaseNoPlayableTracksNote", () => {
  it("renders the no-playable note and an info control with a tooltip", async () => {
    const user = userEvent.setup();
    render(<PublicReleaseNoPlayableTracksNote />);

    expect(
      screen.getByTestId("fmdPublicReleaseNoPlayableTracksNote"),
    ).toHaveTextContent(PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_NOTE);

    const infoTrigger = screen.getByTestId(
      "fmdPublicReleaseNoPlayableTracksInfo",
    );
    expect(infoTrigger).toHaveAccessibleName(
      "Why are there no playable tracks?",
    );

    await user.hover(infoTrigger);

    expect(
      await screen.findByText(PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_INFO_TOOLTIP),
    ).toBeInTheDocument();
  });
});
