-- AlterTable
ALTER TABLE "crate_releases" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill sort_order from existing added_at desc order (matches prior API default)
WITH ranked AS (
  SELECT
    user_id,
    crate_id,
    instance_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, crate_id
      ORDER BY added_at DESC
    ) * 1000 AS new_sort_order
  FROM "crate_releases"
)
UPDATE "crate_releases" AS cr
SET sort_order = ranked.new_sort_order
FROM ranked
WHERE cr.user_id = ranked.user_id
  AND cr.crate_id = ranked.crate_id
  AND cr.instance_id = ranked.instance_id;

-- CreateTable
CREATE TABLE "crate_set_markers" (
    "user_id" INTEGER NOT NULL,
    "crate_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crate_set_markers_pkey" PRIMARY KEY ("user_id","crate_id","id")
);

-- CreateIndex
CREATE INDEX "crate_set_markers_user_id_crate_id_sort_order_idx" ON "crate_set_markers"("user_id", "crate_id", "sort_order");

-- CreateIndex
CREATE INDEX "crate_releases_user_id_crate_id_sort_order_idx" ON "crate_releases"("user_id", "crate_id", "sort_order");

-- AddForeignKey
ALTER TABLE "crate_set_markers" ADD CONSTRAINT "crate_set_markers_user_id_crate_id_fkey" FOREIGN KEY ("user_id", "crate_id") REFERENCES "crates"("user_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
