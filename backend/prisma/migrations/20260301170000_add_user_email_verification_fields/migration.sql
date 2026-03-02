ALTER TABLE "User"
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationTokenHash" TEXT,
ADD COLUMN "emailVerificationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationLastSentAt" TIMESTAMP(3);
