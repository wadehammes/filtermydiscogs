-- AlterTable
ALTER TABLE "playlists" ADD COLUMN     "public_view_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "public_play_count" INTEGER NOT NULL DEFAULT 0;
