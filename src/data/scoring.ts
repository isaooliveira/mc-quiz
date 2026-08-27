// Motor de cálculo do resultado. Função pura, sem dependências.
// Espelhado em supabase/functions/submit-quiz/lib.ts (fonte de verdade no servidor).

export type Tag = 'FP' | 'VC' | 'TE' | 'LI';
export type OptionId = 'A' | 'B' | 'C' | 'D';

export type Counts = Record<Tag, number>;

export type ResultCode =
  | 'FP'
  | 'VC'
  | 'TE'
  | 'LI'
  | 'LI_ALL'
  | 'FP_VC'
  | 'FP_TE'
  | 'FP_LI'
  | 'VC_TE'
  | 'VC_LI'
  | 'TE_LI';

export type ResultType = 'pure' | 'hybrid' | 'special';

// Prioridade só para desempate na seleção das categorias. Não pontua a mais.
const PRIORITY: Record<Tag, number> = { FP: 0, VC: 1, TE: 2, LI: 3 };
const LABEL_ORDER: Tag[] = ['FP', 'VC', 'TE', 'LI'];

export function emptyCounts(): Counts {
  return { FP: 0, VC: 0, TE: 0, LI: 0 };
}

export function computeResult(counts: Counts): { code: ResultCode; type: ResultType } {
  // 1. LI >= 9 (9 ou 10 respostas LI) -> resultado especial.
  if (counts.LI >= 9) return { code: 'LI_ALL', type: 'special' };

  // Ordena por contagem desc; empate -> prioridade asc (FP > VC > TE > LI).
  const entries = LABEL_ORDER.map((t) => [t, counts[t]] as [Tag, number]);
  entries.sort((a, b) => b[1] - a[1] || PRIORITY[a[0]] - PRIORITY[b[0]]);

  const [c1, v1] = entries[0];
  const [c2, v2] = entries[1];

  // 2. Vantagem de 2+ do 1º sobre o 2º -> resultado puro.
  if (v1 - v2 >= 2) return { code: c1, type: 'pure' };

  // 3. Empate ou diferença de 1 -> híbrido dos dois primeiros, rótulo na ordem canônica.
  const pair = [c1, c2].sort((a, b) => LABEL_ORDER.indexOf(a) - LABEL_ORDER.indexOf(b));
  return { code: pair.join('_') as ResultCode, type: 'hybrid' };
}
