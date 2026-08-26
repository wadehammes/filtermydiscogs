export type CrateRow = {
  user_id: number;
  id: string;
  name: string;
  username: string | null;
  is_default: boolean;
  private: boolean;
  packed_enabled: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

type OrmDate = unknown;

export const mapCrateRow = (row: {
  userId: number;
  id: string;
  name: string;
  username: string | null;
  isDefault: boolean;
  private: boolean;
  packedEnabled: boolean;
  notes: string | null;
  createdAt: OrmDate;
  updatedAt: OrmDate;
}): CrateRow => ({
  user_id: row.userId,
  id: row.id,
  name: row.name,
  username: row.username,
  is_default: row.isDefault,
  private: row.private,
  packed_enabled: row.packedEnabled,
  notes: row.notes,
  created_at: row.createdAt as Date,
  updated_at: row.updatedAt as Date,
});

export const mapCrateReleaseLayoutRow = (row: {
  releaseData: unknown;
  foundAt: unknown;
  sortOrder: number;
}) => ({
  release_data: row.releaseData,
  found_at: row.foundAt ? new Date(row.foundAt as string | Date) : null,
  sort_order: row.sortOrder,
});

export const mapCrateSetMarkerLayoutRow = (row: {
  id: string;
  label: string;
  sortOrder: number;
}) => ({
  id: row.id,
  label: row.label,
  sort_order: row.sortOrder,
});
