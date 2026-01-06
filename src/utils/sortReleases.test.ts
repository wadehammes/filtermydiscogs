import { SortValues } from "src/context/filters.context";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import { sortReleases } from "./sortReleases";

describe("sortReleases", () => {
  it("sorts by DateAddedNew (newest first)", () => {
    const release1 = releaseFactory.build({
      date_added: "2023-01-01T00:00:00Z",
    });
    const release2 = releaseFactory.build({
      date_added: "2023-01-02T00:00:00Z",
    });
    const release3 = releaseFactory.build({
      date_added: "2023-01-03T00:00:00Z",
    });
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.DateAddedNew);

    expect(result[0]).toEqual(release3);
    expect(result[1]).toEqual(release2);
    expect(result[2]).toEqual(release1);
  });

  it("sorts by DateAddedOld (oldest first)", () => {
    const release1 = releaseFactory.build({
      date_added: "2023-01-01T00:00:00Z",
    });
    const release2 = releaseFactory.build({
      date_added: "2023-01-02T00:00:00Z",
    });
    const release3 = releaseFactory.build({
      date_added: "2023-01-03T00:00:00Z",
    });
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.DateAddedOld);

    expect(result[0]).toEqual(release1);
    expect(result[1]).toEqual(release2);
    expect(result[2]).toEqual(release3);
  });

  it("sorts by AlbumYearNew (newest year first)", () => {
    const release1 = releaseFactory.build();
    release1.basic_information.year = 2020;
    const release2 = releaseFactory.build();
    release2.basic_information.year = 2021;
    const release3 = releaseFactory.build();
    release3.basic_information.year = 2022;
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.AlbumYearNew);

    expect(result[0]).toEqual(release3);
    expect(result[1]).toEqual(release2);
    expect(result[2]).toEqual(release1);
  });

  it("sorts by AlbumYearOld (oldest year first)", () => {
    const release1 = releaseFactory.build();
    release1.basic_information.year = 2020;
    const release2 = releaseFactory.build();
    release2.basic_information.year = 2021;
    const release3 = releaseFactory.build();
    release3.basic_information.year = 2022;
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.AlbumYearOld);

    expect(result[0]).toEqual(release1);
    expect(result[1]).toEqual(release2);
    expect(result[2]).toEqual(release3);
  });

  it("sorts by RatingHigh (highest first)", () => {
    const release1 = releaseFactory.build({
      rating: 3,
    });
    const release2 = releaseFactory.build({
      rating: 5,
    });
    const release3 = releaseFactory.build({
      rating: 4,
    });
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.RatingHigh);

    expect(result[0]).toEqual(release2);
    expect(result[1]).toEqual(release3);
    expect(result[2]).toEqual(release1);
  });

  it("sorts by RatingLow (lowest first)", () => {
    const release1 = releaseFactory.build({
      rating: 3,
    });
    const release2 = releaseFactory.build({
      rating: 5,
    });
    const release3 = releaseFactory.build({
      rating: 4,
    });
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.RatingLow);

    expect(result[0]).toEqual(release1);
    expect(result[1]).toEqual(release3);
    expect(result[2]).toEqual(release2);
  });

  it("sorts by AZArtist (A-Z)", () => {
    const release1 = releaseFactory.build();
    release1.basic_information.artists = [{ name: "Zebra" }];
    const release2 = releaseFactory.build();
    release2.basic_information.artists = [{ name: "Alpha" }];
    const release3 = releaseFactory.build();
    release3.basic_information.artists = [{ name: "Beta" }];
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.AZArtist);

    expect(result[0]).toEqual(release2);
    expect(result[1]).toEqual(release3);
    expect(result[2]).toEqual(release1);
  });

  it("sorts by ZAArtist (Z-A)", () => {
    const release1 = releaseFactory.build();
    release1.basic_information.artists = [{ name: "Alpha" }];
    const release2 = releaseFactory.build();
    release2.basic_information.artists = [{ name: "Zebra" }];
    const release3 = releaseFactory.build();
    release3.basic_information.artists = [{ name: "Beta" }];
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.ZAArtist);

    expect(result[0]).toEqual(release2);
    expect(result[1]).toEqual(release3);
    expect(result[2]).toEqual(release1);
  });

  it("sorts by AZTitle (A-Z)", () => {
    const release1 = releaseFactory.build();
    release1.basic_information.title = "Zebra Album";
    const release2 = releaseFactory.build();
    release2.basic_information.title = "Alpha Album";
    const release3 = releaseFactory.build();
    release3.basic_information.title = "Beta Album";
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.AZTitle);

    expect(result[0]).toEqual(release2);
    expect(result[1]).toEqual(release3);
    expect(result[2]).toEqual(release1);
  });

  it("sorts by ZATitle (Z-A)", () => {
    const release1 = releaseFactory.build();
    release1.basic_information.title = "Alpha Album";
    const release2 = releaseFactory.build();
    release2.basic_information.title = "Zebra Album";
    const release3 = releaseFactory.build();
    release3.basic_information.title = "Beta Album";
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.ZATitle);

    expect(result[0]).toEqual(release2);
    expect(result[1]).toEqual(release3);
    expect(result[2]).toEqual(release1);
  });

  it("sorts by AZLabel (A-Z)", () => {
    const release1 = releaseFactory.build();
    release1.basic_information.labels = [{ name: "Zebra Records" }];
    const release2 = releaseFactory.build();
    release2.basic_information.labels = [{ name: "Alpha Records" }];
    const release3 = releaseFactory.build();
    release3.basic_information.labels = [{ name: "Beta Records" }];
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.AZLabel);

    expect(result[0]).toEqual(release2);
    expect(result[1]).toEqual(release3);
    expect(result[2]).toEqual(release1);
  });

  it("sorts by ZALabel (Z-A)", () => {
    const release1 = releaseFactory.build();
    release1.basic_information.labels = [{ name: "Alpha Records" }];
    const release2 = releaseFactory.build();
    release2.basic_information.labels = [{ name: "Zebra Records" }];
    const release3 = releaseFactory.build();
    release3.basic_information.labels = [{ name: "Beta Records" }];
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.ZALabel);

    expect(result[0]).toEqual(release2);
    expect(result[1]).toEqual(release3);
    expect(result[2]).toEqual(release1);
  });

  it("uses natural sorting for titles with numeric prefixes", () => {
    const release1 = releaseFactory.build();
    release1.basic_information.title = "10 Album";
    const release2 = releaseFactory.build();
    release2.basic_information.title = "2 Album";
    const release3 = releaseFactory.build();
    release3.basic_information.title = "01 Album";
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.AZTitle);

    expect(result[0]?.basic_information.title).toBe("01 Album");
    expect(result[1]?.basic_information.title).toBe("2 Album");
    expect(result[2]?.basic_information.title).toBe("10 Album");
  });

  it("uses natural sorting for artists with numeric prefixes", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        artists: [{ name: "10 Artists" }],
      },
    } as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        artists: [{ name: "2 Artists" }],
      },
    } as Partial<DiscogsRelease>);
    const release3 = releaseFactory.build({
      basic_information: {
        artists: [{ name: "01 Artists" }],
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.AZArtist);

    expect(result[0]?.basic_information.artists[0]?.name).toBe("01 Artists");
    expect(result[1]?.basic_information.artists[0]?.name).toBe("2 Artists");
    expect(result[2]?.basic_information.artists[0]?.name).toBe("10 Artists");
  });

  it("uses natural sorting for labels with numeric prefixes", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        labels: [{ name: "10 Records" }],
      },
    } as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        labels: [{ name: "2 Records" }],
      },
    } as Partial<DiscogsRelease>);
    const release3 = releaseFactory.build({
      basic_information: {
        labels: [{ name: "01 Records" }],
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.AZLabel);

    expect(result[0]?.basic_information.labels[0]?.name).toBe("01 Records");
    expect(result[1]?.basic_information.labels[0]?.name).toBe("2 Records");
    expect(result[2]?.basic_information.labels[0]?.name).toBe("10 Records");
  });

  it("handles releases with numeric prefixes in descending order", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        title: "01 Album",
      },
    } as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        title: "2 Album",
      },
    } as Partial<DiscogsRelease>);
    const release3 = releaseFactory.build({
      basic_information: {
        title: "10 Album",
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.ZATitle);

    expect(result[0]?.basic_information.title).toBe("10 Album");
    expect(result[1]?.basic_information.title).toBe("2 Album");
    expect(result[2]?.basic_information.title).toBe("01 Album");
  });

  it("handles releases without numeric prefixes mixed with numeric prefixes", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        title: "Album",
      },
    } as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        title: "10 Album",
      },
    } as Partial<DiscogsRelease>);
    const release3 = releaseFactory.build({
      basic_information: {
        title: "2 Album",
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2, release3];

    const result = sortReleases(releases, SortValues.AZTitle);

    // Numeric prefixes should come before non-numeric
    expect(result[0]?.basic_information.title).toBe("2 Album");
    expect(result[1]?.basic_information.title).toBe("10 Album");
    expect(result[2]?.basic_information.title).toBe("Album");
  });

  it("handles empty releases array", () => {
    const result = sortReleases([], SortValues.DateAddedNew);

    expect(result).toHaveLength(0);
  });

  it("handles releases with missing year (defaults to 0)", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        year: undefined as unknown as number,
      },
    } as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        year: 2020,
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2];

    const result = sortReleases(releases, SortValues.AlbumYearOld);

    expect(result[0]).toEqual(release1);
    expect(result[1]).toEqual(release2);
  });

  it("handles releases with missing rating (defaults to 0)", () => {
    const release1 = releaseFactory.build({
      rating: undefined as unknown as number,
    });
    const release2 = releaseFactory.build({
      rating: 5,
    });
    const releases = [release1, release2];

    const result = sortReleases(releases, SortValues.RatingLow);

    expect(result[0]).toEqual(release1);
    expect(result[1]).toEqual(release2);
  });

  it("handles releases with missing artist name", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        artists: [],
      },
    } as unknown as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        artists: [{ name: "Artist" }],
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2];

    const result = sortReleases(releases, SortValues.AZArtist);

    // Empty artist should come first (empty string sorts before "artist")
    expect(result[0]).toEqual(release1);
    expect(result[1]).toEqual(release2);
  });

  it("handles releases with missing title", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        title: undefined as unknown as string,
      },
    } as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        title: "Title",
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2];

    const result = sortReleases(releases, SortValues.AZTitle);

    // Empty title should come first
    expect(result[0]).toEqual(release1);
    expect(result[1]).toEqual(release2);
  });

  it("handles releases with missing label name", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        labels: [],
      },
    } as unknown as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        labels: [{ name: "Label" }],
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2];

    const result = sortReleases(releases, SortValues.AZLabel);

    // Empty label should come first
    expect(result[0]).toEqual(release1);
    expect(result[1]).toEqual(release2);
  });

  it("uses default sort (DateAddedNew) for unknown sort value", () => {
    const release1 = releaseFactory.build({
      date_added: "2023-01-01T00:00:00Z",
    });
    const release2 = releaseFactory.build({
      date_added: "2023-01-02T00:00:00Z",
    });
    const releases = [release1, release2];

    const result = sortReleases(releases, "UnknownSort" as SortValues);

    expect(result[0]).toEqual(release2);
    expect(result[1]).toEqual(release1);
  });

  it("does not mutate original array", () => {
    const release1 = releaseFactory.build({
      date_added: "2023-01-01T00:00:00Z",
    });
    const release2 = releaseFactory.build({
      date_added: "2023-01-02T00:00:00Z",
    });
    const releases = [release1, release2];
    const originalOrder = [...releases];

    sortReleases(releases, SortValues.DateAddedNew);

    expect(releases).toEqual(originalOrder);
  });

  it("handles releases with same date_added", () => {
    const release1 = releaseFactory.build({
      date_added: "2023-01-01T00:00:00Z",
    });
    const release2 = releaseFactory.build({
      date_added: "2023-01-01T00:00:00Z",
    });
    const releases = [release1, release2];

    const result = sortReleases(releases, SortValues.DateAddedNew);

    expect(result).toHaveLength(2);
    // Order may be stable but not guaranteed for equal values
  });

  it("handles releases with same year", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        year: 2020,
      },
    } as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        year: 2020,
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2];

    const result = sortReleases(releases, SortValues.AlbumYearNew);

    expect(result).toHaveLength(2);
  });

  it("handles releases with same rating", () => {
    const release1 = releaseFactory.build({
      rating: 5,
    });
    const release2 = releaseFactory.build({
      rating: 5,
    });
    const releases = [release1, release2];

    const result = sortReleases(releases, SortValues.RatingHigh);

    expect(result).toHaveLength(2);
  });

  it("handles releases with same title", () => {
    const release1 = releaseFactory.build({
      basic_information: {
        title: "Same Title",
      },
    } as Partial<DiscogsRelease>);
    const release2 = releaseFactory.build({
      basic_information: {
        title: "Same Title",
      },
    } as Partial<DiscogsRelease>);
    const releases = [release1, release2];

    const result = sortReleases(releases, SortValues.AZTitle);

    expect(result).toHaveLength(2);
  });
});
