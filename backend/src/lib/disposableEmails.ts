// Yaygın disposable email domain'leri
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','temp-mail.org','throwam.com',
  'yopmail.com','sharklasers.com','guerrillamailblock.com','grr.la',
  'guerrillamail.info','guerrillamail.biz','guerrillamail.de','guerrillamail.net',
  'guerrillamail.org','spam4.me','trashmail.com','trashmail.me','trashmail.net',
  'dispostable.com','mailnull.com','spamgourmet.com','spamgourmet.net',
  'spamgourmet.org','spamspot.com','spamthisplease.com','fakeinbox.com',
  'tempinbox.com','mailexpire.com','spamex.com','deadaddress.com',
  'spambog.com','spambog.de','spambog.ru','temporaryinbox.com',
  'throwam.com','discard.email','mailnesia.com','maildrop.cc',
  'dispostable.com','spamgourmet.com','trashmail.at','trashmail.io',
  'trashmail.xyz','mailsac.com','spam.la','mytemp.email','tempmail.com',
  'tempr.email','discard.email','filzmail.com','throwam.com','sharklasers.com',
  'spamfree24.org','spam.la','mailnull.com','spamspot.com','0-mail.com',
  '0815.ru','0clickemail.com','0wnd.net','0wnd.org','10minutemail.com',
  '20minutemail.com','getairmail.com','fakeemails.com','tempail.com',
  'tempemail.net','throwam.com','nwytg.net','binkmail.com','bobmail.info',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
