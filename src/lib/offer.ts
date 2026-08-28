/** Virada pós-evento: 13/set/2026 00:00 BRT — logo após o dia 12 de setembro. */
export const EVENT_POST_DATE = new Date('2026-09-13T00:00:00-03:00');

const LIVE_EAP_URL = import.meta.env.DEV
  ? ((import.meta.env.VITE_EAP_URL as string | undefined) ??
    'http://localhost:5174/eap#quiz-67')
  : 'https://www.missaoconsciencia.com.br/eap/quiz-67';

const POST_EVENT_CHECKOUT = 'https://pay.hotmart.com/G107328971N?off=v3x36p1y';

export type QuizOffer = {
  mode: 'live' | 'immediate';
  price: number;
  priceLabel: string;
  image: string;
  imageAlt: string;
  href: string;
  cta: string;
  stepTitle: string;
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
      image: `${base}bg-quiz-imediato.webp`,
      imageAlt: 'Efeito Alta Permissão, acesso imediato',
      href: POST_EVENT_CHECKOUT,
      cta: 'Garantir meu acesso por R$127',
      stepTitle: 'Acesso',
      kicker: 'O treinamento está disponível por',
      body: 'Acesso imediato ao conteúdo completo.',
      foot: null,
      trackOffer: '127',
    };
  }

  return {
    mode: 'live',
    price: 67,
    priceLabel: 'R$67',
    image: `${base}bg-quiz.webp`,
    imageAlt: 'Efeito Alta Permissão, ao vivo em 12 de setembro às 9h',
    href: LIVE_EAP_URL,
    cta: 'Garantir meu ingresso por R$67',
    stepTitle: 'Ingresso',
    kicker: 'Liberei poucos ingressos a',
    body: 'Esse é o menor valor para garantir um lugar no treinamento. Mas só vale neste botão abaixo, nesta tela.',
    foot: 'Amanhã ou quando acabarem os ingressos já não vale mais.',
    trackOffer: '67',
  };
}
