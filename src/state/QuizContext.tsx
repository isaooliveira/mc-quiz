import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { OptionId, ResultCode, ResultType } from '../data/scoring';
import { TOTAL_QUESTIONS, type Answer } from '../data/answerKey';
import { clearState, loadState, saveState } from '../lib/storage';

type QuizState = {
  answers: Record<number, OptionId>;
  submitted: boolean;
  result: { code: ResultCode; type: ResultType } | null;
  alreadyExisted: boolean;
};

type QuizContextValue = QuizState & {
  setAnswer: (q: number, option: OptionId) => void;
  answeredCount: number;
  allAnswered: boolean;
  firstUnanswered: number; // 1..10
  answersList: Answer[];
  markSubmitted: (result: { code: ResultCode; type: ResultType }, alreadyExisted: boolean) => void;
  reset: () => void;
};

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState>(() => {
    const s = loadState();
    return {
      answers: s.answers ?? {},
      submitted: s.submitted ?? false,
      result: s.result ?? null,
      alreadyExisted: s.alreadyExisted ?? false,
    };
  });

  useEffect(() => {
    saveState({
      answers: state.answers,
      submitted: state.submitted,
      result: state.result,
      alreadyExisted: state.alreadyExisted,
    });
  }, [state]);

  const setAnswer = useCallback((q: number, option: OptionId) => {
    setState((prev) => {
      if (prev.submitted) return prev; // travado após envio
      return { ...prev, answers: { ...prev.answers, [q]: option } };
    });
  }, []);

  const markSubmitted = useCallback(
    (result: { code: ResultCode; type: ResultType }, alreadyExisted: boolean) => {
      setState((prev) => ({ ...prev, submitted: true, result, alreadyExisted }));
    },
    [],
  );

  const reset = useCallback(() => {
    clearState();
    setState({ answers: {}, submitted: false, result: null, alreadyExisted: false });
  }, []);

  const derived = useMemo(() => {
    const answeredCount = Object.keys(state.answers).length;
    let firstUnanswered = TOTAL_QUESTIONS + 1;
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      if (!state.answers[i]) {
        firstUnanswered = i;
        break;
      }
    }
    const answersList: Answer[] = [];
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      const option = state.answers[i];
      if (option) answersList.push({ q: i, option });
    }
    return {
      answeredCount,
      allAnswered: answeredCount === TOTAL_QUESTIONS,
      firstUnanswered: Math.min(firstUnanswered, TOTAL_QUESTIONS),
      answersList,
    };
  }, [state.answers]);

  const value: QuizContextValue = {
    ...state,
    setAnswer,
    markSubmitted,
    reset,
    ...derived,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz precisa estar dentro de <QuizProvider>');
  return ctx;
}
