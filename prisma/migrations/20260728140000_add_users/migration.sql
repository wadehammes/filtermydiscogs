CREATE TABLE "users" (
    "discogs_user_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("discogs_user_id")
);

INSERT INTO "users" ("discogs_user_id", "username", "created_at", "updated_at")
SELECT DISTINCT ON ("user_id")
    "user_id",
    COALESCE("username", 'unknown'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "crates"
ORDER BY "user_id", "updated_at" DESC;

ALTER TABLE "crates" ADD CONSTRAINT "crates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("discogs_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
