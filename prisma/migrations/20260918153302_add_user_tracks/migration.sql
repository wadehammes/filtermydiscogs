-- CreateTable
CREATE TABLE "user_tracks" (
    "user_id" INTEGER NOT NULL,
    "track_key" TEXT NOT NULL,
    "youtube_id" TEXT,
    "track_title" TEXT NOT NULL,
    "track_position" TEXT NOT NULL,
    "release_title" TEXT,
    "artist" TEXT,
    "instance_id" TEXT NOT NULL,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "listen_count" INTEGER NOT NULL DEFAULT 0,
    "last_played_at" TIMESTAMP(3),
    "last_listened_at" TIMESTAMP(3),
    "first_played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tracks_pkey" PRIMARY KEY ("user_id","track_key")
);

-- CreateIndex
CREATE INDEX "user_tracks_user_id_last_played_at_idx" ON "user_tracks"("user_id", "last_played_at");

-- CreateIndex
CREATE INDEX "user_tracks_user_id_last_listened_at_idx" ON "user_tracks"("user_id", "last_listened_at");

-- AddForeignKey
ALTER TABLE "user_tracks" ADD CONSTRAINT "user_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("discogs_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
