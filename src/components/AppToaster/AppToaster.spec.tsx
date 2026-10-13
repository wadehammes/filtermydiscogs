import { describe, expect, it } from "@jest/globals";
import { AppToaster } from "src/components/AppToaster/AppToaster.component";
import { PLAYBACK_SKIP_HELP_TRIGGER_LABEL } from "src/utils/playbackSkipHelpCopy";
import { toast } from "src/utils/toast";
import { render, screen, waitFor } from "test-utils";

describe("AppToaster", () => {
  it("renders a header help control to the left of dismiss when both are set", async () => {
    render(<AppToaster />);

    toast.error("Skipped unavailable track", {
      id: "spec-skip-toast-header",
      duration: Number.POSITIVE_INFINITY,
      position: "bottom-center",
      showClose: true,
      headerAction: (
        <button aria-label={PLAYBACK_SKIP_HELP_TRIGGER_LABEL} type="button">
          ?
        </button>
      ),
      classNames: { toast: "fmd-playback-skip-log-toast" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: PLAYBACK_SKIP_HELP_TRIGGER_LABEL }),
      ).toBeInTheDocument();
    });

    const headerActions = document.querySelector(".toastHeaderActions");
    const headerButtons = headerActions?.querySelectorAll("button");

    expect(headerButtons).toHaveLength(2);
    expect(headerButtons?.[0]).toHaveAttribute(
      "aria-label",
      PLAYBACK_SKIP_HELP_TRIGGER_LABEL,
    );
    expect(headerButtons?.[1]).toHaveAttribute(
      "aria-label",
      "Dismiss notification",
    );
  });
});
