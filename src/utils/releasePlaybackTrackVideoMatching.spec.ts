import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import {
  buildReleasePlaybackMatchIndex as buildMatchIndexFromBarrel,
  findVideoForTrack,
  flattenTracklist,
  getReleasePreviewVideos,
  hasPlayableTrackVideo,
  isTrackVideoPlayable,
} from "./releasePlayback";
import {
  buildReleasePlaybackMatchIndex,
  getEmbeddableVideos,
  normalizeTrackTitle,
  parseTrackDurationToSeconds,
  parseYoutubeVideoId,
} from "./releasePlaybackTrackVideoMatching";

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
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Track A",
      }),
      discogsVideoFactory.nonYoutube({ title: "Not YouTube" }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=xyz98765432",
        title: "No Embed",
        embed: false,
      }),
    ];

    expect(getEmbeddableVideos(videos)).toHaveLength(1);
    expect(getEmbeddableVideos(videos)[0]?.title).toBe("Track A");
  });
});

describe("findVideoForTrack", () => {
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

  it("matches track title within video title", () => {
    const track = discogsTrackFactory.build({
      position: "A",
      title: "Never Gonna Give You Up",
      type_: "track",
      duration: undefined,
    });

    expect(findVideoForTrack({ track, videos })?.title).toContain(
      "Never Gonna Give You Up",
    );
  });

  it("returns null when no title match exists", () => {
    const track = discogsTrackFactory.build({
      position: "B",
      title: "Unknown B-Side",
      type_: "track",
      duration: undefined,
    });

    expect(findVideoForTrack({ track, videos })).toBeNull();
  });

  it("matches untitled tracks to numbered videos by order and duration", () => {
    const untitledTracks = [
      discogsTrackFactory.untitled({ position: "A1", duration: "5:50" }),
      discogsTrackFactory.untitled({ position: "A2", duration: "4:54" }),
      discogsTrackFactory.untitled({ position: "B", duration: "4:38" }),
    ];
    const veditVideos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Vedit - Track 1 (Vedit 01)",
        duration: 347,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "Vedit - Track 2 (Vedit 01)",
        duration: 277,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=ghi11223344",
        title: "Vedit - Track 3 (Vedit 01)",
        duration: 274,
      }),
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
    const untitledTracks = [
      discogsTrackFactory.untitled({ position: "A1", duration: "5:50" }),
      discogsTrackFactory.untitled({ position: "A2", duration: "4:54" }),
      discogsTrackFactory.untitled({ position: "B", duration: "4:38" }),
    ];
    const veditVideos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Vedit - Track 1 (Vedit 01)",
        duration: 347,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "Vedit - Track 2 (Vedit 01)",
        duration: 277,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=ghi11223344",
        title: "Vedit - Track 3 (Vedit 01)",
        duration: 274,
      }),
    ];

    expect(
      findVideoForTrack({
        track: untitledTracks[0] as DiscogsTrack,
        tracks: untitledTracks,
        videos: veditVideos,
      })?.title,
    ).toContain("Track 1");
  });

  it("matches Untitled tracks to position-prefixed Unknown videos without track durations", () => {
    const untitledTracks = [
      discogsTrackFactory.untitled({ position: "A1", duration: undefined }),
      discogsTrackFactory.untitled({ position: "A2", duration: undefined }),
      discogsTrackFactory.untitled({ position: "B1", duration: undefined }),
      discogsTrackFactory.untitled({ position: "B2", duration: undefined }),
    ];
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
        title: "Fulvio Ruffert & Max / Unknown Collective - A1 Unknown (UNK10)",
        duration: 486,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
        title: "Fulvio Ruffert & Max / Unknown Collective - A2 Unknown (UNK10)",
        duration: 367,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=ccccccccccc",
        title: "Fulvio Ruffert & Max / Unknown Collective - B1 Unknown (UNK10)",
        duration: 455,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=ddddddddddd",
        title: "Fulvio Ruffert & Max / Unknown Collective - B2 Unknown (UNK10)",
        duration: 453,
      }),
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(untitledTracks, videos);

    expect(matchIndex.hasPlayableTracks).toBe(true);
    expect(matchIndex.previewVideos).toHaveLength(0);
    expect(matchIndex.trackVideoByPosition.get("A1")?.title).toContain(
      "A1 Unknown",
    );
    expect(matchIndex.trackVideoByPosition.get("A2")?.title).toContain(
      "A2 Unknown",
    );
    expect(matchIndex.trackVideoByPosition.get("B1")?.title).toContain(
      "B1 Unknown",
    );
    expect(matchIndex.trackVideoByPosition.get("B2")?.title).toContain(
      "B2 Unknown",
    );
  });

  it("matches position-prefixed Unknown videos even when video list order differs from the tracklist", () => {
    const untitledTracks = [
      discogsTrackFactory.untitled({ position: "A1", duration: undefined }),
      discogsTrackFactory.untitled({ position: "A2", duration: undefined }),
      discogsTrackFactory.untitled({ position: "B1", duration: undefined }),
      discogsTrackFactory.untitled({ position: "B2", duration: undefined }),
    ];
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=ddddddddddd",
        title: "Fulvio Ruffert & Max / Unknown Collective - B2 Unknown (UNK10)",
        duration: 453,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
        title: "Fulvio Ruffert & Max / Unknown Collective - A2 Unknown (UNK10)",
        duration: 367,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
        title: "Fulvio Ruffert & Max / Unknown Collective - A1 Unknown (UNK10)",
        duration: 486,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=ccccccccccc",
        title: "Fulvio Ruffert & Max / Unknown Collective - B1 Unknown (UNK10)",
        duration: 455,
      }),
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(untitledTracks, videos);

    expect(matchIndex.trackVideoByPosition.get("A1")?.uri).toContain(
      "aaaaaaaaaaa",
    );
    expect(matchIndex.trackVideoByPosition.get("A2")?.uri).toContain(
      "bbbbbbbbbbb",
    );
    expect(matchIndex.trackVideoByPosition.get("B1")?.uri).toContain(
      "ccccccccccc",
    );
    expect(matchIndex.trackVideoByPosition.get("B2")?.uri).toContain(
      "ddddddddddd",
    );
    expect(matchIndex.previewVideos).toHaveLength(0);
  });

  it("does not pair a named track to a position-prefixed Unknown video by position alone", () => {
    const tracks = [
      discogsTrackFactory.build({
        position: "A1",
        title: "Sunset Drive",
        type_: "track",
        duration: undefined,
      }),
      discogsTrackFactory.untitled({ position: "A2", duration: undefined }),
    ];
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
        title: "Artist - A1 Unknown (CAT01)",
        duration: 200,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
        title: "Artist - A2 Unknown (CAT01)",
        duration: 210,
      }),
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);

    expect(matchIndex.trackVideoByPosition.has("A1")).toBe(false);
    expect(matchIndex.trackVideoByPosition.get("A2")?.title).toContain(
      "A2 Unknown",
    );
    expect(matchIndex.previewVideos).toHaveLength(1);
    expect(matchIndex.previewVideos[0]?.title).toContain("A1 Unknown");
  });

  it("matches Untitled box-set sides beyond D by position prefix", () => {
    const tracks = [
      discogsTrackFactory.untitled({ position: "G1", duration: undefined }),
      discogsTrackFactory.untitled({ position: "Z2", duration: undefined }),
    ];
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=zzzzzzzzzzz",
        title: "Various - Z2 Unknown (BOX1)",
        duration: 300,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=ggggggggggg",
        title: "Various - G1 Unknown (BOX1)",
        duration: 280,
      }),
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);

    expect(matchIndex.trackVideoByPosition.get("G1")?.uri).toContain(
      "ggggggggggg",
    );
    expect(matchIndex.trackVideoByPosition.get("Z2")?.uri).toContain(
      "zzzzzzzzzzz",
    );
    expect(matchIndex.previewVideos).toHaveLength(0);
  });

  it("matches untitled variants with attached numbers", () => {
    const untitledTracks = [
      discogsTrackFactory.build({
        position: "A1",
        title: "Untitled01",
        duration: "5:50",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "A2",
        title: "Untitled02",
        duration: "4:54",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "B1",
        title: "Untitled03",
        duration: "4:38",
        type_: "track",
      }),
    ];
    const veditVideos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Vedit - Track 1 (Vedit 01)",
        duration: 347,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "Vedit - Track 2 (Vedit 01)",
        duration: 277,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=ghi11223344",
        title: "Vedit - Track 3 (Vedit 01)",
        duration: 274,
      }),
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(
      untitledTracks,
      veditVideos,
    );

    expect(matchIndex.hasPlayableTracks).toBe(true);
    expect(matchIndex.previewVideos).toHaveLength(0);
  });

  it("matches Discogs-style track and video titles with mix and venue details", () => {
    const kerriVideos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title:
          "Kerri Chandler Feat. Lady Linn - You Get Lost In It (Full Vocal Main Mix)",
        duration: undefined,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "Never Thought [Printworks] (623 Again Vocal)",
        duration: undefined,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=ghi11223344",
        title:
          "Kerri Chandler ft. Lady Linn - You Get Lost In It [The Warehouse Project] (Instrumental)",
        duration: undefined,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=jkl55667788",
        title: "Never Thought (623 Again Instrumental) [Printworks]",
        duration: undefined,
      }),
    ];

    expect(
      findVideoForTrack({
        track: discogsTrackFactory.build({
          position: "A1",
          title: "Never Thought (623 Again Vocal) (Printworks)",
          type_: "track",
          duration: undefined,
        }),
        videos: kerriVideos,
      })?.title,
    ).toBe("Never Thought [Printworks] (623 Again Vocal)");

    expect(
      findVideoForTrack({
        track: discogsTrackFactory.build({
          position: "B1",
          title:
            "You Get Lost In It (Full Vocal Main Mix) (The Warehouse Project)",
          type_: "track",
          duration: undefined,
        }),
        videos: kerriVideos,
      })?.title,
    ).toContain("Full Vocal Main Mix");

    expect(
      findVideoForTrack({
        track: discogsTrackFactory.build({
          position: "B2",
          title: "You Get Lost In It (Instrumental) (The Warehouse Project)",
          type_: "track",
          duration: undefined,
        }),
        videos: kerriVideos,
      })?.title,
    ).toContain("Instrumental");
  });

  it("matches Unicode track titles when video uses a prefixed title and side suffix", () => {
    const sideVideos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "YYY黒803 - A",
        duration: undefined,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "YYY黒803 - B",
        duration: undefined,
      }),
    ];

    expect(
      findVideoForTrack({
        track: discogsTrackFactory.build({
          position: "A",
          title: "黒803A",
          type_: "track",
          duration: undefined,
        }),
        videos: sideVideos,
      })?.title,
    ).toBe("YYY黒803 - A");

    expect(
      findVideoForTrack({
        track: discogsTrackFactory.build({
          position: "B",
          title: "黒803B",
          type_: "track",
          duration: undefined,
        }),
        videos: sideVideos,
      })?.title,
    ).toBe("YYY黒803 - B");
  });

  it("matches when video titles insert extra characters between shared segments", () => {
    const sideVideos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "YYY – 金606 A",
        duration: undefined,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "YYY – 金606 B",
        duration: undefined,
      }),
    ];

    expect(
      findVideoForTrack({
        track: discogsTrackFactory.build({
          position: "A",
          title: "YYY606 A",
          type_: "track",
          duration: undefined,
        }),
        videos: sideVideos,
      })?.title,
    ).toBe("YYY – 金606 A");

    expect(
      findVideoForTrack({
        track: discogsTrackFactory.build({
          position: "B",
          title: "YYY606 B",
          type_: "track",
          duration: undefined,
        }),
        videos: sideVideos,
      })?.title,
    ).toBe("YYY – 金606 B");
  });

  it("matches duplicate track titles using position when only the video includes the side", () => {
    const sideVideos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "YYY - 金344 B",
        duration: undefined,
      }),
    ];
    const tracks = [
      discogsTrackFactory.build({
        position: "A",
        title: "金344",
        type_: "track",
        duration: undefined,
      }),
      discogsTrackFactory.build({
        position: "B",
        title: "金344",
        type_: "track",
        duration: undefined,
      }),
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
    const track = discogsTrackFactory.build({
      position: "B2.a",
      title: "Zack's Fanfare",
      duration: "0:50",
      type_: "track",
    });
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
        title: "MFSB - Zach's Fanfare (I Hear Music)",
        duration: 51,
      }),
    ];

    const matchIndex = buildReleasePlaybackMatchIndex([track], videos);

    expect(matchIndex.trackVideoByPosition.get("B2.a")?.title).toContain(
      "Fanfare",
    );
    expect(matchIndex.previewVideos).toHaveLength(0);
  });

  it("matches when numerals and text are reordered in the video title", () => {
    const sideVideos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "YYY - 白161A [YYY161]",
        duration: undefined,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "YYY - 白161B [YYY161]",
        duration: undefined,
      }),
    ];

    expect(
      findVideoForTrack({
        track: discogsTrackFactory.build({
          position: "A",
          title: "161白A",
          type_: "track",
          duration: undefined,
        }),
        videos: sideVideos,
      })?.title,
    ).toBe("YYY - 白161A [YYY161]");

    expect(
      findVideoForTrack({
        track: discogsTrackFactory.build({
          position: "B",
          title: "161白B",
          type_: "track",
          duration: undefined,
        }),
        videos: sideVideos,
      })?.title,
    ).toBe("YYY - 白161B [YYY161]");
  });

  it("matches when the video title omits mix suffixes present on the track", () => {
    const tracks = [
      discogsTrackFactory.build({
        position: "A1",
        title: "Ama 76 (Original Mix)",
        type_: "track",
        duration: "7:30",
      }),
      discogsTrackFactory.build({
        position: "A2",
        title: "Part2",
        type_: "track",
        duration: "7:00",
      }),
      discogsTrackFactory.build({
        position: "B1",
        title: "Ama 76 (Crihan Remix)",
        type_: "track",
        duration: "7:45",
      }),
    ];
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Moratu - Ama 76 [VISAGE001]",
        duration: 450,
      }),
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);

    expect(matchIndex.previewVideos).toHaveLength(0);
    expect(matchIndex.trackVideoByPosition.get("A1")?.title).toBe(
      "Moratu - Ama 76 [VISAGE001]",
    );
    expect(matchIndex.trackVideoByPosition.has("B1")).toBe(false);
    expect(
      findVideoForTrack({
        track: tracks[0] as DiscogsTrack,
        videos,
        matchIndex,
      })?.title,
    ).toBe("Moratu - Ama 76 [VISAGE001]");
  });

  it("does not match the original track to a remix video when both share the base title", () => {
    const tracks = [
      discogsTrackFactory.build({
        position: "A1",
        title: "Bass Persuades",
        type_: "track",
        duration: "3:22",
      }),
      discogsTrackFactory.build({
        position: "B5",
        title: "Bass Persuades Remixx",
        type_: "track",
        duration: "3:36",
      }),
    ];
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=original1111",
        title: "Miley Cyrus - Bass Persuades",
        duration: 202,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=remix222222",
        title: "Miley Cyrus - Bass Persuades Remixx",
        duration: 216,
      }),
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);

    expect(matchIndex.trackVideoByPosition.get("A1")?.uri).toContain(
      "original1111",
    );
    expect(matchIndex.trackVideoByPosition.get("B5")?.uri).toContain(
      "remix222222",
    );
  });

  it("matches remix tracks when the video title includes remix", () => {
    const tracks = [
      discogsTrackFactory.build({
        position: "A1",
        title: "Ama 76 (Original Mix)",
        type_: "track",
        duration: "7:30",
      }),
      discogsTrackFactory.build({
        position: "B1",
        title: "Ama 76 (Crihan Remix)",
        type_: "track",
        duration: "7:45",
      }),
    ];
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=def98765432",
        title: "Moratu - Ama 76 (Crihan Remix) [VISAGE001]",
        duration: 465,
      }),
    ];

    const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);

    expect(matchIndex.previewVideos).toHaveLength(0);
    expect(matchIndex.trackVideoByPosition.get("B1")?.title).toBe(
      "Moratu - Ama 76 (Crihan Remix) [VISAGE001]",
    );
    expect(matchIndex.trackVideoByPosition.has("A1")).toBe(false);
  });
});

describe("buildReleasePlaybackMatchIndex", () => {
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

  const tracks = [
    discogsTrackFactory.build({
      position: "A",
      title: "Never Gonna Give You Up",
      type_: "track",
      duration: undefined,
    }),
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
describe("MFSB Love Is The Message duplicate fanfare regression", () => {
  const release = discogsReleaseJsonFactory.withTracklistAndVideos({
    id: 365838,
    title: "Love Is The Message",
    tracklist: [
      discogsTrackFactory.build({
        position: "A1.a",
        title: "Zack's Fanfare",
        duration: "0:23",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "A1.b",
        title: "Love Is The Message",
        duration: "6:35",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "A2",
        title: "Cheaper To Keep Her",
        duration: "6:52",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "A3",
        title: "My One And Only Love",
        duration: "4:34",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "B1",
        title:
          'TSOP (The Sound Of Philadelphia) (Theme From The Television Show "Soul Train")',
        duration: "3:43",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "B2.a",
        title: "Zack's Fanfare",
        duration: "0:50",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "B2.b",
        title: "Touch Me In The Morning",
        duration: "6:21",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "B3",
        title: "Bitter Sweet",
        duration: "5:26",
        type_: "track",
      }),
    ],
    videos: [
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=whSKnSfkhFQ",
        title: "Zack's Fanfare",
        duration: 25,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=M3wpG6Rw-tE",
        title:
          "MFSB - Love Is the Message (Official Audio) ft. The Three Degrees",
        duration: 398,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=J38ylUZESuc",
        title: "Cheaper to Keep Her",
        duration: 415,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=LS2PQs_IRNk",
        title:
          "MFSB - T.S.O.P. (The Sound of Philadelphia) (Official Audio) ft. The Three Degrees",
        duration: 225,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=M5v24kPWeuA",
        title: "Zack's Fanfare (I Hear Music)",
        duration: 51,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=BDgvtCsYN1A",
        title: "Touch Me In The Morning",
        duration: 381,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=LE9ag97xcxw",
        title: "Bitter Sweet",
        duration: 326,
      }),
      discogsVideoFactory.youtube({
        uri: "https://www.youtube.com/watch?v=z0VxVJIsxfA",
        title:
          "MFSB ft. The Three Degrees - T.S.O.P. (The Sound of Philadelphia)",
        duration: 349,
      }),
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

describe("releasePlayback barrel", () => {
  it("re-exports buildReleasePlaybackMatchIndex", () => {
    expect(buildMatchIndexFromBarrel).toBe(buildReleasePlaybackMatchIndex);
  });
});
