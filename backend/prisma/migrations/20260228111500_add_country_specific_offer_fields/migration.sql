ALTER TABLE "Application"
ADD COLUMN "ukCasStatus" TEXT,
ADD COLUMN "australiaCoeStatus" TEXT,
ADD COLUMN "usaI20Status" TEXT,
ADD COLUMN "canadaLoaStatus" TEXT;

UPDATE "Application"
SET "ukCasStatus" = 'PENDING'
WHERE LOWER(COALESCE("universityCountry", '')) IN ('united kingdom', 'uk')
  AND "ukCasStatus" IS NULL;

UPDATE "Application"
SET "australiaCoeStatus" = 'PENDING'
WHERE LOWER(COALESCE("universityCountry", '')) = 'australia'
  AND "australiaCoeStatus" IS NULL;

UPDATE "Application"
SET "usaI20Status" = 'PENDING'
WHERE LOWER(COALESCE("universityCountry", '')) IN ('united states', 'usa')
  AND "usaI20Status" IS NULL;

UPDATE "Application"
SET "canadaLoaStatus" = 'PENDING'
WHERE LOWER(COALESCE("universityCountry", '')) = 'canada'
  AND "canadaLoaStatus" IS NULL;
