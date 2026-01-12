import { collectionFactory } from "src/tests/factories/Collection.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  prepareCollectionForSync,
  type SyncCollectionResult,
} from "./syncCollection.helper";

describe("prepareCollectionForSync", () => {
  describe("validation errors", () => {
    it("returns error when collection data is undefined", () => {
      const result = prepareCollectionForSync(
        undefined,
        false,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Collection data is not available. Please wait for your collection to load.",
      );
      expect(result.instanceIds).toBeUndefined();
    });

    it("returns error when collection data has no pages", () => {
      const result = prepareCollectionForSync(
        { pages: [] },
        false,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Collection data is not available. Please wait for your collection to load.",
      );
      expect(result.instanceIds).toBeUndefined();
    });

    it("returns error when hasNextPage is true", () => {
      const collectionData = {
        pages: [collectionFactory.build()],
      };

      const result = prepareCollectionForSync(
        collectionData,
        true,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Please wait for your collection to finish loading before syncing.",
      );
      expect(result.instanceIds).toBeUndefined();
    });

    it("returns error when isFetchingNextPage is true", () => {
      const collectionData = {
        pages: [collectionFactory.build()],
      };

      const result = prepareCollectionForSync(
        collectionData,
        false,
        true,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Please wait for your collection to finish loading before syncing.",
      );
      expect(result.instanceIds).toBeUndefined();
    });

    it("returns error when collection has no releases", () => {
      const collectionData = {
        pages: [
          {
            ...collectionFactory.build(),
            releases: [],
          },
        ],
      };

      const result = prepareCollectionForSync(
        collectionData,
        false,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("No releases found in your collection.");
      expect(result.instanceIds).toBeUndefined();
    });

    it("returns error when releases have no instance_id", () => {
      const release1 = releaseFactory.build();
      const release2 = releaseFactory.build();
      // Remove instance_id property to simulate missing data
      const { instance_id: _, ...releaseWithoutId1 } = release1;
      const { instance_id: __, ...releaseWithoutId2 } = release2;

      const collectionData = {
        pages: [
          {
            ...collectionFactory.build(),
            releases: [
              releaseWithoutId1 as typeof release1,
              releaseWithoutId2 as typeof release2,
            ],
          },
        ],
      };

      const result = prepareCollectionForSync(
        collectionData,
        false,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("No releases found in your collection.");
      expect(result.instanceIds).toBeUndefined();
    });
  });

  describe("successful extraction", () => {
    it("extracts instance IDs from single page", () => {
      const release1 = releaseFactory.build({ instance_id: "123" });
      const release2 = releaseFactory.build({ instance_id: "456" });
      const collectionData = {
        pages: [
          {
            ...collectionFactory.build(),
            releases: [release1, release2],
          },
        ],
      };

      const result = prepareCollectionForSync(
        collectionData,
        false,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.instanceIds).toEqual(["123", "456"]);
    });

    it("extracts instance IDs from multiple pages", () => {
      const release1 = releaseFactory.build({ instance_id: "111" });
      const release2 = releaseFactory.build({ instance_id: "222" });
      const release3 = releaseFactory.build({ instance_id: "333" });
      const release4 = releaseFactory.build({ instance_id: "444" });

      const collectionData = {
        pages: [
          {
            ...collectionFactory.build(),
            releases: [release1, release2],
          },
          {
            ...collectionFactory.build(),
            releases: [release3, release4],
          },
        ],
      };

      const result = prepareCollectionForSync(
        collectionData,
        false,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.instanceIds).toEqual(["111", "222", "333", "444"]);
    });

    it("converts instance IDs to strings", () => {
      const release1 = releaseFactory.build({ instance_id: "123" });
      const release2 = releaseFactory.build({ instance_id: "456" });
      const collectionData = {
        pages: [
          {
            ...collectionFactory.build(),
            releases: [release1, release2],
          },
        ],
      };

      const result = prepareCollectionForSync(
        collectionData,
        false,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(true);
      expect(result.instanceIds).toEqual(["123", "456"]);
    });

    it("filters out releases without instance_id", () => {
      const release1 = releaseFactory.build({ instance_id: "123" });
      const release2 = releaseFactory.build();
      const release3 = releaseFactory.build({ instance_id: "456" });
      const release4 = releaseFactory.build();
      const { instance_id: _, ...releaseWithoutId2 } = release2;
      const { instance_id: __, ...releaseWithoutId4 } = release4;

      const collectionData = {
        pages: [
          {
            ...collectionFactory.build(),
            releases: [
              release1,
              releaseWithoutId2 as typeof release2,
              release3,
              releaseWithoutId4 as typeof release4,
            ],
          },
        ],
      };

      const result = prepareCollectionForSync(
        collectionData,
        false,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(true);
      expect(result.instanceIds).toEqual(["123", "456"]);
    });

    it("handles empty pages gracefully", () => {
      const release1 = releaseFactory.build({ instance_id: "123" });
      const collectionData = {
        pages: [
          {
            ...collectionFactory.build(),
            releases: [release1],
          },
          {
            ...collectionFactory.build(),
            releases: [],
          },
          {
            ...collectionFactory.build(),
            releases: [],
          },
        ],
      };

      const result = prepareCollectionForSync(
        collectionData,
        false,
        false,
      ) as SyncCollectionResult;

      expect(result.isValid).toBe(true);
      expect(result.instanceIds).toEqual(["123"]);
    });
  });
});
