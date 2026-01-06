-- CreateTable
CREATE TABLE "crates" (
    "user_id" INTEGER NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crates_pkey" PRIMARY KEY ("user_id","id")
);

-- CreateTable
CREATE TABLE "crate_releases" (
    "user_id" INTEGER NOT NULL,
    "crate_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "release_data" JSONB NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crate_releases_pkey" PRIMARY KEY ("user_id","crate_id","instance_id")
);

-- CreateIndex
CREATE INDEX "crates_user_id_idx" ON "crates"("user_id");

-- CreateIndex
CREATE INDEX "crates_user_id_is_default_idx" ON "crates"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "crate_releases_user_id_crate_id_idx" ON "crate_releases"("user_id", "crate_id");

-- CreateIndex
CREATE INDEX "crate_releases_user_id_instance_id_idx" ON "crate_releases"("user_id", "instance_id");

-- AddForeignKey
ALTER TABLE "crate_releases" ADD CONSTRAINT "crate_releases_user_id_crate_id_fkey" FOREIGN KEY ("user_id", "crate_id") REFERENCES "crates"("user_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
