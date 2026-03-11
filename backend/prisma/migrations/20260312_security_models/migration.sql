CREATE TABLE IF NOT EXISTS "RefreshToken" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'RefreshToken_token_key'
  ) THEN
    CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'RefreshToken_userId_fkey' AND table_name = 'RefreshToken'
  ) THEN
    ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SecurityLog" (
  "id" SERIAL PRIMARY KEY,
  "ip" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
