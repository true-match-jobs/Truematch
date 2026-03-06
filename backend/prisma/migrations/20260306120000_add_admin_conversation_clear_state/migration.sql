-- CreateTable
CREATE TABLE "AdminConversationClearState" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clearedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminConversationClearState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminConversationClearState_adminUserId_userId_key" ON "AdminConversationClearState"("adminUserId", "userId");

-- CreateIndex
CREATE INDEX "AdminConversationClearState_adminUserId_clearedAt_idx" ON "AdminConversationClearState"("adminUserId", "clearedAt");

-- CreateIndex
CREATE INDEX "AdminConversationClearState_userId_idx" ON "AdminConversationClearState"("userId");

-- AddForeignKey
ALTER TABLE "AdminConversationClearState" ADD CONSTRAINT "AdminConversationClearState_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminConversationClearState" ADD CONSTRAINT "AdminConversationClearState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
