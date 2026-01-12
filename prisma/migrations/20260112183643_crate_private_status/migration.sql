-- AlterTable
ALTER TABLE "crates" ADD COLUMN     "private" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "crates_id_private_idx" ON "crates"("id", "private");
