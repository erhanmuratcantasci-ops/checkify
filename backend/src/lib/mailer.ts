import { Resend } from 'resend';

const resend = new Resend(process.env['RESEND_API_KEY']);
const FROM = 'noreply@chekkify.com';

// ── Shared layout ──────────────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Chekkify</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Logo -->
      <tr><td style="padding-bottom:32px;text-align:center;">
        <span style="font-size:22px;font-weight:900;letter-spacing:-1px;
          background:linear-gradient(135deg,#7c3aed,#a855f7);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;">
          Chekkify
        </span>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
        border-radius:16px;padding:40px 36px;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding-top:24px;text-align:center;
        color:#374151;font-size:12px;line-height:1.6;">
        Chekkify — COD Sipariş Doğrulama Platformu<br/>
        Bu e-postayı almak istemiyorsanız hesabınızı silebilirsiniz.
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function btn(href: string, text: string, color = '#7c3aed'): string {
  return `<a href="${href}" style="display:inline-block;padding:13px 28px;
    background:linear-gradient(135deg,${color},${color === '#7c3aed' ? '#a855f7' : color});
    border-radius:10px;color:#fff;font-size:14px;font-weight:600;
    text-decoration:none;margin-top:24px;">${text}</a>`;
}

function heading(text: string): string {
  return `<h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 10px;">${text}</h1>`;
}

function para(text: string, muted = false): string {
  return `<p style="color:${muted ? '#6b7280' : '#d1d5db'};font-size:14px;line-height:1.7;margin:0 0 8px;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:24px 0;"/>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="color:#6b7280;font-size:13px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);">${label}</td>
    <td style="color:#e5e7eb;font-size:13px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);text-align:right;font-weight:500;">${value}</td>
  </tr>`;
}

// ── Email functions ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);
        display:inline-flex;align-items:center;justify-content:center;font-size:28px;">👋</div>
    </div>
    ${heading(`Hoş geldin, ${name}!`)}
    ${para('Chekkify\'e kaydolduğun için teşekkürler. Artık Shopify mağazanın kapıda ödeme siparişlerini SMS ile doğrulayabilirsin.')}
    ${divider()}
    ${para('Başlamak için:', true)}
    <ol style="color:#9ca3af;font-size:14px;line-height:2;padding-left:20px;margin:8px 0 0;">
      <li>Bir mağaza ekle</li>
      <li>Webhook\'u Shopify\'a bağla</li>
      <li>SMS kredisi yükle</li>
    </ol>
    <div style="text-align:center;">
      ${btn('https://chekkify.com/dashboard', 'Dashboard\'a Git')}
    </div>
  `);

  await resend.emails.send({ from: `Chekkify <${FROM}>`, to, subject: `Hoş geldin, ${name}! 🎉`, html });
  console.log(`[mailer] Welcome email → ${to}`);
}

export async function sendOrderConfirmationEmail(
  to: string,
  customerName: string,
  orderTotal: number,
  orderId: number,
): Promise<void> {
  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;border-radius:50%;
        background:rgba(5,150,105,0.15);border:2px solid rgba(5,150,105,0.4);
        display:inline-flex;align-items:center;justify-content:center;
        font-size:28px;color:#34d399;">✓</div>
    </div>
    ${heading('Siparişiniz Onaylandı!')}
    ${para(`Merhaba ${customerName}, siparişiniz başarıyla onaylandı. Teşekkür ederiz!`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Sipariş No', `#${orderId}`)}
      ${infoRow('Tutar', `${orderTotal.toFixed(2)} ₺`)}
      ${infoRow('Durum', 'Onaylandı ✓')}
    </table>
    ${para('Siparişiniz en kısa sürede hazırlanacak ve kargoya verilecektir.', true)}
  `);

  await resend.emails.send({ from: `Chekkify <${FROM}>`, to, subject: `Siparişiniz onaylandı ✓ — #${orderId}`, html });
  console.log(`[mailer] Confirmation email → ${to}`);
}

export async function sendOrderCancellationEmail(
  to: string,
  customerName: string,
  orderTotal: number,
  orderId: number,
): Promise<void> {
  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;border-radius:50%;
        background:rgba(239,68,68,0.1);border:2px solid rgba(239,68,68,0.3);
        display:inline-flex;align-items:center;justify-content:center;
        font-size:28px;color:#f87171;">✕</div>
    </div>
    ${heading('Siparişiniz İptal Edildi')}
    ${para(`Merhaba ${customerName}, talebiniz üzerine siparişiniz iptal edildi.`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Sipariş No', `#${orderId}`)}
      ${infoRow('Tutar', `${orderTotal.toFixed(2)} ₺`)}
      ${infoRow('Durum', 'İptal Edildi')}
    </table>
    ${para('Yeni bir sipariş oluşturmak için mağazamızı ziyaret edebilirsiniz.', true)}
  `);

  await resend.emails.send({ from: `Chekkify <${FROM}>`, to, subject: `Siparişiniz iptal edildi — #${orderId}`, html });
  console.log(`[mailer] Cancellation email → ${to}`);
}

export async function sendLowCreditEmail(
  to: string,
  name: string,
  credits: number,
): Promise<void> {
  const isZero = credits === 0;
  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;">${isZero ? '🚫' : '⚠️'}</div>
    </div>
    ${heading(isZero ? 'SMS Krediniz Tükendi!' : 'SMS Krediniz Azalıyor!')}
    ${para(isZero
      ? `Merhaba ${name}, SMS krediniz tamamen tükendi. Yeni siparişlere otomatik SMS gönderilemez.`
      : `Merhaba ${name}, yalnızca <strong style="color:#fbbf24;">${credits} SMS krediniz</strong> kaldı.`
    )}
    ${divider()}
    <div style="background:rgba(217,119,6,0.08);border:1px solid rgba(217,119,6,0.2);
      border-radius:12px;padding:16px 20px;margin-bottom:4px;">
      ${para('Sipariş doğrulama SMS\'lerinin kesintisiz gönderilmesi için kredi yükleyin.', true)}
    </div>
    <div style="text-align:center;">
      ${btn('https://chekkify.com/credits', 'Kredi Satın Al', '#d97706')}
    </div>
  `);

  await resend.emails.send({
    from: `Chekkify <${FROM}>`, to,
    subject: isZero ? '🚫 SMS krediniz tükendi!' : `⚠️ Yalnızca ${credits} SMS krediniz kaldı`,
    html,
  });
  console.log(`[mailer] Low credit email → ${to} (${credits} credits)`);
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;">🔑</div>
    </div>
    ${heading('Şifre Sıfırlama')}
    ${para(`Merhaba ${name}, şifrenizi sıfırlamak için aşağıdaki butona tıklayın.`)}
    ${divider()}
    <div style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);
      border-radius:12px;padding:16px 20px;margin-bottom:4px;">
      ${para('Bu link <strong style="color:#e5e7eb;">15 dakika</strong> geçerlidir. Eğer şifre sıfırlama talebinde bulunmadıysanız bu emaili görmezden gelin.', true)}
    </div>
    <div style="text-align:center;">
      ${btn(resetUrl, 'Şifremi Sıfırla')}
    </div>
  `);

  await resend.emails.send({ from: `Chekkify <${FROM}>`, to, subject: 'Şifre Sıfırlama Talebi', html });
  console.log(`[mailer] Password reset email → ${to}`);
}
