import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { INTRO_PARAGRAPHS } from '../data/questions';
import { useQuiz } from '../state/QuizContext';
import { track } from '../lib/analytics';
import { setNavDir } from '../lib/nav';

export function Intro() {
  const navigate = useNavigate();
  const { submitted, answeredCount, firstUnanswered, reset } = useQuiz();

  function start() {
    track('quiz_start');
    setNavDir('fwd');
    if (submitted) {
      reset();
      navigate('/pergunta/1', { viewTransition: true });
      return;
    }
    navigate(`/pergunta/${answeredCount > 0 ? firstUnanswered : 1}`, { viewTransition: true });
  }

  const resuming = !submitted && answeredCount > 0;

  return (
    <Layout>
      <div className="screen intro">
        <p className="eyebrow">Teste · 10 situações</p>
        <h1>Antes de começar</h1>
        {INTRO_PARAGRAPHS.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <aside className="time-card">
          O teste leva em média 3 minutos · Não tem resposta certa.
        </aside>
        <button className="btn btn-primary btn-block" onClick={start}>
          {resuming ? 'Continuar' : 'Começar'}
        </button>
      </div>
    </Layout>
  );
}
