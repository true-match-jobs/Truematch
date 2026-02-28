CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatMessage_fromUserId_toUserId_createdAt_idx"
  ON "ChatMessage"("fromUserId", "toUserId", "createdAt");

CREATE INDEX "ChatMessage_toUserId_fromUserId_createdAt_idx"
  ON "ChatMessage"("toUserId", "fromUserId", "createdAt");

ALTER TABLE "ChatMessage"
  ADD CONSTRAINT "ChatMessage_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage"
  ADD CONSTRAINT "ChatMessage_toUserId_fkey"
  FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
