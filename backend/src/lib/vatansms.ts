import axios from 'axios';

const API_ID = process.env.VATANSMS_API_ID!;
const API_KEY = process.env.VATANSMS_API_KEY!;
const SENDER = process.env.VATANSMS_SENDER ?? 'Chekkify';

function normalizePhone(phone: string): string {
  let p = phone.replace(/s+/g, '').replace(/^+90/, '').replace(/^0/, '');
  if (p.length === 10 && p.startsWith('5')) return p;
  return p;
}

export async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (!API_ID || !API_KEY) {
    console.log('[VatanSMS] API bilgileri eksik, SMS gönderilmedi:', phone, message);
    return false;
  }

  try {
    const res = await axios.post('https://api.vatansms.net/api/v1/1toN', {
      api_id: API_ID,
      api_key: API_KEY,
      sender: SENDER,
      message_type: 'turkce',
      message,
      message_content_type: 'bilgi',
      phones: [normalizePhone(phone)],
    });

    console.log('[VatanSMS] SMS gönderildi:', phone, res.data);
    return true;
  } catch (err: any) {
    console.error('[VatanSMS] SMS gönderilemedi:', err?.response?.data ?? err.message);
    return false;
  }
}

export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  // VatanSMS WhatsApp API - SMS ile aynı altyapı, farklı endpoint
  if (!API_ID || !API_KEY) {
    console.log('[VatanSMS] API bilgileri eksik, WP gönderilmedi:', phone, message);
    return false;
  }

  try {
    const res = await axios.post('https://api.vatansms.net/api/v1/whatsapp/send', {
      api_id: API_ID,
      api_key: API_KEY,
      phone: normalizePhone(phone),
      message,
    });

    console.log('[VatanSMS] WhatsApp gönderildi:', phone, res.data);
    return true;
  } catch (err: any) {
    console.error('[VatanSMS] WhatsApp gönderilemedi:', err?.response?.data ?? err.message);
    // WhatsApp başarısız olursa SMS ile fallback
    console.log('[VatanSMS] SMS fallback deneniyor...');
    return sendSMS(phone, message);
  }
}
