import axios from 'axios';

const API_ID = process.env.VATANSMS_API_ID!;
const API_KEY = process.env.VATANSMS_API_KEY!;
const SENDER = process.env.VATANSMS_SENDER ?? 'VATANSMS';
const WP_EMAIL = process.env.TOPLUSMS_EMAIL!;
const WP_PASSWORD = process.env.TOPLUSMS_PASSWORD!;

function normalizePhone(phone: string): string {
  let p = phone.replace(/\s+/g, '').replace(/^\+90/, '').replace(/^0/, '');
  if (p.length === 10 && p.startsWith('5')) return p;
  return p;
}

function normalizePhoneWP(phone: string): string {
  let p = phone.replace(/\s+/g, '').replace(/^\+/, '').replace(/^90/, '').replace(/^0/, '');
  if (p.length === 10 && p.startsWith('5')) return '90' + p;
  return '90' + p;
}

let wpToken: string | null = null;
let wpTokenExpiry: number = 0;

async function getWPToken(): Promise<string> {
  if (wpToken && Date.now() < wpTokenExpiry) return wpToken;

  const res = await axios.post('https://api.toplusms.app/login', {
    email: WP_EMAIL,
    password: WP_PASSWORD,
  });

  wpToken = res.data.token;
  wpTokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 saat
  return wpToken!;
}

export async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (!API_ID || !API_KEY) {
    console.log('[VatanSMS] API bilgileri eksik, SMS gönderilmedi:', phone);
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
  if (!WP_EMAIL || !WP_PASSWORD) {
    console.log('[TopluSMS] WP bilgileri eksik, SMS fallback:', phone);
    return sendSMS(phone, message);
  }

  try {
    const token = await getWPToken();
    const res = await axios.post('https://api.toplusms.app/bulk/wp/nton', {
      phones: [{ phone: normalizePhoneWP(phone), message }],
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('[TopluSMS] WhatsApp gönderildi:', phone, res.data);
    return true;
  } catch (err: any) {
    console.error('[TopluSMS] WhatsApp gönderilemedi:', err?.response?.data ?? err.message);
    console.log('[TopluSMS] SMS fallback deneniyor...');
    return sendSMS(phone, message);
  }
}
