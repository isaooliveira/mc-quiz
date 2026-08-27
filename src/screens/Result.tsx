import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RichText } from '../components/RichText';
import { EYEBROW, RESULTS } from '../data/results';
import { useQuiz } from '../state/QuizContext';
import { track } from '../lib/analytics';

const EAP_URL =
  (import.meta.env.VITE_EAP_URL as string | undefined) ??
  'https://www.missaoconsciencia.com.br/eap#quiz-ig';

export function Result() {
  const { submitted, result, alreadyExisted } = useQuiz();

  const data = result ? RESULTS[result.code] : null;

  useEffect(() => {
    if (data) track('quiz_result_viewed', { result_code: data.code });
  }, [data]);

  if (!submitted || !result || !data) return <Navigate to="/" replace />;

  return (
    <Layout>
      <div className="screen result">
        {alreadyExisted && (
          <div className="notice">Você já fez este teste — esta é a sua leitura.</div>
        )}

        <p className="eyebrow">{EYEBROW}</p>
        <p className="name">{data.name}</p>
        {data.headline && <h1>{data.headline}</h1>}

        <div className="body">
          {data.body.map((p, i) => (
            <p key={i}>
              <RichText text={p} />
            </p>
          ))}
        </div>

        <div className="eap">{data.eap}</div>

        <a
          className="btn btn-primary btn-block"
          href={EAP_URL}
          onClick={() => track('cta_eap_click', { result_code: data.code })}
        >
          Quero destravar isso no Efeito Alta Permissão
        </a>
      </div>
    </Layout>
  );
}
