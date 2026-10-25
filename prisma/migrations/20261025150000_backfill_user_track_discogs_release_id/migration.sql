-- Backfill discogs_release_id from owner crate release snapshots (collection-only
-- rows are not on the server; re-add from the release modal to populate those).
UPDATE "user_tracks" AS ut
SET "discogs_release_id" = sub.discogs_id
FROM (
  SELECT DISTINCT ON (cr."user_id", cr."instance_id")
    cr."user_id",
    cr."instance_id",
    (cr."release_data"->'basic_information'->>'id')::integer AS discogs_id
  FROM "crate_releases" AS cr
  WHERE (cr."release_data"->'basic_information'->>'id') ~ '^[0-9]+$'
  ORDER BY cr."user_id", cr."instance_id", cr."added_at" DESC
) AS sub
WHERE ut."user_id" = sub."user_id"
  AND ut."instance_id" = sub."instance_id"
  AND ut."discogs_release_id" IS NULL
  AND sub.discogs_id > 0;
