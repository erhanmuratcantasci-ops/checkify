import prisma from './prisma';

export async function logSecurityEvent(ip: string, endpoint: string, reason: string): Promise<void> {
  try {
    await prisma.securityLog.create({ data: { ip, endpoint, reason } });
  } catch (err) {
    console.error('[security] Log yazılamadı:', err);
  }
}
