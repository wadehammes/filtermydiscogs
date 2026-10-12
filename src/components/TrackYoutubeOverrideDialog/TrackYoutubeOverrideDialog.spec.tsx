import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { TrackYoutubeOverrideDialogPageObject } from "src/components/TrackYoutubeOverrideDialog/TrackYoutubeOverrideDialog.po";
import { trackYoutubeOverrideTargetFactory } from "src/tests/factories/TrackYoutubeOverrideTarget.factory";
import { fireEvent, screen, waitFor } from "test-utils";

const unplayableTrackTarget = trackYoutubeOverrideTargetFactory.unplayable();

const getPreviewThumbnail = (preview: HTMLElement): HTMLImageElement => {
  const thumbnail = preview.querySelector("img");

  if (!(thumbnail instanceof HTMLImageElement)) {
    throw new Error("Expected a preview thumbnail image");
  }

  return thumbnail;
};

let po: TrackYoutubeOverrideDialogPageObject;

describe("TrackYoutubeOverrideDialog", () => {
  beforeEach(() => {
    po = new TrackYoutubeOverrideDialogPageObject();
  });

  it("links to the Discogs release video upload page for community sharing", () => {
    po.renderTrackYoutubeOverrideDialog({ target: unplayableTrackTarget });

    const link = screen.getByRole("link", { name: "add the video on Discogs" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.discogs.com/release/249504/videos/update",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("uses an add title when the track has no Discogs embed or saved link", () => {
    po.renderTrackYoutubeOverrideDialog({ target: unplayableTrackTarget });

    expect(
      screen.getByRole("heading", { name: "Add a YouTube video" }),
    ).toBeInTheDocument();
  });

  it("shows artist, album, and track in the dialog description", () => {
    po.renderTrackYoutubeOverrideDialog({ target: unplayableTrackTarget });

    expect(screen.getByText("Artist · Album")).toBeInTheDocument();
    expect(screen.getByText("A2 · Second")).toBeInTheDocument();
  });

  it("shows the preview for initialPreviewVideoId when the field is still empty", async () => {
    po.renderTrackYoutubeOverrideDialog({
      target: {
        ...unplayableTrackTarget,
        initialPreviewVideoId: "dQw4w9WgXcQ",
      },
    });

    const preview = screen.getByTestId("fmdTrackYoutubeOverridePreview");
    expect(preview).toHaveAttribute("data-preview-state", "pending");

    await waitFor(() => {
      expect(getPreviewThumbnail(preview)).toBeInTheDocument();
    });
    fireEvent.load(getPreviewThumbnail(preview));
    expect(preview).toHaveAttribute("data-preview-state", "ready");
  });

  it("shows YouTube title and channel when the preview video id resolves", async () => {
    const user = userEvent.setup();

    po.renderTrackYoutubeOverrideDialog({ target: unplayableTrackTarget });

    await user.type(
      screen.getByLabelText("YouTube URL or video ID"),
      "dQw4w9WgXcQ",
    );

    await waitFor(() => {
      expect(po.mockFetchYoutubeOembed).toHaveBeenCalledWith("dQw4w9WgXcQ");
    });

    expect(
      screen.getByTestId("fmdTrackYoutubeOverrideVideoMeta"),
    ).toHaveTextContent("Never Gonna Give You Up");
    expect(
      screen.getByTestId("fmdTrackYoutubeOverrideVideoMeta"),
    ).toHaveTextContent("Rick Astley");
  });

  it("shows a dashed preview placeholder until a valid video id is entered", async () => {
    const user = userEvent.setup();

    po.renderTrackYoutubeOverrideDialog({ target: unplayableTrackTarget });

    const preview = screen.getByTestId("fmdTrackYoutubeOverridePreview");
    expect(preview).toHaveAttribute("data-preview-state", "empty");

    await user.type(
      screen.getByLabelText("YouTube URL or video ID"),
      "not-a-link",
    );
    expect(preview).toHaveAttribute("data-preview-state", "empty");

    await user.clear(screen.getByLabelText("YouTube URL or video ID"));
    await user.type(
      screen.getByLabelText("YouTube URL or video ID"),
      "dQw4w9WgXcQ",
    );

    const pendingPreview = screen.getByTestId("fmdTrackYoutubeOverridePreview");
    expect(pendingPreview).toHaveAttribute("data-preview-state", "pending");

    await waitFor(() => {
      expect(getPreviewThumbnail(pendingPreview)).toHaveAttribute(
        "src",
        "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      );
    });

    fireEvent.load(getPreviewThumbnail(pendingPreview));
    expect(pendingPreview).toHaveAttribute("data-preview-state", "ready");
  });

  it("keeps the dashed placeholder when the thumbnail fails to load", async () => {
    const user = userEvent.setup();

    po.renderTrackYoutubeOverrideDialog({ target: unplayableTrackTarget });

    await user.type(
      screen.getByLabelText("YouTube URL or video ID"),
      "dQw4w9WgXcQ",
    );

    const preview = screen.getByTestId("fmdTrackYoutubeOverridePreview");

    await waitFor(() => {
      expect(getPreviewThumbnail(preview)).toBeInTheDocument();
    });
    fireEvent.error(getPreviewThumbnail(preview));

    expect(preview).toHaveAttribute("data-preview-state", "unavailable");
    expect(preview.querySelector("img")).toBeNull();
  });

  it("uses a replace title when the track already has a Discogs embed", () => {
    po.renderTrackYoutubeOverrideDialog({
      target: { ...unplayableTrackTarget, hasDefaultYoutubeEmbed: true },
    });

    expect(
      screen.getByRole("heading", {
        name: "Use a different YouTube video",
      }),
    ).toBeInTheDocument();
  });

  it("saves a parsed YouTube id via the tracks API", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onSaved = jest.fn();

    po.renderTrackYoutubeOverrideDialog({
      target: unplayableTrackTarget,
      onClose,
      onSaved,
    });

    await user.type(
      screen.getByLabelText("YouTube URL or video ID"),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    await user.click(screen.getByRole("button", { name: "Save link" }));

    await waitFor(() => {
      expect(po.mockSaveTrackYoutubeOverride).toHaveBeenCalledWith({
        track_key: "101:A2",
        track_position: "A2",
        track_title: "Second",
        instance_id: "101",
        youtube_id: "dQw4w9WgXcQ",
        artist: "Artist",
        release_title: "Album",
      });
    });

    expect(onSaved).toHaveBeenCalledWith("dQw4w9WgXcQ");
    expect(onClose).toHaveBeenCalled();
  });

  it("clears a saved override when the field is emptied and Remove link is saved", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onSaved = jest.fn();

    po.renderTrackYoutubeOverrideDialog({
      target: {
        ...unplayableTrackTarget,
        initialYoutubeId: "dQw4w9WgXcQ",
      },
      onClose,
      onSaved,
    });

    const input = screen.getByLabelText("YouTube URL or video ID");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Remove link" }));

    await waitFor(() => {
      expect(po.mockSaveTrackYoutubeOverride).toHaveBeenCalledWith({
        track_key: "101:A2",
        track_position: "A2",
        track_title: "Second",
        instance_id: "101",
        youtube_id: null,
        artist: "Artist",
        release_title: "Album",
      });
    });

    expect(onSaved).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });
});
