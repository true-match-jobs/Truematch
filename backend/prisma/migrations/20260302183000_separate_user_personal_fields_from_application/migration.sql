ALTER TABLE "User"
ADD COLUMN "dateOfBirth" TEXT,
ADD COLUMN "gender" TEXT,
ADD COLUMN "countryCode" TEXT,
ADD COLUMN "phoneNumber" TEXT,
ADD COLUMN "nationality" TEXT,
ADD COLUMN "countryOfResidence" TEXT,
ADD COLUMN "stateOrProvince" TEXT,
ADD COLUMN "residentialAddress" TEXT,
ADD COLUMN "passportNumber" TEXT,
ADD COLUMN "passportExpiryDate" TEXT;

WITH latest AS (
  SELECT DISTINCT ON (a."userId")
    a."userId",
    a."dateOfBirth",
    a."gender",
    a."countryCode",
    a."phoneNumber",
    a."nationality",
    a."countryOfResidence",
    a."stateOrProvince",
    a."residentialAddress",
    a."passportNumber",
    a."passportExpiryDate"
  FROM "Application" a
  ORDER BY a."userId", a."createdAt" DESC
)
UPDATE "User" AS u
SET
  "dateOfBirth" = latest."dateOfBirth",
  "gender" = latest."gender",
  "countryCode" = latest."countryCode",
  "phoneNumber" = latest."phoneNumber",
  "nationality" = latest."nationality",
  "countryOfResidence" = latest."countryOfResidence",
  "stateOrProvince" = latest."stateOrProvince",
  "residentialAddress" = latest."residentialAddress",
  "passportNumber" = latest."passportNumber",
  "passportExpiryDate" = latest."passportExpiryDate"
FROM latest
WHERE
  latest."userId" = u."id"
  AND u."dateOfBirth" IS NULL
  AND u."gender" IS NULL
  AND u."countryCode" IS NULL
  AND u."phoneNumber" IS NULL
  AND u."nationality" IS NULL
  AND u."countryOfResidence" IS NULL
  AND u."stateOrProvince" IS NULL
  AND u."residentialAddress" IS NULL
  AND u."passportNumber" IS NULL
  AND u."passportExpiryDate" IS NULL;

ALTER TABLE "Application"
DROP COLUMN "dateOfBirth",
DROP COLUMN "gender",
DROP COLUMN "countryCode",
DROP COLUMN "phoneNumber",
DROP COLUMN "nationality",
DROP COLUMN "countryOfResidence",
DROP COLUMN "stateOrProvince",
DROP COLUMN "residentialAddress",
DROP COLUMN "passportNumber",
DROP COLUMN "passportExpiryDate";
