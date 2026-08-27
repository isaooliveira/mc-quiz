// Persistência leve do progresso, resistente a refresh. Envolve tudo em try/catch.

import type { ResultCode, ResultType } from '../data/scoring';
import type { OptionId } from '../data/scoring';

const KEY = 'eap-quiz-v1';

export type PersistedState = {
  answers: Record<number, OptionId>;
  submitted: boolean;
  result: { code: ResultCode; type: ResultType } | null;
  alreadyExisted?: boolean;
};

const EMPTY: PersistedState = { answers: {}, submitted: false, result: null };

export function loadState(): PersistedState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as PersistedState;
    return { ...EMPTY, ...parsed, answers: parsed.answers ?? {} };
  } catch {
    return { ...EMPTY };
  }
}

export function saveState(state: PersistedState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* modo privado / storage cheio — segue sem persistir */
  }
}

export function clearState(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
