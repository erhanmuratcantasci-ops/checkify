import cron from 'node-cron';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import prisma from '../lib/prisma';

const resend = new Resend(process.env['RESEND_API_KEY']);

function generatePassword(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*-_=+';
  const all = upper + lower + digits + special;

  // Ensure at least one of each category
  const guaranteed = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  const remaining = Array.from({ length: length - 4 }, () =>
    all[Math.floor(Math.random() * all.length)]
  );

  const chars = [...guaranteed, ...remaining];
  // Shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

async function rotateAdminPassword(): Promise<void> {
  const adminEmail = process.env['ADMIN_EMAIL'];
  if (!adminEmail) {
    console.error('[AdminRotation] ADMIN_EMAIL env missing, skipping rotation');
    return;
  }

  const cred = await prisma.adminCredential.findUnique({ where: { email: adminEmail } });
  if (!cred) {
    console.error('[AdminRotation] AdminCredential not found, skipping');
    return;
  }

  const newPassword = generatePassword(16);
  const hash = await bcrypt.hash(newPassword, 12);

  await prisma.adminCredential.update({
    where: { email: adminEmail },
    data: { passwordHash: hash },
  });

  console.log(`[AdminRotation] Password rotated for ${adminEmail}`);

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"/><style>
body { font-family: 'Outfit', sans-serif; background: #0a0a0f; color: #e5e7eb; margin: 0; padding: 0; }
.wrap { max-width: 520px; margin: 40px auto; background: #0f0f18; border: 1px solid #1a1a2e; border-radius: 16px; overflow: hidden; }
.header { background: linear-gradient(135deg, #991b1b, #b91c1c); padding: 28px 32px; }
.header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 800; }
.body { padding: 28px 32px; }
.pw-box { background: #1a1a2e; border: 1px solid rgba(139,92,246,0.3); border-radius: 10px; padding: 16px 20px; font-family: monospace; font-size: 20px; font-weight: 700; color: #c4b5fd; letter-spacing: 2px; text-align: center; margin: 20px 0; }
.note { color: #6b7280; font-size: 13px; line-height: 1.6; }
.btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; margin-top: 20px; }
.footer { padding: 16px 32px; border-top: 1px solid #1a1a2e; color: #4b5563; font-size: 12px; }
</style></head>
<body>
<div class="wrap">
  <div class="header"><h1>🔐 Haftalık Admin Şifre Değişimi</h1></div>
  <div class="body">
    <p style="color:#9ca3af;font-size:15px;margin:0 0 8px">Chekkify admin panelinizin şifresi haftalık rotasyon kapsamında değiştirildi.</p>
    <p style="color:#9ca3af;font-size:14px">Yeni şifreniz:</p>
    <div class="pw-box">${newPassword}</div>
    <p class="note">Bu şifre otomatik oluşturulmuş ve yalnızca size gönderilmiştir. Güvenli bir yerde saklayın.</p>
    <a class="btn" href="https://chekkify.com/admin/login">Admin Paneline Giriş Yap →</a>
  </div>
  <div class="footer">© 2026 Chekkify · Bu email otomatik gönderilmiştir · chekkify.com</div>
</div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: 'Chekkify Admin <noreply@chekkify.com>',
      to: adminEmail,
      subject: 'Chekkify Admin - Haftalık Şifre Değişimi',
      html,
    });
    console.log(`[AdminRotation] Email sent to ${adminEmail}`);
  } catch (err) {
    console.error('[AdminRotation] Email send failed:', err);
  }
}

// Her Pazartesi 09:00'da çalış (UTC+3 = 06:00 UTC)
export function startAdminPasswordRotation(): void {
  cron.schedule('0 6 * * 1', () => {
    console.log('[AdminRotation] Starting weekly password rotation...');
    rotateAdminPassword().catch(err => console.error('[AdminRotation] Error:', err));
  }, { timezone: 'Europe/Istanbul' });

  console.log('[AdminRotation] Weekly password rotation job scheduled (Monday 09:00 Istanbul)');
}
