-- Fix attendances table schema
-- Drop existing table
DROP TABLE IF EXISTS attendances CASCADE;

-- Recreate with correct schema
CREATE TABLE "attendances" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "employeeId" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" DOUBLE PRECISION NOT NULL,
  UNIQUE("employeeId", "date"),
  CONSTRAINT "attendances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX "attendances_companyId_idx" ON "attendances"("companyId");
CREATE INDEX "attendances_employeeId_idx" ON "attendances"("employeeId");
