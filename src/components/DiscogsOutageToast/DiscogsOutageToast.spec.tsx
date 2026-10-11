import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactElement } from "react";
import {
  DISCOGS_OUTAGE_TOAST_ID,
  dismissDiscogsOutageToast,
  showDiscogsOutageToast,
} from "src/components/DiscogsOutageToast/discogsOutageToast";
import { toast } from "src/utils/toast";
import { render, screen } from "test-utils";

jest.mock("src/utils/toast", () => ({
  toast: {
    error: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const mockToastError = jest.mocked(toast.error);
const mockToastDismiss = jest.mocked(toast.dismiss);

describe("discogsOutageToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a persistent, closable error toast while Discogs is down", () => {
    showDiscogsOutageToast();

    expect(mockToastError).toHaveBeenCalledWith(
      "Discogs is having trouble right now",
      expect.objectContaining({
        id: DISCOGS_OUTAGE_TOAST_ID,
        duration: Number.POSITIVE_INFINITY,
        showClose: true,
      }),
    );
  });

  it("links to the Discogs status page in a new tab", () => {
    showDiscogsOutageToast();

    const description = mockToastError.mock.calls[0]?.[1]?.description as
      | ReactElement
      | undefined;

    render(<p>{description}</p>);

    expect(
      screen.getByText("Your collection will load when it's back."),
    ).toBeInTheDocument();
    const statusLink = screen.getByRole("link", { name: "Discogs status" });
    expect(statusLink).toHaveAttribute("href", "https://status.discogs.com");
    expect(statusLink).toHaveAttribute("target", "_blank");
    expect(statusLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("dismisses only the Discogs outage toast", () => {
    dismissDiscogsOutageToast();

    expect(mockToastDismiss).toHaveBeenCalledWith(DISCOGS_OUTAGE_TOAST_ID);
  });
});
