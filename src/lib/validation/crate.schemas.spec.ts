import { describe, expect, it } from "@jest/globals";
import {
  CRATE_MARKER_MAX_LENGTH,
  CRATE_NAME_MAX_LENGTH,
  CRATE_NOTES_MAX_LENGTH,
} from "src/constants/crate";
import {
  clearCrateFoundBodySchema,
  crateSyncBodySchema,
  createCrateBodySchema,
  parseCrateLayoutPutRequest,
  updateCrateBodySchema,
} from "src/lib/validation/crate.schemas";

describe("createCrateBodySchema", () => {
  it("trims and accepts valid names", () => {
    expect(
      createCrateBodySchema.parse({ name: "  Weekend favorites  " }),
    ).toEqual({
      name: "Weekend favorites",
    });
  });

  it("rejects empty names", () => {
    const result = createCrateBodySchema.safeParse({ name: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Crate name is required");
    }
  });

  it("rejects names longer than the max length", () => {
    const result = createCrateBodySchema.safeParse({
      name: "a".repeat(CRATE_NAME_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `Crate name must be ${CRATE_NAME_MAX_LENGTH} characters or less`,
      );
    }
  });
});

describe("updateCrateBodySchema", () => {
  it("accepts partial updates", () => {
    expect(updateCrateBodySchema.parse({ private: false })).toEqual({
      private: false,
    });
  });

  it("treats null booleans as omitted fields", () => {
    expect(updateCrateBodySchema.parse({ private: null })).toEqual({});
  });

  it("rejects invalid is_default values", () => {
    const result = updateCrateBodySchema.safeParse({ is_default: "yes" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "is_default must be a boolean",
      );
    }
  });

  it("clears notes when an empty string is provided", () => {
    expect(updateCrateBodySchema.parse({ notes: "   " })).toEqual({
      notes: null,
    });
  });

  it("rejects notes longer than the max length", () => {
    const result = updateCrateBodySchema.safeParse({
      notes: "a".repeat(CRATE_NOTES_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `Crate notes must be ${CRATE_NOTES_MAX_LENGTH} characters or less`,
      );
    }
  });
});

describe("parseCrateLayoutPutRequest", () => {
  it("trims release instance ids and marker labels", () => {
    expect(
      parseCrateLayoutPutRequest({
        items: [
          { kind: "release", instance_id: " 111 " },
          { kind: "marker", label: "  Peak hour  " },
        ],
      }),
    ).toEqual({
      data: {
        items: [
          { kind: "release", instance_id: "111" },
          { kind: "marker", label: "Peak hour" },
        ],
      },
    });
  });

  it("rejects missing release instance ids", () => {
    expect(
      parseCrateLayoutPutRequest({
        items: [{ kind: "release", instance_id: "   " }],
      }),
    ).toEqual({
      error: "Release layout items require instance_id",
    });
  });

  it("rejects marker labels longer than the max length", () => {
    expect(
      parseCrateLayoutPutRequest({
        items: [
          {
            kind: "marker",
            label: "a".repeat(CRATE_MARKER_MAX_LENGTH + 1),
          },
        ],
      }),
    ).toEqual({
      error: `Marker label must be ${CRATE_MARKER_MAX_LENGTH} characters or less`,
    });
  });
});

describe("crateSyncBodySchema", () => {
  it("defaults force to false", () => {
    expect(
      crateSyncBodySchema.parse({
        collectionInstanceIds: ["1", 2],
      }),
    ).toEqual({
      collectionInstanceIds: ["1", 2],
      force: false,
    });
  });

  it("rejects non-array collectionInstanceIds", () => {
    const result = crateSyncBodySchema.safeParse({
      collectionInstanceIds: "1,2,3",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "collectionInstanceIds must be an array",
      );
    }
  });
});

describe("clearCrateFoundBodySchema", () => {
  it("accepts clear_found true", () => {
    expect(clearCrateFoundBodySchema.parse({ clear_found: true })).toEqual({
      clear_found: true,
    });
  });

  it("rejects other values", () => {
    const result = clearCrateFoundBodySchema.safeParse({ clear_found: false });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("clear_found must be true");
    }
  });
});
