-- AlterTable
ALTER TABLE "Order" ADD COLUMN "confirmToken" TEXT,
ADD COLUMN "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_confirmToken_key" ON "Order"("confirmToken");
