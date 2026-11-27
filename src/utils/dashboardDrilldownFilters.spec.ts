import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DuplicateGroup } from "src/types/dashboard.types";
import {
  buildDashboardDrilldownSessionFilters,
  buildDuplicateGroupDrilldownTarget,
  listYearsForDecadeLabel,
} from "src/utils/dashboardDrilldownFilters";
import { defaultPersistedFilters } from "src/utils/filtersStorage";

describe("listYearsForDecadeLabel", () => {
  it("when label is a decade, returns ten consecutive years", () => {
    expect(listYearsForDecadeLabel("1990s")).toEqual([
      1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
    ]);
  });

  it("when label is not a decade, returns an empty list", () => {
    expect(listYearsForDecadeLabel("Unknown")).toEqual([]);
  });
});

describe("buildDashboardDrilldownSessionFilters", () => {
  it("when kind is genreStyle, sets selectedStyles and clears other facets", () => {
    expect(
      buildDashboardDrilldownSessionFilters({
        kind: "genreStyle",
        label: "Electronic",
      }),
    ).toEqual({
      ...defaultPersistedFilters,
      selectedStyles: ["Electronic"],
    });
  });

  it("when kind is decade, sets selectedYears from the decade label", () => {
    expect(
      buildDashboardDrilldownSessionFilters({
        kind: "decade",
        label: "1980s",
      }),
    ).toEqual({
      ...defaultPersistedFilters,
      selectedYears: [
        1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
      ],
    });
  });

  it("when kind is format, sets selectedFormats", () => {
    expect(
      buildDashboardDrilldownSessionFilters({
        kind: "format",
        label: "Vinyl",
      }),
    ).toEqual({
      ...defaultPersistedFilters,
      selectedFormats: ["Vinyl"],
    });
  });

  it("when kind is search, sets searchQuery", () => {
    expect(
      buildDashboardDrilldownSessionFilters({
        kind: "search",
        label: "Kind of Blue",
      }),
    ).toEqual({
      ...defaultPersistedFilters,
      searchQuery: "Kind of Blue",
    });
  });
});

describe("buildDuplicateGroupDrilldownTarget", () => {
  it("when the group has a titled release, returns a search drilldown", () => {
    const release = releaseFactory.build({
      basic_information: { title: "In Rainbows" },
    });
    const group: DuplicateGroup = {
      key: "master-1",
      type: "master_id",
      releases: [release],
    };

    expect(buildDuplicateGroupDrilldownTarget(group)).toEqual({
      kind: "search",
      label: "In Rainbows",
    });
  });

  it("when the group has no releases, returns null", () => {
    const group: DuplicateGroup = {
      key: "empty",
      type: "master_id",
      releases: [],
    };

    expect(buildDuplicateGroupDrilldownTarget(group)).toBeNull();
  });
});
