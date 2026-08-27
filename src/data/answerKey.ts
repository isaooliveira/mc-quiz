// Gabarito canônico: pergunta -> letra -> padrão.
// Extraído de "Quiz Perguntas.md". Fonte de verdade também no servidor.

import { emptyCounts, type Counts, type OptionId, type Tag } from './scoring';

export const ANSWER_KEY: Record<number, Record<OptionId, Tag>> = {
  1: { A: 'FP', B: 'LI', C: 'TE', D: 'VC' },
  2: { A: 'VC', B: 'FP', C: 'LI', D: 'TE' },
  3: { A: 'LI', B: 'TE', C: 'FP', D: 'VC' },
  4: { A: 'TE', B: 'VC', C: 'LI', D: 'FP' },
  5: { A: 'FP', B: 'VC', C: 'TE', D: 'LI' },
  6: { A: 'LI', B: 'VC', C: 'TE', D: 'FP' },
  7: { A: 'TE', B: 'FP', C: 'LI', D: 'VC' },
  8: { A: 'VC', B: 'FP', C: 'LI', D: 'TE' },
  9: { A: 'LI', B: 'FP', C: 'VC', D: 'TE' },
  10: { A: 'TE', B: 'FP', C: 'VC', D: 'LI' },
};

export const TOTAL_QUESTIONS = 10;

export type Answer = { q: number; option: OptionId };

export function countsFromAnswers(answers: Answer[]): Counts {
  const counts = emptyCounts();
  for (const { q, option } of answers) {
    const tag = ANSWER_KEY[q]?.[option];
    if (tag) counts[tag] += 1;
  }
  return counts;
}
