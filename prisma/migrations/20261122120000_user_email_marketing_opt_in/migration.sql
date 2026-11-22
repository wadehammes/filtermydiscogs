-- AlterTable
ALTER TABLE "users" ADD COLUMN "email" TEXT,
ADD COLUMN "marketing_emails_opt_in" BOOLEAN NOT NULL DEFAULT false;