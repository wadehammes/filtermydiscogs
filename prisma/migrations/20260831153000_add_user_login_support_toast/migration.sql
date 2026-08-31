ALTER TABLE "users" ADD COLUMN "login_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "support_toast_dismissed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "support_toast_pending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "last_seen_at" TIMESTAMP(3);
