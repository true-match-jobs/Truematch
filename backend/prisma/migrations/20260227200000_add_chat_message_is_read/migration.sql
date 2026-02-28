ALTER TABLE "ChatMessage"
ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "ChatMessage_toUserId_isRead_idx" ON "ChatMessage"("toUserId", "isRead");
