const ALLOWED_VARS = ['{isim}', '{siparis_no}', '{link}', '{tutar}'];
const PHONE_REGEX = /^\+90\d{10}$/;
const SUSPICIOUS_PATTERNS = [/<[^>]+>/, /https?:\/\//i, /script/i];

export interface SMSValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSMSMessage(message: string): SMSValidationResult {
  if (message.length > 160) {
    return { valid: false, error: `SMS çok uzun: ${message.length} karakter (max 160)` };
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(message)) {
      return { valid: false, error: 'SMS şüpheli içerik barındırıyor (URL, HTML tag veya script)' };
    }
  }

  return { valid: true };
}

export function validateSMSTemplate(template: string): SMSValidationResult {
  const found = template.match(/\{[^}]+\}/g) || [];
  const invalid = found.filter(v => !ALLOWED_VARS.includes(v));
  if (invalid.length > 0) {
    return {
      valid: false,
      error: `Geçersiz değişkenler: ${invalid.join(', ')}. İzin verilenler: ${ALLOWED_VARS.join(', ')}`,
    };
  }
  return { valid: true };
}

export function validatePhone(phone: string): SMSValidationResult {
  if (!PHONE_REGEX.test(phone)) {
    return { valid: false, error: `Geçersiz telefon numarası: ${phone}. +90 ile başlayıp 13 karakter olmalı.` };
  }
  return { valid: true };
}
