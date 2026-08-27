import { countsFromAnswers, type Answer } from '../data/answerKey';
import { computeResult, type ResultCode, type ResultType } from '../data/scoring';
import { getGaClientId } from './analytics';
import { getUtm } from './utm';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const BACKEND_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export type LeadInput = {
  name: string;
  email: string;
  phone: string; // como digitado; o servidor normaliza
  consent_lgpd: boolean;
  answers: Answer[];
  hp: string; // honeypot
};

export type SubmitOk = {
  ok: true;
  alreadyExists: boolean;
  result_code: ResultCode;
  result_type: ResultType;
};

export type SubmitErr = {
  ok: false;
  error: 'validation' | 'rate_limited' | 'network' | 'server';
  fields?: Record<string, string>;
};

export type SubmitResult = SubmitOk | SubmitErr;

export async function submitQuiz(input: LeadInput): Promise<SubmitResult> {
  const { utm, referrer, landing_path } = getUtm();

  // ---- MODO DEV (sem Supabase configurado) ----
  if (!BACKEND_ENABLED) {
    await new Promise((r) => setTimeout(r, 450));
    const { code, type } = computeResult(countsFromAnswers(input.answers));
    // eslint-disable-next-line no-console
    console.info('[submitQuiz:dev] lead não persistido:', {
      name: input.name,
      email: input.email,
      phone: input.phone,
      consent_lgpd: input.consent_lgpd,
      result_code: code,
      utm,
    });
    return { ok: true, alreadyExists: false, result_code: code, result_type: type };
  }

  // ---- PRODUÇÃO ----
  let ga_client_id: string | undefined;
  try {
    ga_client_id = await getGaClientId();
  } catch {
    ga_client_id = undefined;
  }

  const payload = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    consent_lgpd: input.consent_lgpd,
    answers: input.answers,
    hp: input.hp,
    utm,
    referrer,
    landing_path,
    ga_client_id,
  };

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/submit-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: 'network' };
  }

  if (res.status === 429) return { ok: false, error: 'rate_limited' };

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'server' };
  }

  const d = data as Record<string, unknown>;
  if (res.ok && d.ok === true) {
    return {
      ok: true,
      alreadyExists: Boolean(d.alreadyExists),
      result_code: d.result_code as ResultCode,
      result_type: d.result_type as ResultType,
    };
  }
  if (d.error === 'validation') {
    return { ok: false, error: 'validation', fields: (d.fields as Record<string, string>) ?? {} };
  }
  return { ok: false, error: 'server' };
}
