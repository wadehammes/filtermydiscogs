import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createDbModuleMock } from "src/tests/mocks/mockDb";

const dbMock = createDbModuleMock();

jest.mock("src/lib/db", () => dbMock);

describe("fetchCrateReleaseCountsByCrateId", () => {
  let fetchCrateReleaseCountsByCrateId: typeof import("src/lib/crate-release-counts.server").fetchCrateReleaseCountsByCrateId;
  let mockCrateReleasesAggregate: typeof dbMock.orm.CrateReleases.aggregate;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    ({ fetchCrateReleaseCountsByCrateId } = await import(
      "src/lib/crate-release-counts.server"
    ));
    mockCrateReleasesAggregate = dbMock.orm.CrateReleases.aggregate;
  });

  it("returns an empty map when crateIds is empty", async () => {
    await expect(
      fetchCrateReleaseCountsByCrateId({ userId: 1, crateIds: [] }),
    ).resolves.toEqual(new Map());

    expect(mockCrateReleasesAggregate).not.toHaveBeenCalled();
  });

  it("maps grouped release counts by crate id", async () => {
    mockCrateReleasesAggregate.mockResolvedValue([
      { crateId: "a", count: 0 },
      { crateId: "b", count: 3 },
      { crateId: "c", count: 1 },
    ]);

    await expect(
      fetchCrateReleaseCountsByCrateId({
        userId: 42,
        crateIds: ["a", "b", "c", "missing"],
      }),
    ).resolves.toEqual(
      new Map([
        ["a", 0],
        ["b", 3],
        ["c", 1],
      ]),
    );
  });
});
