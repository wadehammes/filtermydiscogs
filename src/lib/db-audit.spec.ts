import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { auditLog, getAuditStats } from "src/lib/db-audit";

describe("db-audit", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("when logging create actions, increments stats without sensitive console output", () => {
    auditLog(42, "createPlaylist", "Playlist", "create", "playlist-1");

    const stats = getAuditStats();

    expect(stats.totalOperations).toBe(1);
    expect(stats.byAction.create).toBe(1);
    expect(stats.byModel.Playlist).toBe(1);
    expect(stats.recentOperations[0]?.recordId).toBe("playlist-1");
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("when logging delete actions, emits sensitive-operation audit output", () => {
    auditLog(7, "deletePlaylist", "Playlist", "delete", "playlist-9");

    expect(console.warn).toHaveBeenCalledWith(
      "[AUDIT] Sensitive operation:",
      expect.objectContaining({
        userId: 7,
        operation: "deletePlaylist",
        model: "Playlist",
        action: "delete",
        recordId: "playlist-9",
      }),
    );
  });

  it("when more than 1000 entries are logged, keeps only the latest window", () => {
    for (let index = 0; index < 1005; index += 1) {
      auditLog(null, "bulkImport", "UserTrack", "create", String(index));
    }

    const stats = getAuditStats();

    expect(stats.totalOperations).toBe(1000);
    expect(stats.recentOperations[0]?.recordId).toBe("1004");
  });
});
