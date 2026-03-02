UPDATE "Application"
SET "universityCountry" = 'United Kingdom'
WHERE LOWER(TRIM(COALESCE("universityCountry", ''))) = 'uk';

UPDATE "Application"
SET "universityCountry" = 'United States'
WHERE LOWER(TRIM(COALESCE("universityCountry", ''))) IN ('us', 'usa');

UPDATE "Application"
SET "ukCasStatus" = 'PENDING'
WHERE "universityCountry" = 'United Kingdom'
  AND "ukCasStatus" IS NULL;

UPDATE "Application"
SET "usaI20Status" = 'PENDING'
WHERE "universityCountry" = 'United States'
  AND "usaI20Status" IS NULL;
