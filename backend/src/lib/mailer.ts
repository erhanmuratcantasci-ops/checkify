import { Resend } from 'resend';

/**
 * Email locale. Sprint 3 Stage 1 — opt-in parameter on every send*()
 * function, default 'tr'. Body templates are still hardcoded Turkish;
 * the parameter exists so call sites (auth/confirm routes) can start
 * threading a locale through without breaking the surface area.
 * Stage 2 (Sprint 3.5) will fan out per-key TR + EN strings.
 */
export type EmailLocale = 'tr' | 'en';

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const key = process.env['RESEND_API_KEY'];
    if (!key) throw new Error('RESEND_API_KEY ortam değişkeni tanımlı değil');
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

const FROM = 'noreply@chekkify.com';

// ── Apple-pro palette (mirror of dashboard --color-* tokens) ───────────────────
//
// Email clients can't read CSS variables, so the values below must stay
// literal hex. Update both this file and dashboard/src/app/globals.css if
// the brand palette ever shifts.
const C = {
  bg: '#000000',
  card: '#0a0a0a',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f5f5f7',
  muted: '#a1a1aa',
  faint: '#71717a',
  accent: '#FB7185',
  accentHover: '#FDA4AF',
  accentFaded: 'rgba(251,113,133,0.12)',
  accentFg: '#0a0a0a',
  success: '#34D399',
  successBg: 'rgba(52,211,153,0.12)',
  successBorder: 'rgba(52,211,153,0.30)',
  danger: '#F87171',
  dangerBg: 'rgba(248,113,113,0.12)',
  dangerBorder: 'rgba(248,113,113,0.30)',
  warning: '#FBBF24',
  warningBg: 'rgba(251,191,36,0.10)',
  warningBorder: 'rgba(251,191,36,0.25)',
} as const;

// iOS Mail picks up SF Pro from -apple-system; Outlook falls through to
// Segoe UI. Geist isn't reliable in email clients, so we don't try.
const FONT_STACK = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

// ── Shared layout ──────────────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Chekkify</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT_STACK};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Logo -->
      <tr><td style="padding-bottom:32px;text-align:center;">
        <span style="font-size:24px;font-weight:700;letter-spacing:-0.04em;color:${C.text};">
          Chekkify
        </span>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:${C.card};border:1px solid ${C.cardBorder};
        border-radius:14px;padding:40px 36px;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding-top:24px;text-align:center;
        color:${C.faint};font-size:12px;line-height:1.6;">
        Chekkify — COD doğrulama platformu<br/>
        Bu e-postayı almak istemiyorsan hesabını silebilirsin.
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function btn(href: string, text: string, kind: 'primary' | 'warning' = 'primary'): string {
  const bg = kind === 'warning' ? C.warning : C.accent;
  const fg = kind === 'warning' ? '#1a1100' : C.accentFg;
  return `<a href="${href}" style="display:inline-block;padding:13px 28px;
    background:${bg};border-radius:10px;color:${fg};font-size:14px;font-weight:500;
    text-decoration:none;margin-top:24px;letter-spacing:-0.01em;">${text}</a>`;
}

function heading(text: string): string {
  return `<h1 style="color:${C.text};font-size:24px;font-weight:500;letter-spacing:-0.04em;margin:0 0 10px;">${text}</h1>`;
}

function para(text: string, muted = false): string {
  return `<p style="color:${muted ? C.muted : C.text};font-size:15px;line-height:1.6;margin:0 0 8px;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${C.cardBorder};margin:24px 0;"/>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="color:${C.muted};font-size:13px;padding:8px 0;border-top:1px solid ${C.cardBorder};">${label}</td>
    <td style="color:${C.text};font-size:13px;padding:8px 0;border-top:1px solid ${C.cardBorder};text-align:right;font-weight:500;">${value}</td>
  </tr>`;
}

function statusCircle(kind: 'success' | 'danger' | 'accent', char: string): string {
  const bg = kind === 'success' ? C.successBg : kind === 'danger' ? C.dangerBg : C.accentFaded;
  const border = kind === 'success' ? C.successBorder : kind === 'danger' ? C.dangerBorder : C.accent;
  const color = kind === 'success' ? C.success : kind === 'danger' ? C.danger : C.accent;
  return `<div style="text-align:center;margin-bottom:28px;">
    <div style="width:64px;height:64px;border-radius:50%;background:${bg};border:1px solid ${border};
      display:inline-flex;align-items:center;justify-content:center;font-size:30px;color:${color};">${char}</div>
  </div>`;
}

// ── Email functions ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  name: string,
  _locale: EmailLocale = 'tr',
): Promise<void> {
  const html = layout(`
    ${heading(`Hoş geldin, ${name}.`)}
    ${para('Chekkify\'a kaydolduğun için teşekkürler. Artık Shopify mağazanın kapıda ödeme siparişlerini SMS ile doğrulayabilirsin.')}
    ${divider()}
    ${para('Başlamak için:', true)}
    <ol style="color:${C.muted};font-size:14px;line-height:1.9;padding-left:20px;margin:8px 0 0;">
      <li>Bir mağaza ekle</li>
      <li>Webhook'u Shopify'a bağla</li>
      <li>SMS kredisi yükle</li>
    </ol>
    <div style="text-align:center;">
      ${btn('https://chekkify.com/dashboard', 'Dashboard\'a git')}
    </div>
  `);

  await getResend().emails.send({ from: `Chekkify <${FROM}>`, to, subject: `Hoş geldin, ${name}.`, html });
  console.log(`[mailer] Welcome email → ${to}`);
}

export async function sendOrderConfirmationEmail(
  to: string,
  customerName: string,
  orderTotal: number,
  orderId: number,
  _locale: EmailLocale = 'tr',
): Promise<void> {
  const html = layout(`
    ${statusCircle('success', '✓')}
    ${heading('Siparişiniz onaylandı')}
    ${para(`Merhaba ${customerName}, siparişiniz başarıyla onaylandı. Teşekkür ederiz.`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Sipariş no', `#${orderId}`)}
      ${infoRow('Tutar', `${orderTotal.toFixed(2)} ₺`)}
      ${infoRow('Durum', 'Onaylandı')}
    </table>
    ${para('Siparişiniz en kısa sürede hazırlanacak ve kargoya verilecektir.', true)}
  `);

  await getResend().emails.send({ from: `Chekkify <${FROM}>`, to, subject: `Siparişiniz onaylandı — #${orderId}`, html });
  console.log(`[mailer] Confirmation email → ${to}`);
}

export async function sendOrderCancellationEmail(
  to: string,
  customerName: string,
  orderTotal: number,
  orderId: number,
  _locale: EmailLocale = 'tr',
): Promise<void> {
  const html = layout(`
    ${statusCircle('danger', '✕')}
    ${heading('Siparişiniz iptal edildi')}
    ${para(`Merhaba ${customerName}, talebiniz üzerine siparişiniz iptal edildi.`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Sipariş no', `#${orderId}`)}
      ${infoRow('Tutar', `${orderTotal.toFixed(2)} ₺`)}
      ${infoRow('Durum', 'İptal edildi')}
    </table>
    ${para('Yeni bir sipariş oluşturmak için mağazayı ziyaret edebilirsin.', true)}
  `);

  await getResend().emails.send({ from: `Chekkify <${FROM}>`, to, subject: `Siparişiniz iptal edildi — #${orderId}`, html });
  console.log(`[mailer] Cancellation email → ${to}`);
}

export async function sendLowCreditEmail(
  to: string,
  name: string,
  credits: number,
  _locale: EmailLocale = 'tr',
): Promise<void> {
  const isZero = credits === 0;
  const html = layout(`
    ${statusCircle('danger', isZero ? '!' : '⚠')}
    ${heading(isZero ? 'SMS kredin tükendi' : 'SMS kredin azalıyor')}
    ${para(isZero
      ? `Merhaba ${name}, SMS kredin tamamen tükendi. Yeni siparişlere otomatik SMS gönderilemez.`
      : `Merhaba ${name}, yalnızca <strong style="color:${C.warning};">${credits} SMS kredin</strong> kaldı.`
    )}
    ${divider()}
    <div style="background:${C.warningBg};border:1px solid ${C.warningBorder};
      border-radius:10px;padding:16px 20px;margin-bottom:4px;">
      ${para('Sipariş doğrulama SMS\'lerinin kesintisiz gönderilmesi için kredi yükle.', true)}
    </div>
    <div style="text-align:center;">
      ${btn('https://chekkify.com/credits', 'Kredi satın al', 'warning')}
    </div>
  `);

  await getResend().emails.send({
    from: `Chekkify <${FROM}>`, to,
    subject: isZero ? 'SMS kredin tükendi' : `Yalnızca ${credits} SMS kredin kaldı`,
    html,
  });
  console.log(`[mailer] Low credit email → ${to} (${credits} credits)`);
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
  _locale: EmailLocale = 'tr',
): Promise<void> {
  const html = layout(`
    ${statusCircle('accent', '🔑')}
    ${heading('Şifre sıfırlama')}
    ${para(`Merhaba ${name}, şifreni sıfırlamak için aşağıdaki butona tıkla.`)}
    ${divider()}
    <div style="background:${C.accentFaded};border:1px solid ${C.accent};
      border-radius:10px;padding:16px 20px;margin-bottom:4px;">
      ${para(`Bu link <strong style="color:${C.text};">15 dakika</strong> geçerli. Eğer şifre sıfırlama talebinde bulunmadıysan bu emaili görmezden gel.`, true)}
    </div>
    <div style="text-align:center;">
      ${btn(resetUrl, 'Şifremi sıfırla')}
    </div>
  `);

  await getResend().emails.send({ from: `Chekkify <${FROM}>`, to, subject: 'Şifre sıfırlama talebi', html });
  console.log(`[mailer] Password reset email → ${to}`);
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string,
  _locale: EmailLocale = 'tr',
): Promise<void> {
  const html = layout(`
    ${statusCircle('accent', '✓')}
    ${heading('Email\'ini doğrula')}
    ${para(`Merhaba ${name}, Chekkify hesabını aktifleştirmek için email adresini doğrulaman gerekiyor.`)}
    ${divider()}
    <div style="text-align:center;">
      ${btn(verifyUrl, 'Email\'imi doğrula')}
    </div>
    ${para('Bu link 24 saat geçerli. Eğer bu işlemi sen yapmadıysan bu emaili görmezden gelebilirsin.', true)}
  `);

  await getResend().emails.send({
    from: `Chekkify <${FROM}>`,
    to,
    subject: 'Email adresini doğrula — Chekkify',
    html,
  });
  console.log(`[mailer] Verification email → ${to}`);
}
