// GA4 — só dispara em produção e com VITE_GA_ID definido.
// O script do gtag é injetado por JS para não coletar nada em dev/local.

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
const ENABLED = import.meta.env.PROD && !!GA_ID;

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let started = false;

export function initAnalytics(): void {
  if (!ENABLED || started) return;
  started = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

export function track(event: string, params: Params = {}): void {
  if (!ENABLED) {
    if (import.meta.env.DEV) console.debug('[ga:dev]', event, params);
    return;
  }
  window.gtag?.('event', event, params);
}

export function pageview(path: string): void {
  if (!ENABLED) return;
  window.gtag?.('event', 'page_view', { page_path: path, page_location: location.origin + path });
}

// Best-effort: recupera o client_id do GA4 para casar o lead no relatório.
export function getGaClientId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!ENABLED || !window.gtag) return resolve(undefined);
    let done = false;
    const finish = (v?: string) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    try {
      window.gtag('get', GA_ID, 'client_id', (id: string) => finish(id));
    } catch {
      finish(undefined);
    }
    setTimeout(() => finish(undefined), 800);
  });
}
