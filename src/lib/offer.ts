/** Virada pós-evento: 13/set/2026 00:00 BRT — logo após o dia 12 de setembro. */
export const EVENT_POST_DATE = new Date('2026-09-13T00:00:00-03:00');

const LIVE_EAP_URL = import.meta.env.DEV
  ? ((import.meta.env.VITE_EAP_URL as string | undefined) ??
    'http://localhost:5174/eap/#quiz-127')
  : 'https://www.missaoconsciencia.com.br/eap#quiz-127';

/** Depois do dia 12 o quiz cai na landing pós-evento, não no checkout. */
const POST_EVENT_EAP_URL = import.meta.env.DEV
  ? 'http://localhost:5174/eap/?evento=passado'
  : 'https://www.missaoconsciencia.com.br/eap';

export type QuizOffer = {
  mode: 'live' | 'immediate';
  price: number;
  priceLabel: string;
  compareLabel: string | null;
  image: string;
  imageAlt: string;
  href: string;
  cta: string;
  stepTitle: string;
  stepNextTitle: string;
  kicker: string;
  body: string;
  foot: string | null;
  trackOffer: string;
};

function readPreview(): boolean | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === 'evento-passado') return true;
  if (hash === 'evento-ao-vivo') return false;
  const value = new URLSearchParams(window.location.search).get('evento');
  if (value === 'passado') return true;
  if (value === 'ao-vivo') return false;
  return null;
}

export function isEventPast(now = new Date()): boolean {
  const preview = readPreview();
  if (preview !== null) return preview;
  return now.getTime() >= EVENT_POST_DATE.getTime();
}

export function getQuizOffer(now = new Date()): QuizOffer {
  const base = import.meta.env.BASE_URL;

  if (isEventPast(now)) {
    return {
      mode: 'immediate',
      price: 127,
      priceLabel: 'R$127',
      compareLabel: 'R$197',
      image: `${base}bg-quiz-imediato.webp`,
      imageAlt: 'Efeito Alta Permissão, acesso imediato',
      href: POST_EVENT_EAP_URL,
      cta: 'Garantir meu acesso por R$127',
      stepTitle: 'Garantir acesso',
      stepNextTitle: 'Acesso Imediato',
      kicker: 'O treinamento está disponível',
      body: 'Acesso imediato ao conteúdo completo.',
      foot: null,
      trackOffer: '127',
    };
  }

  return {
    mode: 'live',
    price: 127,
    priceLabel: 'R$127',
    compareLabel: 'R$197',
    image: `${base}bg-quiz.webp`,
    imageAlt: 'Efeito Alta Permissão, ao vivo em 12 de setembro às 9h',
    href: LIVE_EAP_URL,
    cta: 'Garantir meu ingresso VIP por R$127',
    stepTitle: 'Garantir Ingresso',
    stepNextTitle: 'Participar ao vivo',
    kicker: 'Liberei alguns poucos Ingressos VIP pelo valor promocional',
    body: 'Esse valor só vale neste botão, nesta tela.',
    foot: 'Amanhã ou quando acabarem os ingressos já não vale mais.',
    trackOffer: 'vip127',
  };
}
