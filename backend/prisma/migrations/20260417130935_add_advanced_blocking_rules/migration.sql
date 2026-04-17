-- CreateEnum
CREATE TYPE "BlockingRuleType" AS ENUM ('IP_ADDRESS', 'IP_RANGE', 'PHONE_PATTERN', 'EMAIL_DOMAIN', 'CUSTOMER_NAME', 'MAX_ORDERS_PER_PHONE', 'MAX_ORDERS_PER_IP');

-- CreateEnum
CREATE TYPE "BlockSource" AS ENUM ('LEGACY_PHONE', 'LEGACY_POSTAL_CODE', 'BLOCKING_RULE', 'RATE_LIMIT');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'BLOCKED';

-- DropForeignKey
ALTER TABLE "BlockedPhone" DROP CONSTRAINT "BlockedPhone_shopId_fkey";

-- DropForeignKey
ALTER TABLE "CreditTransaction" DROP CONSTRAINT "CreditTransaction_userId_fkey";

-- AlterTable
ALTER TABLE "AdminCredential" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "ipAddress" TEXT;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "advancedBlockingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxOrdersPerIp30d" INTEGER DEFAULT 5,
ADD COLUMN     "maxOrdersPerPhone30d" INTEGER DEFAULT 3;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifyToken" TEXT;

-- CreateTable
CREATE TABLE "BlockingRule" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "ruleType" "BlockingRuleType" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "lastMatched" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedOrder" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "shopifyOrderId" TEXT,
    "customerName" TEXT,
    "phoneNumber" TEXT,
    "ipAddress" TEXT,
    "postalCode" TEXT,
    "email" TEXT,
    "blockSource" "BlockSource" NOT NULL,
    "ruleId" INTEGER,
    "ruleType" TEXT NOT NULL,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockingRule_shopId_ruleType_isActive_idx" ON "BlockingRule"("shopId", "ruleType", "isActive");

-- CreateIndex
CREATE INDEX "BlockingRule_shopId_value_idx" ON "BlockingRule"("shopId", "value");

-- CreateIndex
CREATE INDEX "BlockedOrder_shopId_blockedAt_idx" ON "BlockedOrder"("shopId", "blockedAt");

-- CreateIndex
CREATE INDEX "BlockedOrder_phoneNumber_idx" ON "BlockedOrder"("phoneNumber");

-- CreateIndex
CREATE INDEX "BlockedOrder_ipAddress_idx" ON "BlockedOrder"("ipAddress");

-- CreateIndex
CREATE INDEX "Order_shopId_customerPhone_createdAt_idx" ON "Order"("shopId", "customerPhone", "createdAt");

-- CreateIndex
CREATE INDEX "Order_shopId_ipAddress_createdAt_idx" ON "Order"("shopId", "ipAddress", "createdAt");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedPhone" ADD CONSTRAINT "BlockedPhone_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockingRule" ADD CONSTRAINT "BlockingRule_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedOrder" ADD CONSTRAINT "BlockedOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
