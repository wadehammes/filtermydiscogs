import type {
  DiscogsCollectionField,
  DiscogsRelease,
  ReleaseNote,
} from "src/types";

export interface ReleaseNoteDisplay {
  fieldId: number;
  label: string;
  value: string;
}

export const normalizeFieldId = (fieldId: number | string): number => {
  return typeof fieldId === "number" ? fieldId : Number.parseInt(fieldId, 10);
};

export const parseReleaseId = (release: DiscogsRelease): number | null => {
  const basicInformationId = release.basic_information.id;
  if (typeof basicInformationId === "number" && basicInformationId > 0) {
    return basicInformationId;
  }

  if (typeof release.id === "number" && release.id > 0) {
    return release.id;
  }

  const resourceUrl = release.basic_information.resource_url;
  const match = /\/releases\/(\d+)/.exec(resourceUrl);
  if (!match?.[1]) {
    return null;
  }

  const releaseId = Number.parseInt(match[1], 10);
  return Number.isNaN(releaseId) ? null : releaseId;
};

export const getReleaseFolderId = (release: DiscogsRelease): number => {
  return typeof release.folder_id === "number" ? release.folder_id : 0;
};

export const isSameReleaseInstance = (
  left: DiscogsRelease | null | undefined,
  right: DiscogsRelease | null | undefined,
): boolean => {
  if (!(left && right)) {
    return false;
  }

  return String(left.instance_id) === String(right.instance_id);
};

export const matchesInstanceId = (
  release: DiscogsRelease | null | undefined,
  instanceId: string | number,
): boolean => {
  if (!release) {
    return false;
  }

  return String(release.instance_id) === String(instanceId);
};

export const buildCollectionFieldsMap = (
  fields: DiscogsCollectionField[],
): Map<number, DiscogsCollectionField> => {
  return new Map(fields.map((field) => [field.id, field]));
};

export const getReleaseNotes = (release: DiscogsRelease): ReleaseNote[] => {
  return release.notes ?? [];
};

export const getReleaseNotesSearchText = (release: DiscogsRelease): string => {
  return getReleaseNotes(release)
    .map((note) => note.value.trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const normalizeFieldName = (name: string): string => {
  return name.trim().toLowerCase();
};

const CONDITION_NOTE_FIELD_NAMES = new Set([
  "media",
  "sleeve",
  "media condition",
  "sleeve condition",
]);

const CONDITION_FIELD_SORT_ORDER: Record<string, number> = {
  media: 0,
  "media condition": 0,
  sleeve: 1,
  "sleeve condition": 1,
};

export const isCardDisplayNoteField = (
  field: DiscogsCollectionField | undefined,
): boolean => {
  if (!field) {
    return true;
  }

  if (field.type === "dropdown" || field.type === "boolean") {
    return false;
  }

  return !CONDITION_NOTE_FIELD_NAMES.has(normalizeFieldName(field.name));
};

export const isConditionCollectionField = (
  field: DiscogsCollectionField | undefined,
): boolean => {
  if (field?.type !== "dropdown") {
    return false;
  }

  return CONDITION_NOTE_FIELD_NAMES.has(normalizeFieldName(field.name));
};

export const getEditableConditionFields = (
  fields: DiscogsCollectionField[],
): DiscogsCollectionField[] => {
  return fields.filter(isConditionCollectionField).sort((left, right) => {
    const leftOrder =
      CONDITION_FIELD_SORT_ORDER[normalizeFieldName(left.name)] ?? 99;
    const rightOrder =
      CONDITION_FIELD_SORT_ORDER[normalizeFieldName(right.name)] ?? 99;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return (left.position ?? 0) - (right.position ?? 0);
  });
};

export const releaseHasStoredConditionNotes = (
  release: DiscogsRelease,
  fields: DiscogsCollectionField[],
): boolean => {
  const notes = getReleaseNotes(release);

  return getEditableConditionFields(fields).some((field) => {
    const note = notes.find(
      (storedNote) => normalizeFieldId(storedNote.field_id) === field.id,
    );

    return (note?.value ?? "").trim().length > 0;
  });
};

export const getReleaseNotesDisplay = ({
  release,
  fieldsById,
  forCard = false,
}: {
  release: DiscogsRelease;
  fieldsById: Map<number, DiscogsCollectionField>;
  forCard?: boolean;
}): ReleaseNoteDisplay[] => {
  return getReleaseNotes(release)
    .filter((note) => note.value.trim().length > 0)
    .map((note) => {
      const fieldId = normalizeFieldId(note.field_id);
      const field = fieldsById.get(fieldId);

      return {
        fieldId,
        label: field?.name || `Field ${fieldId}`,
        value: note.value.trim(),
        field,
      };
    })
    .filter((note) => !forCard || isCardDisplayNoteField(note.field))
    .map(({ fieldId, label, value }) => ({ fieldId, label, value }));
};

export const isEditableCollectionField = (
  field: DiscogsCollectionField | undefined,
): boolean => {
  if (!field) {
    return false;
  }

  return field.type === "text" || field.type === "textarea";
};

export const upsertReleaseNote = ({
  notes,
  fieldId,
  value,
}: {
  notes?: ReleaseNote[];
  fieldId: number;
  value: string;
}): ReleaseNote[] => {
  const releaseNotes = notes ?? [];
  const trimmedValue = value.trim();
  const existingIndex = releaseNotes.findIndex(
    (note) => normalizeFieldId(note.field_id) === fieldId,
  );

  if (!trimmedValue) {
    if (existingIndex === -1) {
      return releaseNotes;
    }

    return releaseNotes.filter((_, index) => index !== existingIndex);
  }

  if (existingIndex === -1) {
    return [...releaseNotes, { field_id: fieldId, value: trimmedValue }];
  }

  return releaseNotes.map((note, index) =>
    index === existingIndex ? { ...note, value: trimmedValue } : note,
  );
};
