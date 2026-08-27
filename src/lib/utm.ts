// Captura de UTMs + referrer no primeiro carregamento, guardado para enviar no lead.

const KEY = 'eap-quiz-utm-v1';

export type UtmData = {
  utm: Record<string, string>;
  referrer: string;
  landing_path: string;
};

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

export function captureUtmOnce(): void {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const sp = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = sp.get(k);
      if (v) utm[k.replace('utm_', '')] = v.slice(0, 200);
    }
    const data: UtmData = {
      utm,
      referrer: document.referrer.slice(0, 500),
      landing_path: location.pathname + location.search,
    };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* noop */
  }
}

export function getUtm(): UtmData {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as UtmData;
  } catch {
    /* noop */
  }
  return { utm: {}, referrer: '', landing_path: location.pathname };
}
