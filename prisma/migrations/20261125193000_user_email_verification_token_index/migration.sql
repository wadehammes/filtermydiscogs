-- CreateIndex
CREATE INDEX "users_email_verification_token_hash_idx" ON "users"("email_verification_token_hash");