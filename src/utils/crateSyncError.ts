export type CrateSyncBlockedReason =
  | "collection_too_small"
  | "deletion_cap_blocked";

export class CrateSyncError extends Error {
  readonly status: number;
  readonly blockedReason?: CrateSyncBlockedReason;

  constructor(
    message: string,
    status: number,
    blockedReason?: CrateSyncBlockedReason,
  ) {
    super(message);
    this.name = "CrateSyncError";
    this.status = status;
    if (blockedReason !== undefined) {
      this.blockedReason = blockedReason;
    }
  }
}

export const inferCrateSyncBlockedReason = (
  body: unknown,
): CrateSyncBlockedReason | undefined => {
  if (!(body && typeof body === "object")) {
    return undefined;
  }

  const record = body as Record<string, unknown>;

  if (record.blockedReason === "collection_too_small") {
    return "collection_too_small";
  }

  if (record.blockedReason === "deletion_cap_blocked") {
    return "deletion_cap_blocked";
  }

  if (
    typeof record.minRequired === "number" &&
    typeof record.collectionSize === "number"
  ) {
    return "collection_too_small";
  }

  if (
    typeof record.maxAllowed === "number" &&
    typeof record.percentage === "number"
  ) {
    return "deletion_cap_blocked";
  }

  return undefined;
};
