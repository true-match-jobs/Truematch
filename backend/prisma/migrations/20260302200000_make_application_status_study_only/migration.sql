ALTER TABLE "Application"
ALTER COLUMN "applicationStatus" DROP NOT NULL,
ALTER COLUMN "applicationStatus" DROP DEFAULT;

UPDATE "Application"
SET "applicationStatus" = NULL
WHERE "applicationType" = 'work_employment';
