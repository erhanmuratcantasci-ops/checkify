ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "statusToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_statusToken_key" ON "Order"("statusToken");

CREATE TABLE IF NOT EXISTS "BlockedPostalCode" (
  "id" SERIAL PRIMARY KEY,
  "postalCode" TEXT NOT NULL,
  "shopId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'BlockedPostalCode_shopId_fkey'
    AND table_name = 'BlockedPostalCode'
  ) THEN
    ALTER TABLE "BlockedPostalCode" ADD CONSTRAINT "BlockedPostalCode_shopId_fkey"
      FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'BlockedPostalCode_postalCode_shopId_key'
    AND table_name = 'BlockedPostalCode'
  ) THEN
    ALTER TABLE "BlockedPostalCode" ADD CONSTRAINT "BlockedPostalCode_postalCode_shopId_key"
      UNIQUE ("postalCode", "shopId");
  END IF;
END $$;
