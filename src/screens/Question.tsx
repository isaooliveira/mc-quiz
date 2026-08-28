import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { QUESTIONS } from '../data/questions';
import { TOTAL_QUESTIONS } from '../data/answerKey';
import type { OptionId } from '../data/scoring';
import { useQuiz } from '../state/QuizContext';
import { track } from '../lib/analytics';
import { setNavDir } from '../lib/nav';

// Respiro entre marcar a resposta e a tela avançar sozinha.
const ADVANCE_DELAY = 250;

export function Question() {
  const { n } = useParams();
  const navigate = useNavigate();
  const { answers, setAnswer, submitted } = useQuiz();

  const num = Number(n);
  const valid = Number.isInteger(num) && num >= 1 && num <= TOTAL_QUESTIONS;

  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [num]);

  // Limpa o timer de auto-avanço se a tela sair antes da hora.
  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  if (submitted) return <Navigate to="/resultado" replace />;
  if (!valid) return <Navigate to="/" replace />;

  // Não deixa pular: só acessa a pergunta N se as anteriores estão respondidas.
  for (let i = 1; i < num; i++) {
    if (!answers[i]) return <Navigate to={`/pergunta/${i}`} replace />;
  }

  const question = QUESTIONS[num - 1];
  const selected = answers[num];
  const isLast = num === TOTAL_QUESTIONS;

  function choose(option: OptionId) {
    setAnswer(num, option);
    track('quiz_question_answered', { question_number: num });

    // Auto-avanço com respiro: a resposta confirma, espera 250ms, a tela desliza.
    // Trocar de opção dentro da janela reinicia a contagem.
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      setNavDir('fwd');
      if (isLast) {
        track('quiz_completed');
        navigate('/dados', { viewTransition: true });
      } else {
        navigate(`/pergunta/${num + 1}`, { viewTransition: true });
      }
    }, ADVANCE_DELAY);
  }

  function goBack() {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    setNavDir('back');
    navigate(`/pergunta/${num - 1}`, { viewTransition: true });
  }

  return (
    <Layout>
      <div className="screen">
        <div className="progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${num / TOTAL_QUESTIONS})` }} />
        </div>
        <p className="eyebrow">
          Pergunta {num} de {TOTAL_QUESTIONS}
        </p>

        <div className="scenario">
          {question.blocks.map((b, i) =>
            b.kind === 'quote' ? (
              <p className="quote" key={i}>
                {b.text}
              </p>
            ) : (
              <p key={i}>{b.text}</p>
            ),
          )}
        </div>

        <p className="prompt">{question.prompt}</p>

        <ul className="options" role="radiogroup" aria-label={question.prompt}>
          {question.options.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                className="option"
                role="radio"
                aria-checked={selected === opt.id}
                onClick={() => choose(opt.id)}
              >
                <span className="tick" aria-hidden="true" />
                <span>{opt.text}</span>
              </button>
            </li>
          ))}
        </ul>

        {num > 1 && (
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={goBack}>
              Voltar
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
