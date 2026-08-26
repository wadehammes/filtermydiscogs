import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { createDbModuleMock } from "src/tests/mocks/mockDb";

const dbMock = createDbModuleMock();

jest.mock("src/lib/db", () => dbMock);

type LayoutQueryModule = typeof import("src/lib/crate-layout-query.server");

let hasCrateSetMarkerDelegate: LayoutQueryModule["hasCrateSetMarkerDelegate"];

beforeAll(async () => {
  ({ hasCrateSetMarkerDelegate } = await import(
    "src/lib/crate-layout-query.server"
  ));
});

describe("hasCrateSetMarkerDelegate", () => {
  it("returns true when CrateSetMarkers is on the orm export", () => {
    expect(hasCrateSetMarkerDelegate()).toBe(true);
  });

  it("returns false when CrateSetMarkers is missing from orm", () => {
    const { CrateSetMarkers } = dbMock.orm;
    Reflect.deleteProperty(dbMock.orm, "CrateSetMarkers");

    expect(hasCrateSetMarkerDelegate()).toBe(false);

    dbMock.orm.CrateSetMarkers = CrateSetMarkers;
  });
});
