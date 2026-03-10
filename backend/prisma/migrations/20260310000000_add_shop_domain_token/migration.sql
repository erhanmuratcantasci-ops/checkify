-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "shopDomain" TEXT,
ADD COLUMN "accessToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");
