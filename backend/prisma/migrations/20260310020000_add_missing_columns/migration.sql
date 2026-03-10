-- AlterTable User: lastLoginAt, smsCredits, isAdmin
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "smsCredits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Shop: webhookSecret, smsTemplate
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "webhookSecret" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "smsTemplate" TEXT;

-- AlterTable SMSLog: errorMessage
ALTER TABLE "SMSLog" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;

-- CreateEnum CreditType
DO $$ BEGIN
  CREATE TYPE "CreditType" AS ENUM ('PURCHASE', 'USAGE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable CreditTransaction
CREATE TABLE IF NOT EXISTS "CreditTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CreditType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CreditTransaction" DROP CONSTRAINT IF EXISTS "CreditTransaction_userId_fkey";
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
