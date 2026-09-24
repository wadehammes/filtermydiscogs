-- AlterTable
ALTER TABLE "crate_releases" ADD COLUMN     "section_id" TEXT;

-- AlterTable
ALTER TABLE "crate_set_markers" ADD COLUMN     "accent_key" TEXT,
ADD COLUMN     "parent_id" TEXT;

-- AddForeignKey
ALTER TABLE "crate_releases" ADD CONSTRAINT "crate_releases_user_id_crate_id_section_id_fkey" FOREIGN KEY ("user_id", "crate_id", "section_id") REFERENCES "crate_set_markers"("user_id", "crate_id", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crate_set_markers" ADD CONSTRAINT "crate_set_markers_user_id_crate_id_parent_id_fkey" FOREIGN KEY ("user_id", "crate_id", "parent_id") REFERENCES "crate_set_markers"("user_id", "crate_id", "id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE crate_releases cr
SET section_id = nearest.marker_id
FROM (
  SELECT
    cr2.user_id,
    cr2.crate_id,
    cr2.instance_id,
    (
      SELECT m.id
      FROM crate_set_markers m
      WHERE m.user_id = cr2.user_id
        AND m.crate_id = cr2.crate_id
        AND m.sort_order < cr2.sort_order
      ORDER BY m.sort_order DESC
      LIMIT 1
    ) AS marker_id
  FROM crate_releases cr2
) nearest
WHERE cr.user_id = nearest.user_id
  AND cr.crate_id = nearest.crate_id
  AND cr.instance_id = nearest.instance_id
  AND nearest.marker_id IS NOT NULL;
