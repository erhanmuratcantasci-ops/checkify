import twilio from 'twilio';

const accountSid = process.env['TWILIO_ACCOUNT_SID'];
const authToken = process.env['TWILIO_AUTH_TOKEN'];
const from = process.env['TWILIO_WHATSAPP_FROM'] || 'whatsapp:+14155238886'; // Twilio sandbox

export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  if (!accountSid || !authToken) {
    console.log(`[WhatsApp] → ${phone}: ${message}`);
    return;
  }

  const client = twilio(accountSid, authToken);

  // Türkiye numarası normalize: 05xx → +905xx
  let toPhone = phone;
  if (phone.startsWith('05')) {
    toPhone = '+9' + phone.slice(1);
  } else if (phone.startsWith('5') && phone.length === 10) {
    toPhone = '+90' + phone;
  } else if (!phone.startsWith('+')) {
    toPhone = '+' + phone;
  }

  await client.messages.create({
    from: `whatsapp:${from.replace('whatsapp:', '')}`,
    to: `whatsapp:${toPhone}`,
    body: message,
  });

  console.log(`[WhatsApp] ✓ Gönderildi → ${toPhone}`);
}
