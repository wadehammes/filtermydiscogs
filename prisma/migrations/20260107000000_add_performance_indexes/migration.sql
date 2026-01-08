-- Add performance indexes for common query patterns

-- Index for sorting by added_at (used in crate release queries)
CREATE INDEX IF NOT EXISTS "crate_releases_added_at_idx" ON "crate_releases"("added_at");

-- Composite index for common query pattern: user_id + crate_id + added_at (for sorted release lists)
CREATE INDEX IF NOT EXISTS "crate_releases_user_id_crate_id_added_at_idx" ON "crate_releases"("user_id", "crate_id", "added_at");
