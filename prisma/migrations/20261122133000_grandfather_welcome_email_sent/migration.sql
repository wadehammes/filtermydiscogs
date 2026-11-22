UPDATE "users"
SET "welcome_email_sent" = true
WHERE "login_count" > 1
   OR "created_at" < TIMESTAMPTZ '2026-11-22 17:00:00+00';