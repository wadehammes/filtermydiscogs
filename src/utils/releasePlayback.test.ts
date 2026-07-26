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
  getEmbeddableVideos,
  normalizeTrackTitle,
  parseYoutubeVideoId,
  postYoutubePlayerCommand,
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

  it("falls back to first embeddable video", () => {
    const track: DiscogsTrack = {
      position: "B",
      title: "Unknown B-Side",
      type_: "track",
    };

    expect(findVideoForTrack({ track, videos })?.title).toBe(
      "Artist - Never Gonna Give You Up (Official Video)",
    );
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
    ).toBe(0);
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
