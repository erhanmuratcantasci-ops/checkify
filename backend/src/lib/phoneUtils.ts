/**
 * Türkiye telefon numarasını +90XXXXXXXXXX formatına normalize eder.
 *
 * Desteklenen girişler:
 *   "05XXXXXXXXX"   → "+905XXXXXXXXX"
 *   "5XXXXXXXXX"    → "+905XXXXXXXXX"
 *   "+905XXXXXXXXX" → "+905XXXXXXXXX" (değişmez)
 *   "90 5XX XXX XX XX" → "+905XXXXXXXXX" (boşluk/tire temizlenir)
 */
export function normalizePhone(phone: string): string {
  // Boşluk, tire, parantez temizle
  const cleaned = phone.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+90')) return cleaned;
  if (cleaned.startsWith('90')) return '+' + cleaned;
  if (cleaned.startsWith('05')) return '+90' + cleaned.slice(1);
  if (cleaned.startsWith('5')) return '+90' + cleaned;

  return cleaned;
}
