-- CreateTable
CREATE TABLE "playlist_release_snapshots" (
    "user_id" INTEGER NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "release_data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlist_release_snapshots_pkey" PRIMARY KEY ("user_id","playlist_id","instance_id")
);

-- CreateIndex
CREATE INDEX "playlist_release_snapshots_user_id_playlist_id_idx" ON "playlist_release_snapshots"("user_id", "playlist_id");

-- AddForeignKey
ALTER TABLE "playlist_release_snapshots" ADD CONSTRAINT "playlist_release_snapshots_user_id_playlist_id_fkey" FOREIGN KEY ("user_id", "playlist_id") REFERENCES "playlists"("user_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;