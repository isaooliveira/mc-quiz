import { isValidPhoneNumber } from 'libphonenumber-js';

/** Aceita E.164 (`+5511999998888`) ou número nacional BR legado. */
export function isValidPhone(input: string): boolean {
  const raw = (input || '').trim();
  if (!raw) return false;
  try {
    if (raw.startsWith('+')) return isValidPhoneNumber(raw);
    // fallback: alguém colou só o nacional BR
    const d = raw.replace(/\D/g, '');
    if (d.length === 10 || d.length === 11) return isValidPhoneNumber('+55' + d, 'BR');
    return isValidPhoneNumber(raw);
  } catch {
    return false;
  }
}
