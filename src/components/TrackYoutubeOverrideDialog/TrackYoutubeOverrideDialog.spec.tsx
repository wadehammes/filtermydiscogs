import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { TrackYoutubeOverrideDialog } from "src/components/TrackYoutubeOverrideDialog/TrackYoutubeOverrideDialog.component";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { fireEvent, render, screen, waitFor } from "test-utils";

jest.mock("src/api/urls", () => ({
  api: {
    fetchYoutubeOembed: jest.fn(),
    saveTrackYoutubeOverride: jest.fn(),
  },
}));

const mockFetchYoutubeOembed = jest.mocked(api.fetchYoutubeOembed);
const mockSaveTrackYoutubeOverride = jest.mocked(api.saveTrackYoutubeOverride);
const apiError = new Error("save failed");

const getPreviewThumbnail = (preview: HTMLElement): HTMLImageElement => {
  const thumbnail = preview.querySelector("img");

  if (!(thumbnail instanceof HTMLImageElement)) {
    throw new Error("Expected a preview thumbnail image");
  }

  return thumbnail;
};

const target = {
  trackKey: "101:A2",
  trackPosition: "A2",
  trackTitle: "Second",
  instanceId: "101",
  artist: "Artist",
  releaseTitle: "Album",
  discogsReleaseId: 249504,
  initialYoutubeId: null,
};

describe("TrackYoutubeOverrideDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiResponse(true, mockSaveTrackYoutubeOverride, { ok: true }, apiError);
    mockFetchYoutubeOembed.mockResolvedValue({
      title: "Never Gonna Give You Up",
      authorName: "Rick Astley",
    });
  });

  it("links to the Discogs release video upload page for community sharing", () => {
    render(
      <TrackYoutubeOverrideDialog
        open
        target={target}
        onClose={() => undefined}
      />,
    );

    const link = screen.getByRole("link", { name: "add the video on Discogs" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.discogs.com/release/249504/videos/update",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("uses an add title when the track has no Discogs embed or saved link", () => {
    render(
      <TrackYoutubeOverrideDialog
        open
        target={target}
        onClose={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Add a YouTube video" }),
    ).toBeInTheDocument();
  });

  it("shows artist, album, and track in the dialog description", () => {
    render(
      <TrackYoutubeOverrideDialog
        open
        target={target}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("Artist · Album")).toBeInTheDocument();
    expect(screen.getByText("A2 · Second")).toBeInTheDocument();
  });

  it("shows the preview for initialPreviewVideoId when the field is still empty", async () => {
    render(
      <TrackYoutubeOverrideDialog
        open
        target={{ ...target, initialPreviewVideoId: "dQw4w9WgXcQ" }}
        onClose={() => undefined}
      />,
    );

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

    render(
      <TrackYoutubeOverrideDialog
        open
        target={target}
        onClose={() => undefined}
      />,
    );

    await user.type(
      screen.getByLabelText("YouTube URL or video ID"),
      "dQw4w9WgXcQ",
    );

    await waitFor(() => {
      expect(mockFetchYoutubeOembed).toHaveBeenCalledWith("dQw4w9WgXcQ");
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

    render(
      <TrackYoutubeOverrideDialog
        open
        target={target}
        onClose={() => undefined}
      />,
    );

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

    render(
      <TrackYoutubeOverrideDialog
        open
        target={target}
        onClose={() => undefined}
      />,
    );

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
    render(
      <TrackYoutubeOverrideDialog
        open
        target={{ ...target, hasDefaultYoutubeEmbed: true }}
        onClose={() => undefined}
      />,
    );

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

    render(
      <TrackYoutubeOverrideDialog
        open
        target={target}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    await user.type(
      screen.getByLabelText("YouTube URL or video ID"),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    await user.click(screen.getByRole("button", { name: "Save link" }));

    await waitFor(() => {
      expect(mockSaveTrackYoutubeOverride).toHaveBeenCalledWith({
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

    render(
      <TrackYoutubeOverrideDialog
        open
        target={{ ...target, initialYoutubeId: "dQw4w9WgXcQ" }}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    const input = screen.getByLabelText("YouTube URL or video ID");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Remove link" }));

    await waitFor(() => {
      expect(mockSaveTrackYoutubeOverride).toHaveBeenCalledWith({
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
