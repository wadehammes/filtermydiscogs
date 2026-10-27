-- AlterTable
ALTER TABLE "playlist_tracks" ADD COLUMN "up_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "playlist_tracks" ADD COLUMN "down_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "playlist_track_votes" (
    "user_id" INTEGER NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "track_key" TEXT NOT NULL,
    "voter_key" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlist_track_votes_pkey" PRIMARY KEY ("user_id","playlist_id","track_key","voter_key")
);

-- AddForeignKey
ALTER TABLE "playlist_track_votes" ADD CONSTRAINT "playlist_track_votes_user_id_playlist_id_track_key_fkey" FOREIGN KEY ("user_id", "playlist_id", "track_key") REFERENCES "playlist_tracks"("user_id", "playlist_id", "track_key") ON DELETE CASCADE ON UPDATE CASCADE;
