import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import {
  buildClientYoutubeEmbedUrl,
  buildReleasePlaybackMatchIndex,
  buildYoutubeEmbedUrl,
  buildYoutubeSearchUrl,
  findPlayableTrackIndex,
  findPreviewVideoForTrackPosition,
  flattenTracklist,
  formatVideoDuration,
  getPreviewTrackPosition,
  getReleasePreviewVideos,
  hasPlayableTrackVideo,
  isPreviewTrackPosition,
  isTrackVideoPlayable,
  loadYoutubeVideoById,
  postYoutubePlayerCommand,
  previewVideoToTrack,
  refreshYoutubeEmbedPlayerLayout,
  resolvePlayableTrackAtPosition,
} from "./releasePlayback";

describe("getReleasePreviewVideos", () => {
  const videos = [
    discogsVideoFactory.youtube({
      uri: "https://www.youtube.com/watch?v=abc12345678",
      title: "Artist - Never Gonna Give You Up (Official Video)",
      duration: undefined,
    }),
    discogsVideoFactory.youtube({
      uri: "https://www.youtube.com/watch?v=xyz98765432",
      title: "Full Album Upload",
      duration: undefined,
    }),
  ];

  it("returns videos not matched to any track", () => {
    const tracks = [
      discogsTrackFactory.build({
        position: "A",
        title: "Never Gonna Give You Up",
        type_: "track",
        duration: undefined,
      }),
    ];

    expect(
      getReleasePreviewVideos(tracks, videos).map((video) => video.title),
    ).toEqual(["Full Album Upload"]);
  });

  it("returns all embeddable videos when no tracks match", () => {
    const tracks = [
      discogsTrackFactory.build({
        position: "A",
        title: "Unknown Track",
        type_: "track",
        duration: undefined,
      }),
    ];

    expect(getReleasePreviewVideos(tracks, videos)).toHaveLength(2);
  });
});

describe("hasPlayableTrackVideo", () => {
  it("returns true when at least one track matches a video", () => {
    const tracks = [
      discogsTrackFactory.build({
        position: "A",
        title: "No Match",
        type_: "track",
        duration: undefined,
      }),
      discogsTrackFactory.build({
        position: "B",
        title: "Never Gonna Give You Up",
        type_: "track",
        duration: undefined,
      }),
    ];
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Artist - Never Gonna Give You Up",
        duration: undefined,
      }),
    ];

    expect(hasPlayableTrackVideo(tracks, videos)).toBe(true);
    expect(
      isTrackVideoPlayable({
        track: tracks[1] as DiscogsTrack,
        videos,
      }),
    ).toBe(true);
    expect(
      isTrackVideoPlayable({
        track: tracks[0] as DiscogsTrack,
        videos,
      }),
    ).toBe(false);
  });
});

describe("flattenTracklist", () => {
  it("flattens nested sub-tracks and skips headings", () => {
    const tracklist = [
      discogsTrackFactory.build({
        position: "",
        title: "Side A",
        type_: "heading",
        duration: undefined,
      }),
      discogsTrackFactory.build({
        position: "A1",
        title: "First Track",
        type_: "track",
        duration: undefined,
        sub_tracks: [
          discogsTrackFactory.build({
            position: "A1.a",
            title: "Nested Track",
            type_: "track",
            duration: undefined,
          }),
        ],
      }),
    ];

    expect(flattenTracklist(tracklist).map((track) => track.title)).toEqual([
      "Nested Track",
    ]);
  });
});

describe("buildYoutubeSearchUrl", () => {
  it("builds a search URL", () => {
    expect(
      buildYoutubeSearchUrl({
        artist: "Rick Astley",
        trackTitle: "Never Gonna Give You Up",
      }),
    ).toBe(
      "https://www.youtube.com/results?search_query=Rick%20Astley%20Never%20Gonna%20Give%20You%20Up",
    );
  });
});

describe("buildYoutubeEmbedUrl", () => {
  const originalMockFlag = process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;

  afterEach(() => {
    if (originalMockFlag === undefined) {
      delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
    } else {
      process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = originalMockFlag;
    }
  });

  it("builds a local mock embed URL when E2E mock flag is set", () => {
    process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = "1";

    expect(buildYoutubeEmbedUrl({ videoId: "te2jJncBVG4" })).toBe(
      "/e2e/youtube-embed-mock.html?controls=1&disablekb=0&enablejsapi=1&fs=1&playsinline=1&rel=0&videoId=te2jJncBVG4",
    );
  });

  it("adds embed mock mode query params for reserved harness video ids", () => {
    process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = "1";

    expect(buildYoutubeEmbedUrl({ videoId: "e2eSilent01" })).toContain(
      "mode=silent",
    );
    expect(buildYoutubeEmbedUrl({ videoId: "e2eDelay000" })).toContain(
      "mode=delayed",
    );
    expect(buildYoutubeEmbedUrl({ videoId: "e2eDelay000" })).toContain(
      "delayMs=7200",
    );
  });

  it("builds a nocookie embed URL with player API params", () => {
    expect(buildYoutubeEmbedUrl({ videoId: "te2jJncBVG4" })).toBe(
      "https://www.youtube-nocookie.com/embed/te2jJncBVG4?controls=1&disablekb=0&enablejsapi=1&fs=1&playsinline=1&rel=0",
    );
  });

  it("supports autoplay", () => {
    expect(
      buildYoutubeEmbedUrl({ videoId: "te2jJncBVG4", autoplay: true }),
    ).toBe(
      "https://www.youtube-nocookie.com/embed/te2jJncBVG4?controls=1&disablekb=0&enablejsapi=1&fs=1&playsinline=1&rel=0&autoplay=1",
    );
  });

  it("supports origin for iframe player commands", () => {
    expect(
      buildYoutubeEmbedUrl({
        videoId: "te2jJncBVG4",
        origin: "http://localhost:6767",
      }),
    ).toBe(
      "https://www.youtube-nocookie.com/embed/te2jJncBVG4?controls=1&disablekb=0&enablejsapi=1&fs=1&playsinline=1&rel=0&origin=http%3A%2F%2Flocalhost%3A6767",
    );
  });

  it("returns null for invalid video ids", () => {
    expect(buildYoutubeEmbedUrl({ videoId: "not-valid-id" })).toBeNull();
  });

  it("serves harness mock embed urls for reserved silent ids without the global mock flag", () => {
    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;

    expect(buildYoutubeEmbedUrl({ videoId: "e2eSilent01" })).toContain(
      "/e2e/youtube-embed-mock.html",
    );
    expect(buildYoutubeEmbedUrl({ videoId: "e2eSilent01" })).toContain(
      "mode=silent",
    );
  });

  it("serves harness mock embed urls for the normal e2e video id without the global mock flag", () => {
    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;

    expect(buildYoutubeEmbedUrl({ videoId: "e2eNorm0001" })).toBe(
      "/e2e/youtube-embed-mock.html?controls=1&disablekb=0&enablejsapi=1&fs=1&playsinline=1&rel=0&videoId=e2eNorm0001",
    );
  });
});

describe("buildClientYoutubeEmbedUrl", () => {
  it("adds window origin when building a client embed URL", () => {
    expect(buildClientYoutubeEmbedUrl({ videoId: "te2jJncBVG4" })).toContain(
      "origin=",
    );
  });
});

describe("postYoutubePlayerCommand", () => {
  it("posts a play command to the iframe content window", () => {
    const postMessage = jest.fn();
    const iframe = {
      contentWindow: { postMessage },
    } as unknown as HTMLIFrameElement;

    postYoutubePlayerCommand({ iframe, command: "playVideo" });

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        event: "command",
        func: "playVideo",
        args: "",
      }),
      "*",
    );
  });

  it("refreshes embed layout without reloading the video", () => {
    const postMessage = jest.fn();
    const iframe = {
      contentWindow: { postMessage },
    } as unknown as HTMLIFrameElement;

    refreshYoutubeEmbedPlayerLayout({ iframe });

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        event: "command",
        func: "setSize",
        args: [640, 360],
      }),
      "*",
    );
  });

  it("loads a new video in an existing iframe", () => {
    const postMessage = jest.fn();
    const iframe = {
      contentWindow: { postMessage },
    } as unknown as HTMLIFrameElement;

    loadYoutubeVideoById({ iframe, videoId: "dQw4w9WgXcQ", startSeconds: 0 });

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        event: "command",
        func: "loadVideoById",
        args: ["dQw4w9WgXcQ", 0],
      }),
      "*",
    );
  });

  it("no-ops when the iframe is missing", () => {
    expect(() => {
      postYoutubePlayerCommand({ iframe: null, command: "pauseVideo" });
    }).not.toThrow();
  });
});

describe("formatVideoDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatVideoDuration(330)).toBe("5:30");
    expect(formatVideoDuration(65)).toBe("1:05");
  });

  it("returns undefined when duration is missing", () => {
    expect(formatVideoDuration(undefined)).toBeUndefined();
  });
});

describe("previewVideoToTrack", () => {
  it("maps preview videos to track rows with synthetic positions", () => {
    const video = discogsVideoFactory.youtube({
      uri: "https://www.youtube.com/watch?v=abc12345678",
      title: "Full Album Upload",
      duration: 330,
    });

    const track = previewVideoToTrack(video);

    expect(track.title).toBe("Full Album Upload");
    expect(track.duration).toBe("5:30");
    expect(isPreviewTrackPosition(track.position)).toBe(true);
    expect(getPreviewTrackPosition(video)).toBe(track.position);
  });
});

describe("findPlayableTrackIndex", () => {
  const tracks = [
    discogsTrackFactory.build({
      position: "A1",
      title: "No Video",
      type_: "track",
      duration: undefined,
    }),
    discogsTrackFactory.build({
      position: "A2",
      title: "Has Video",
      type_: "track",
      duration: undefined,
    }),
    discogsTrackFactory.build({
      position: "B1",
      title: "Also Has Video",
      type_: "track",
      duration: undefined,
    }),
  ];

  const videos = [
    discogsVideoFactory.youtube({
      uri: "https://www.youtube.com/watch?v=abc12345678",
      title: "Artist - Has Video",
      duration: undefined,
    }),
    discogsVideoFactory.youtube({
      uri: "https://www.youtube.com/watch?v=def98765432",
      title: "Artist - Also Has Video",
      duration: undefined,
    }),
  ];

  it("finds the first playable track", () => {
    expect(
      findPlayableTrackIndex({
        tracks,
        videos,
        startIndex: -1,
        direction: 1,
      }),
    ).toBe(1);
  });

  it("finds the next playable track", () => {
    expect(
      findPlayableTrackIndex({
        tracks,
        videos,
        startIndex: 0,
        direction: 1,
      }),
    ).toBe(1);
  });

  it("returns null when there are no embeddable videos", () => {
    expect(
      findPlayableTrackIndex({
        tracks,
        videos: [],
        startIndex: -1,
        direction: 1,
      }),
    ).toBeNull();
  });
});

describe("resolvePlayableTrackAtPosition", () => {
  it("returns track and matched video for a playable position", () => {
    const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 1,
    });
    const tracks = flattenTracklist(releaseDetail.tracklist ?? []);
    const matchIndex = buildReleasePlaybackMatchIndex(
      tracks,
      releaseDetail.videos ?? [],
    );
    const position = tracks[0]?.position;

    expect(position).toBeDefined();

    const resolved = resolvePlayableTrackAtPosition({
      trackPosition: position ?? "",
      tracks,
      playbackMatchIndex: matchIndex,
    });

    expect(resolved?.track.position).toBe(position);
    expect(resolved?.matchedVideo.uri).toContain("youtube");
  });

  it("returns null when the position has no matched video", () => {
    const tracks = [discogsTrackFactory.build({ position: "Z9" })];
    const matchIndex = buildReleasePlaybackMatchIndex(tracks, []);

    expect(
      resolvePlayableTrackAtPosition({
        trackPosition: "Z9",
        tracks,
        playbackMatchIndex: matchIndex,
      }),
    ).toBeNull();
  });
});

describe("findPreviewVideoForTrackPosition", () => {
  it("finds preview video from synthetic preview track position", () => {
    const video = discogsVideoFactory.youtube({
      uri: "https://www.youtube.com/watch?v=preview12345",
    });
    const trackPosition = getPreviewTrackPosition(video);

    expect(
      findPreviewVideoForTrackPosition({
        trackPosition,
        releasePreviewVideos: [video],
      }),
    ).toBe(video);
  });

  it("returns null for non-preview positions", () => {
    expect(
      findPreviewVideoForTrackPosition({
        trackPosition: "A1",
        releasePreviewVideos: [],
      }),
    ).toBeNull();
  });
});
