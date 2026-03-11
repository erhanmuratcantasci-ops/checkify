CREATE TABLE IF NOT EXISTS "AdminCredential" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminCredential_email_key" ON "AdminCredential"("email");

-- Seed initial admin (Helen0416. bcrypt hash)
INSERT INTO "AdminCredential" ("email", "passwordHash", "updatedAt")
VALUES (
  'erhanmuratcantasci@gmail.com',
  '$2b$10$aLSzjM7mUB8hvPfpR1p0ieE/f9iUyQq6tmWqUqZKzxvVEbv.UMTcm',
  NOW()
)
ON CONFLICT ("email") DO NOTHING;
