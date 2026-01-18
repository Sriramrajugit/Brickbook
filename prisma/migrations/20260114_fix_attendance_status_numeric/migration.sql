-- AlterTable
ALTER TABLE "attendances" ALTER COLUMN "status" SET DATA TYPE DOUBLE PRECISION USING status::double precision;
