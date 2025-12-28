-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "createdBy" INTEGER;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
