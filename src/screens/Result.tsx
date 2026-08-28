import { Fragment, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RichText } from '../components/RichText';
import { EYEBROW, PATTERN_LABELS, RESULTS, splitResultBody, tagsFor } from '../data/results';
import { useQuiz } from '../state/QuizContext';
import { track } from '../lib/analytics';
import { getQuizOffer } from '../lib/offer';

export function Result() {
  const { submitted, result, alreadyExisted } = useQuiz();
  const [offer, setOffer] = useState(() => getQuizOffer());

  useEffect(() => {
    const tick = () => setOffer(getQuizOffer());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const data = result ? RESULTS[result.code] : null;

  useEffect(() => {
    if (data) track('quiz_result_viewed', { result_code: data.code });
  }, [data]);

  if (!submitted || !result || !data) return <Navigate to="/" replace />;

  const tags = tagsFor(data.code);
  const hybrid = tags.length > 1;
  const { reading, nextStep } = splitResultBody(data.body);

  return (
    <Layout>
      <article className="screen result">
        {alreadyExisted && (
          <p className="notice">Você já fez este teste — esta é a sua leitura.</p>
        )}

        <header className="result-reveal">
          <p className="eyebrow">{EYEBROW}</p>
          <h1 className="result-name" data-hybrid={hybrid ? 'true' : undefined}>
            {tags.map((tag, i) => (
              <Fragment key={tag}>
                {i > 0 && <span className="result-plus"> + </span>}
                <span>{PATTERN_LABELS[tag]}</span>
              </Fragment>
            ))}
          </h1>
          <span className="result-mark" aria-hidden="true" />
          {data.headline && (
            <p className="result-headline">
              <mark className="result-ink">{data.headline}</mark>
            </p>
          )}
        </header>

        <div className="result-reading">
          {reading.map((p, i) => (
            <p key={i}>
              <RichText text={p} />
            </p>
          ))}
        </div>

        {nextStep && (
          <aside className="result-next">
            <p className="result-next-label">{nextStep.label}</p>
            <p>
              <RichText text={nextStep.text} />
            </p>
          </aside>
        )}

        <section className="result-path">
          <ol className="result-steps" aria-label="O que vem agora">
            <li className="result-step is-done">
              <span className="result-step-index" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="14" height="14">
                  <path
                    d="M3.2 8.2 6.4 11.3 12.8 4.6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="result-step-title">Leitura</p>
              <p className="result-step-hint">feita</p>
            </li>
            <li className="result-step is-now" aria-current="step">
              <span className="result-step-here">Você está aqui</span>
              <span className="result-step-index" aria-hidden="true">
                2
              </span>
              <p className="result-step-title">{offer.stepTitle}</p>
              <p className="result-step-hint">{offer.priceLabel}</p>
            </li>
            <li className="result-step is-next">
              <span className="result-step-index" aria-hidden="true">
                3
              </span>
              <p className="result-step-title">Treino</p>
              <p className="result-step-hint">EAP</p>
            </li>
          </ol>

          <div className="result-step-panel">
            <div className="eap">{data.eap}</div>
            <img
              className="result-offer-art"
              src={offer.image}
              alt={offer.imageAlt}
              width={1073}
              height={461}
            />
            <aside className="result-offer">
              <p>{offer.kicker}</p>
              <p className="result-offer-price">{offer.priceLabel}</p>
              <p>{offer.body}</p>
              {offer.foot && <p>{offer.foot}</p>}
            </aside>
            <a
              className="btn btn-primary btn-block"
              href={offer.href}
              onClick={() =>
                track('cta_eap_click', { result_code: data.code, offer: offer.trackOffer })
              }
            >
              {offer.cta}
            </a>
          </div>
        </section>
      </article>
    </Layout>
  );
}
