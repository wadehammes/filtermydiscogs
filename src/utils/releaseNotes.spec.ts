import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  buildCollectionFieldsMap,
  getReleaseNotes,
  getReleaseNotesDisplay,
  getReleaseNotesSearchText,
  parseReleaseId,
  upsertReleaseNote,
} from "src/utils/releaseNotes";

describe("releaseNotes", () => {
  it("parses release id from resource url when top-level id is missing", () => {
    const release = releaseFactory.withResourceUrl(12345);

    expect(parseReleaseId(release)).toBe(12345);
  });

  it("prefers basic_information.id over top-level id", () => {
    const release = releaseFactory.build({
      id: 99999,
      basic_information: {
        ...releaseFactory.build().basic_information,
        id: 12345,
        resource_url: "https://api.discogs.com/releases/12345",
      },
    });

    expect(parseReleaseId(release)).toBe(12345);
  });

  it("returns an empty array when notes are missing", () => {
    const release = releaseFactory.build({
      notes: undefined,
    });

    expect(getReleaseNotes(release)).toEqual([]);
    expect(getReleaseNotesDisplay({ release, fieldsById: new Map() })).toEqual(
      [],
    );
    expect(getReleaseNotesSearchText(release)).toBe("");
  });

  it("maps note field ids to collection field labels", () => {
    const release = releaseFactory.build({
      notes: [{ field_id: 3, value: "Near Mint sleeve" }],
    });
    const fieldsById = buildCollectionFieldsMap([
      { id: 3, name: "Media", type: "dropdown" },
    ]);

    expect(getReleaseNotesDisplay({ release, fieldsById })).toEqual([
      {
        fieldId: 3,
        label: "Media",
        value: "Near Mint sleeve",
      },
    ]);
  });

  it("omits media and sleeve condition fields from card display", () => {
    const release = releaseFactory.build({
      notes: [
        { field_id: 1, value: "Mint (M)" },
        { field_id: 2, value: "Mint (M)" },
        { field_id: 3, value: "Signed copy" },
      ],
    });
    const fieldsById = buildCollectionFieldsMap([
      { id: 1, name: "Media Condition", type: "dropdown" },
      { id: 2, name: "Sleeve Condition", type: "dropdown" },
      { id: 3, name: "Notes", type: "textarea" },
    ]);

    expect(
      getReleaseNotesDisplay({ release, fieldsById, forCard: true }),
    ).toEqual([
      {
        fieldId: 3,
        label: "Notes",
        value: "Signed copy",
      },
    ]);
  });

  it("includes note text in search helper output", () => {
    const release = releaseFactory.build({
      notes: [{ field_id: 1, value: "Signed copy" }],
    });

    expect(getReleaseNotesSearchText(release)).toBe("signed copy");
  });

  it("upserts and removes note values by field id", () => {
    const updated = upsertReleaseNote({
      notes: [{ field_id: 1, value: "Old" }],
      fieldId: 1,
      value: "New",
    });

    expect(updated).toEqual([{ field_id: 1, value: "New" }]);

    const cleared = upsertReleaseNote({
      notes: [{ field_id: 1, value: "New" }],
      fieldId: 1,
      value: "   ",
    });

    expect(cleared).toEqual([]);
  });
});
