import { PrismaClient } from '../../generated/prisma';

// Prisma datasource URL'i runtime'da inşa et:
// - DATABASE_URL >=30 char ise olduğu gibi kullan (local dev veya temiz prod env).
// - Aksi halde Postgres servisinin standart PG* field'larından URL-encoded olarak kur.
//   Railway raw password'u DATABASE_URL'e enjekte ettiğinde URL-unsafe karakterler
//   (+, /, =) Prisma URL parser'ını bozuyor; PG* field'larını URL-encode'lemek bunu çözer.
function buildDatabaseUrl(): string | undefined {
  const direct = process.env['DATABASE_URL'];
  if (direct && direct.length >= 30) return direct;

  const user = process.env['PGUSER'];
  const pw = process.env['PGPASSWORD'];
  if (!user || !pw) return undefined;

  const host = process.env['PGHOST'] || 'postgres.railway.internal';
  const port = process.env['PGPORT'] || '5432';
  const db = process.env['PGDATABASE'] || 'railway';
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pw)}@${host}:${port}/${db}`;
}

const url = buildDatabaseUrl();
const prisma = url ? new PrismaClient({ datasourceUrl: url }) : new PrismaClient();

export default prisma;
