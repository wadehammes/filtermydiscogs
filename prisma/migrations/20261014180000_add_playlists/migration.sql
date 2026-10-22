-- CreateTable
CREATE TABLE "playlists" (
    "user_id" INTEGER NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("user_id","id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "user_id" INTEGER NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "track_key" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("user_id","playlist_id","track_key")
);

-- CreateIndex
CREATE INDEX "playlists_user_id_idx" ON "playlists"("user_id");

-- CreateIndex
CREATE INDEX "playlist_tracks_user_id_playlist_id_sort_order_idx" ON "playlist_tracks"("user_id", "playlist_id", "sort_order");

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("discogs_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_user_id_playlist_id_fkey" FOREIGN KEY ("user_id", "playlist_id") REFERENCES "playlists"("user_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_user_id_track_key_fkey" FOREIGN KEY ("user_id", "track_key") REFERENCES "user_tracks"("user_id", "track_key") ON DELETE CASCADE ON UPDATE CASCADE;
