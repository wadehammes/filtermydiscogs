-- AlterTable
ALTER TABLE "playlists" ADD COLUMN "username" TEXT,
ADD COLUMN "private" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "playlists_id_private_idx" ON "playlists"("id", "private");
