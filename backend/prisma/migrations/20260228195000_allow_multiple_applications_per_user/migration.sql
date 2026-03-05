DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Application_userId_key'
  ) THEN
    ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_key";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Application_userId_createdAt_idx"
ON "Application"("userId", "createdAt");
