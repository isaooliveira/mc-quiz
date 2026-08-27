import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { QUESTIONS } from '../data/questions';
import { TOTAL_QUESTIONS } from '../data/answerKey';
import type { OptionId } from '../data/scoring';
import { useQuiz } from '../state/QuizContext';
import { track } from '../lib/analytics';

export function Question() {
  const { n } = useParams();
  const navigate = useNavigate();
  const { answers, setAnswer, submitted } = useQuiz();

  const num = Number(n);
  const valid = Number.isInteger(num) && num >= 1 && num <= TOTAL_QUESTIONS;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [num]);

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
  }

  function next() {
    if (!selected) return;
    if (isLast) {
      track('quiz_completed');
      navigate('/dados');
    } else {
      navigate(`/pergunta/${num + 1}`);
    }
  }

  return (
    <Layout>
      <div className="screen">
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${(num / TOTAL_QUESTIONS) * 100}%` }} />
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

        <div className="btn-row">
          {num > 1 && (
            <button className="btn btn-ghost" onClick={() => navigate(`/pergunta/${num - 1}`)}>
              Voltar
            </button>
          )}
          <button className="btn btn-primary" disabled={!selected} onClick={next}>
            {isLast ? 'Ver resultado' : 'Próxima'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
