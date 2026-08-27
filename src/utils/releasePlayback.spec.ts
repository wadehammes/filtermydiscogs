import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import type {
  DiscogsTrack,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";
import {
  buildReleasePlaybackMatchIndex,
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
  loadYoutubeVideoById,
  normalizeTrackTitle,
  parseTrackDurationToSeconds,
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

  it("matches untitled tracks to numbered videos by order and duration", () => {
    const untitledTracks: DiscogsTrack[] = [
      {
        position: "A1",
        title: "Untitled",
        duration: "5:50",
        type_: "track",
      },
      {
        position: "A2",
        title: "Untitled",
        duration: "4:54",
        type_: "track",
      },
      {
        position: "B",
        title: "Untitled",
        duration: "4:38",
        type_: "track",
      },
    ];
    const veditVideos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Vedit - Track 1 (Vedit 01)",
        duration: 347,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "Vedit - Track 2 (Vedit 01)",
        duration: 277,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=ghi11223344",
        title: "Vedit - Track 3 (Vedit 01)",
        duration: 274,
        embed: true,
      },
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(
      untitledTracks,
      veditVideos,
    );

    expect(matchIndex.hasPlayableTracks).toBe(true);
    expect(matchIndex.previewVideos).toHaveLength(0);
    expect(matchIndex.trackVideoByPosition.get("A1")?.title).toContain(
      "Track 1",
    );
    expect(matchIndex.trackVideoByPosition.get("A2")?.title).toContain(
      "Track 2",
    );
    expect(matchIndex.trackVideoByPosition.get("B")?.title).toContain(
      "Track 3",
    );
  });

  it("findVideoForTrack uses duration fallback when given the full tracklist", () => {
    const untitledTracks: DiscogsTrack[] = [
      {
        position: "A1",
        title: "Untitled",
        duration: "5:50",
        type_: "track",
      },
      {
        position: "A2",
        title: "Untitled",
        duration: "4:54",
        type_: "track",
      },
      {
        position: "B",
        title: "Untitled",
        duration: "4:38",
        type_: "track",
      },
    ];
    const veditVideos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Vedit - Track 1 (Vedit 01)",
        duration: 347,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "Vedit - Track 2 (Vedit 01)",
        duration: 277,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=ghi11223344",
        title: "Vedit - Track 3 (Vedit 01)",
        duration: 274,
        embed: true,
      },
    ];

    expect(
      findVideoForTrack({
        track: untitledTracks[0] as DiscogsTrack,
        tracks: untitledTracks,
        videos: veditVideos,
      })?.title,
    ).toContain("Track 1");
  });

  it("matches untitled variants with attached numbers", () => {
    const untitledTracks: DiscogsTrack[] = [
      {
        position: "A1",
        title: "Untitled01",
        duration: "5:50",
        type_: "track",
      },
      {
        position: "A2",
        title: "Untitled02",
        duration: "4:54",
        type_: "track",
      },
      {
        position: "B1",
        title: "Untitled03",
        duration: "4:38",
        type_: "track",
      },
    ];
    const veditVideos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Vedit - Track 1 (Vedit 01)",
        duration: 347,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "Vedit - Track 2 (Vedit 01)",
        duration: 277,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=ghi11223344",
        title: "Vedit - Track 3 (Vedit 01)",
        duration: 274,
        embed: true,
      },
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(
      untitledTracks,
      veditVideos,
    );

    expect(matchIndex.hasPlayableTracks).toBe(true);
    expect(matchIndex.previewVideos).toHaveLength(0);
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

  it("matches Unicode track titles when video uses a prefixed title and side suffix", () => {
    const sideVideos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "YYY黒803 - A",
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "YYY黒803 - B",
        embed: true,
      },
    ];

    expect(
      findVideoForTrack({
        track: {
          position: "A",
          title: "黒803A",
          type_: "track",
        },
        videos: sideVideos,
      })?.title,
    ).toBe("YYY黒803 - A");

    expect(
      findVideoForTrack({
        track: {
          position: "B",
          title: "黒803B",
          type_: "track",
        },
        videos: sideVideos,
      })?.title,
    ).toBe("YYY黒803 - B");
  });

  it("matches when video titles insert extra characters between shared segments", () => {
    const sideVideos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "YYY – 金606 A",
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "YYY – 金606 B",
        embed: true,
      },
    ];

    expect(
      findVideoForTrack({
        track: {
          position: "A",
          title: "YYY606 A",
          type_: "track",
        },
        videos: sideVideos,
      })?.title,
    ).toBe("YYY – 金606 A");

    expect(
      findVideoForTrack({
        track: {
          position: "B",
          title: "YYY606 B",
          type_: "track",
        },
        videos: sideVideos,
      })?.title,
    ).toBe("YYY – 金606 B");
  });

  it("matches duplicate track titles using position when only the video includes the side", () => {
    const sideVideos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "YYY - 金344 B",
        embed: true,
      },
    ];
    const tracks: DiscogsTrack[] = [
      {
        position: "A",
        title: "金344",
        type_: "track",
      },
      {
        position: "B",
        title: "金344",
        type_: "track",
      },
    ];

    expect(
      findVideoForTrack({
        track: tracks[0] as DiscogsTrack,
        videos: sideVideos,
      }),
    ).toBeNull();

    expect(
      findVideoForTrack({
        track: tracks[1] as DiscogsTrack,
        videos: sideVideos,
      })?.title,
    ).toBe("YYY - 金344 B");

    expect(getReleasePreviewVideos(tracks, sideVideos)).toHaveLength(0);
    expect(
      isTrackVideoPlayable({
        track: tracks[0] as DiscogsTrack,
        videos: sideVideos,
      }),
    ).toBe(false);
    expect(
      isTrackVideoPlayable({
        track: tracks[1] as DiscogsTrack,
        videos: sideVideos,
      }),
    ).toBe(true);
  });

  it("matches when video titles use a common name spelling variant", () => {
    const track: DiscogsTrack = {
      position: "B2.a",
      title: "Zack's Fanfare",
      duration: "0:50",
      type_: "track",
    };
    const videos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
        title: "MFSB - Zach's Fanfare (I Hear Music)",
        duration: 51,
        embed: true,
      },
    ];

    const matchIndex = buildReleasePlaybackMatchIndex([track], videos);

    expect(matchIndex.trackVideoByPosition.get("B2.a")?.title).toContain(
      "Fanfare",
    );
    expect(matchIndex.previewVideos).toHaveLength(0);
  });

  it("matches when numerals and text are reordered in the video title", () => {
    const sideVideos: DiscogsVideo[] = [
      {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "YYY - 白161A [YYY161]",
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "YYY - 白161B [YYY161]",
        embed: true,
      },
    ];

    expect(
      findVideoForTrack({
        track: {
          position: "A",
          title: "161白A",
          type_: "track",
        },
        videos: sideVideos,
      })?.title,
    ).toBe("YYY - 白161A [YYY161]");

    expect(
      findVideoForTrack({
        track: {
          position: "B",
          title: "161白B",
          type_: "track",
        },
        videos: sideVideos,
      })?.title,
    ).toBe("YYY - 白161B [YYY161]");
  });
});

describe("buildReleasePlaybackMatchIndex", () => {
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

  const tracks: DiscogsTrack[] = [
    {
      position: "A",
      title: "Never Gonna Give You Up",
      type_: "track",
    },
  ];

  it("indexes track matches and preview videos in one pass", () => {
    const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);

    expect(matchIndex.hasPlayableTracks).toBe(true);
    expect(matchIndex.embeddableVideos).toHaveLength(2);
    expect(matchIndex.trackVideoByPosition.get("A")?.title).toContain(
      "Never Gonna Give You Up",
    );
    expect(
      findVideoForTrack({
        track: tracks[0] as DiscogsTrack,
        videos,
        matchIndex,
      })?.title,
    ).toContain("Never Gonna Give You Up");
    expect(getReleasePreviewVideos(tracks, videos, matchIndex)).toEqual([
      videos[1],
    ]);
    expect(hasPlayableTrackVideo(tracks, videos, matchIndex)).toBe(true);
    expect(
      isTrackVideoPlayable({
        track: tracks[0] as DiscogsTrack,
        videos,
        matchIndex,
      }),
    ).toBe(true);
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

describe("parseTrackDurationToSeconds", () => {
  it("parses m:ss track durations", () => {
    expect(parseTrackDurationToSeconds("5:50")).toBe(350);
    expect(parseTrackDurationToSeconds("4:54")).toBe(294);
  });

  it("returns null for invalid durations", () => {
    expect(parseTrackDurationToSeconds(undefined)).toBeNull();
    expect(parseTrackDurationToSeconds("n/a")).toBeNull();
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

describe("MFSB Love Is The Message duplicate fanfare regression", () => {
  const release = discogsReleaseJsonFactory.withTracklistAndVideos({
    id: 365838,
    title: "Love Is The Message",
    tracklist: [
      {
        position: "A1.a",
        title: "Zack's Fanfare",
        duration: "0:23",
        type_: "track",
      },
      {
        position: "A1.b",
        title: "Love Is The Message",
        duration: "6:35",
        type_: "track",
      },
      {
        position: "A2",
        title: "Cheaper To Keep Her",
        duration: "6:52",
        type_: "track",
      },
      {
        position: "A3",
        title: "My One And Only Love",
        duration: "4:34",
        type_: "track",
      },
      {
        position: "B1",
        title:
          'TSOP (The Sound Of Philadelphia) (Theme From The Television Show "Soul Train")',
        duration: "3:43",
        type_: "track",
      },
      {
        position: "B2.a",
        title: "Zack's Fanfare",
        duration: "0:50",
        type_: "track",
      },
      {
        position: "B2.b",
        title: "Touch Me In The Morning",
        duration: "6:21",
        type_: "track",
      },
      {
        position: "B3",
        title: "Bitter Sweet",
        duration: "5:26",
        type_: "track",
      },
    ],
    videos: [
      {
        uri: "https://www.youtube.com/watch?v=whSKnSfkhFQ",
        title: "Zack's Fanfare",
        duration: 25,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=M3wpG6Rw-tE",
        title:
          "MFSB - Love Is the Message (Official Audio) ft. The Three Degrees",
        duration: 398,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=J38ylUZESuc",
        title: "Cheaper to Keep Her",
        duration: 415,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=LS2PQs_IRNk",
        title:
          "MFSB - T.S.O.P. (The Sound of Philadelphia) (Official Audio) ft. The Three Degrees",
        duration: 225,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=M5v24kPWeuA",
        title: "Zack's Fanfare (I Hear Music)",
        duration: 51,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=BDgvtCsYN1A",
        title: "Touch Me In The Morning",
        duration: 381,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=LE9ag97xcxw",
        title: "Bitter Sweet",
        duration: 326,
        embed: true,
      },
      {
        uri: "https://www.youtube.com/watch?v=z0VxVJIsxfA",
        title:
          "MFSB ft. The Three Degrees - T.S.O.P. (The Sound of Philadelphia)",
        duration: 349,
        embed: true,
      },
    ],
  });
  const tracks = flattenTracklist(release.tracklist ?? []);
  const videos = release.videos ?? [];

  it("pairs each identically titled fanfare with the right community video", () => {
    const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);

    expect(matchIndex.trackVideoByPosition.get("A1.a")).toMatchObject({
      title: "Zack's Fanfare",
      duration: 25,
    });
    expect(matchIndex.trackVideoByPosition.get("B2.a")).toMatchObject({
      title: "Zack's Fanfare (I Hear Music)",
      duration: 51,
    });
    expect(
      matchIndex.previewVideos.some((video) => video.title.includes("Fanfare")),
    ).toBe(false);
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
