// Telefone BR — máscara e validação no cliente.
// A normalização definitiva para E.164 acontece no servidor.

export function maskPhoneBR(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Aceita fixo (10) ou celular (11). DDD 11–99.
export function isValidPhoneBR(input: string): boolean {
  const d = input.replace(/\D/g, '');
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11 && d[2] !== '9') return false;
  return true;
}

export function phoneDigits(input: string): string {
  return input.replace(/\D/g, '');
}
