import type {
  DiscogsTrack,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";
import {
  buildYoutubeEmbedUrl,
  buildYoutubeSearchUrl,
  findPlayableTrackIndex,
  findVideoForTrack,
  flattenTracklist,
  formatVideoDuration,
  getEmbeddableVideos,
  getPreviewTrackPosition,
  getReleasePreviewVideos,
  hasPlayableTrackVideo,
  isPreviewTrackPosition,
  isTrackVideoPlayable,
  normalizeTrackTitle,
  parseYoutubeVideoId,
  postYoutubePlayerCommand,
  previewVideoToTrack,
} from "./releasePlayback";

describe("parseYoutubeVideoId", () => {
  it("parses watch URLs", () => {
    expect(
      parseYoutubeVideoId("https://www.youtube.com/watch?v=te2jJncBVG4"),
    ).toBe("te2jJncBVG4");
  });

  it("parses youtu.be URLs", () => {
    expect(parseYoutubeVideoId("https://youtu.be/te2jJncBVG4")).toBe(
      "te2jJncBVG4",
    );
  });

  it("returns null for non-YouTube URLs", () => {
    expect(parseYoutubeVideoId("https://www.discogs.com/release/1")).toBeNull();
  });
});

describe("normalizeTrackTitle", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeTrackTitle("Never Gonna Give You Up!")).toBe(
      "never gonna give you up",
    );
  });
});

describe("getEmbeddableVideos", () => {
  it("filters to embeddable YouTube videos", () => {
    const videos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Track A",
        embed: true,
      },
      {
        uri: "https://www.discogs.com/release/1",
        title: "Not YouTube",
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=xyz98765432",
        title: "No Embed",
        embed: false,
      },
    ];

    expect(getEmbeddableVideos(videos)).toHaveLength(1);
    expect(getEmbeddableVideos(videos)[0]?.title).toBe("Track A");
  });
});

describe("findVideoForTrack", () => {
  const videos: DiscogsVideo[] = [
    {
      uri: "https://www.youtube.com/watch?v=abc12345678",
      title: "Artist - Never Gonna Give You Up (Official Video)",
      embed: true,
    },
    {
      uri: "https://www.youtube.com/watch?v=xyz98765432",
      title: "Full Album Upload",
      embed: true,
    },
  ];

  it("matches track title within video title", () => {
    const track: DiscogsTrack = {
      position: "A",
      title: "Never Gonna Give You Up",
      type_: "track",
    };

    expect(findVideoForTrack({ track, videos })?.title).toContain(
      "Never Gonna Give You Up",
    );
  });

  it("returns null when no title match exists", () => {
    const track: DiscogsTrack = {
      position: "B",
      title: "Unknown B-Side",
      type_: "track",
    };

    expect(findVideoForTrack({ track, videos })).toBeNull();
  });

  it("matches Discogs-style track and video titles with mix and venue details", () => {
    const kerriVideos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title:
          "Kerri Chandler Feat. Lady Linn - You Get Lost In It (Full Vocal Main Mix)",
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "Never Thought [Printworks] (623 Again Vocal)",
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=ghi11223344",
        title:
          "Kerri Chandler ft. Lady Linn - You Get Lost In It [The Warehouse Project] (Instrumental)",
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=jkl55667788",
        title: "Never Thought (623 Again Instrumental) [Printworks]",
        embed: true,
      },
    ];

    expect(
      findVideoForTrack({
        track: {
          position: "A1",
          title: "Never Thought (623 Again Vocal) (Printworks)",
          type_: "track",
        },
        videos: kerriVideos,
      })?.title,
    ).toBe("Never Thought [Printworks] (623 Again Vocal)");

    expect(
      findVideoForTrack({
        track: {
          position: "B1",
          title:
            "You Get Lost In It (Full Vocal Main Mix) (The Warehouse Project)",
          type_: "track",
        },
        videos: kerriVideos,
      })?.title,
    ).toContain("Full Vocal Main Mix");

    expect(
      findVideoForTrack({
        track: {
          position: "B2",
          title: "You Get Lost In It (Instrumental) (The Warehouse Project)",
          type_: "track",
        },
        videos: kerriVideos,
      })?.title,
    ).toContain("Instrumental");
  });
});

describe("getReleasePreviewVideos", () => {
  const videos: DiscogsVideo[] = [
    {
      uri: "https://www.youtube.com/watch?v=abc12345678",
      title: "Artist - Never Gonna Give You Up (Official Video)",
      embed: true,
    },
    {
      uri: "https://www.youtube.com/watch?v=xyz98765432",
      title: "Full Album Upload",
      embed: true,
    },
  ];

  it("returns videos not matched to any track", () => {
    const tracks: DiscogsTrack[] = [
      {
        position: "A",
        title: "Never Gonna Give You Up",
        type_: "track",
      },
    ];

    expect(
      getReleasePreviewVideos(tracks, videos).map((video) => video.title),
    ).toEqual(["Full Album Upload"]);
  });

  it("returns all embeddable videos when no tracks match", () => {
    const tracks: DiscogsTrack[] = [
      {
        position: "A",
        title: "Unknown Track",
        type_: "track",
      },
    ];

    expect(getReleasePreviewVideos(tracks, videos)).toHaveLength(2);
  });
});

describe("hasPlayableTrackVideo", () => {
  it("returns true when at least one track matches a video", () => {
    const tracks: DiscogsTrack[] = [
      { position: "A", title: "No Match", type_: "track" },
      { position: "B", title: "Never Gonna Give You Up", type_: "track" },
    ];
    const videos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Artist - Never Gonna Give You Up",
        embed: true,
      },
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
    const tracklist: DiscogsTrack[] = [
      {
        position: "",
        title: "Side A",
        type_: "heading",
      },
      {
        position: "A1",
        title: "First Track",
        type_: "track",
        sub_tracks: [
          {
            position: "A1.a",
            title: "Nested Track",
            type_: "track",
          },
        ],
      },
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
  it("builds a nocookie embed URL with player API params", () => {
    expect(buildYoutubeEmbedUrl({ videoId: "te2jJncBVG4" })).toBe(
      "https://www.youtube-nocookie.com/embed/te2jJncBVG4?enablejsapi=1&playsinline=1&rel=0",
    );
  });

  it("supports autoplay", () => {
    expect(
      buildYoutubeEmbedUrl({ videoId: "te2jJncBVG4", autoplay: true }),
    ).toBe(
      "https://www.youtube-nocookie.com/embed/te2jJncBVG4?enablejsapi=1&playsinline=1&rel=0&autoplay=1",
    );
  });

  it("supports origin for iframe player commands", () => {
    expect(
      buildYoutubeEmbedUrl({
        videoId: "te2jJncBVG4",
        origin: "http://localhost:6767",
      }),
    ).toBe(
      "https://www.youtube-nocookie.com/embed/te2jJncBVG4?enablejsapi=1&playsinline=1&rel=0&origin=http%3A%2F%2Flocalhost%3A6767",
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
    const video: DiscogsVideo = {
      uri: "https://www.youtube.com/watch?v=abc12345678",
      title: "Full Album Upload",
      duration: 330,
      embed: true,
    };

    const track = previewVideoToTrack(video);

    expect(track.title).toBe("Full Album Upload");
    expect(track.duration).toBe("5:30");
    expect(isPreviewTrackPosition(track.position)).toBe(true);
    expect(getPreviewTrackPosition(video)).toBe(track.position);
  });
});

describe("findPlayableTrackIndex", () => {
  const tracks: DiscogsTrack[] = [
    { position: "A1", title: "No Video", type_: "track" },
    { position: "A2", title: "Has Video", type_: "track" },
    { position: "B1", title: "Also Has Video", type_: "track" },
  ];

  const videos: DiscogsVideo[] = [
    {
      uri: "https://www.youtube.com/watch?v=abc12345678",
      title: "Artist - Has Video",
      embed: true,
    },
    {
      uri: "https://www.youtube.com/watch?v=def98765432",
      title: "Artist - Also Has Video",
      embed: true,
    },
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
