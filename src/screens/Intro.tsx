import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { INTRO_PARAGRAPH } from '../data/questions';
import { useQuiz } from '../state/QuizContext';
import { track } from '../lib/analytics';

export function Intro() {
  const navigate = useNavigate();
  const { submitted, answeredCount, firstUnanswered, reset } = useQuiz();

  function start() {
    track('quiz_start');
    if (submitted) {
      reset();
      navigate('/pergunta/1');
      return;
    }
    navigate(`/pergunta/${answeredCount > 0 ? firstUnanswered : 1}`);
  }

  const resuming = !submitted && answeredCount > 0;

  return (
    <Layout>
      <div className="screen intro">
        <p className="eyebrow">Teste · 10 situações</p>
        <h1>Como você lê um caso?</h1>
        <p>{INTRO_PARAGRAPH}</p>
        <p className="meta">Leva cerca de 2 minutos. Não tem resposta certa.</p>
        <button className="btn btn-primary btn-block" onClick={start}>
          {resuming ? 'Continuar' : 'Começar'}
        </button>
      </div>
    </Layout>
  );
}
