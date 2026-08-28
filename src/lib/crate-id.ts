const CRATE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidCrateId = (crateId: string): boolean =>
  CRATE_ID_PATTERN.test(crateId);
