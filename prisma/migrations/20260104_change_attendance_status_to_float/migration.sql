/*
  Warnings:

  - Changed the type of `status` on the `attendances` table. No cast could be determined, the database may contain data that cannot be cast by the new integer type.

*/
-- AlterTable
ALTER TABLE "attendances" ALTER COLUMN "status" SET DATA TYPE DOUBLE PRECISION USING status::double precision;
