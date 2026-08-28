import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useQuiz } from '../state/QuizContext';
import { PhoneField } from '../components/PhoneField';
import { isValidPhone } from '../lib/phone';
import { submitQuiz, type SubmitResult } from '../lib/submit';
import { track } from '../lib/analytics';
import { setNavDir } from '../lib/nav';

const PRIVACY_URL = '#'; // TODO: URL da Política de Privacidade da Missão Consciência

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'consent', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadGate() {
  const navigate = useNavigate();
  const { allAnswered, submitted, answersList, markSubmitted } = useQuiz();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState(''); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (submitted) return <Navigate to="/resultado" replace />;
  if (!allAnswered) return <Navigate to="/" replace />;

  function validate(): Errors {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Digite seu nome.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Digite um e-mail válido.';
    if (!isValidPhone(phone)) e.phone = 'Digite um WhatsApp válido.';
    if (!consent) e.consent = 'Você precisa concordar para continuar.';
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    let res: SubmitResult;
    try {
      res = await submitQuiz({
        name: name.trim(),
        email: email.trim(),
        phone,
        consent_lgpd: consent,
        answers: answersList,
        hp,
      });
    } catch {
      res = { ok: false, error: 'server' };
    }
    setLoading(false);

    if (res.ok) {
      track('generate_lead', {
        result_code: res.result_code,
        result_type: res.result_type,
        already_exists: res.alreadyExists,
      });
      markSubmitted({ code: res.result_code, type: res.result_type }, res.alreadyExists);
      setNavDir('fwd');
      navigate('/resultado', { replace: true, viewTransition: true });
      return;
    }

    if (res.error === 'validation') {
      setErrors(res.fields ?? {});
      setFormError('Confere os campos destacados.');
    } else if (res.error === 'rate_limited') {
      setFormError('Muitas tentativas. Espera alguns minutos e tenta de novo.');
    } else if (res.error === 'network') {
      setFormError('Sem conexão. Verifica a internet e tenta de novo.');
    } else {
      setFormError('Não consegui salvar agora. Tenta de novo.');
    }
  }

  return (
    <Layout>
      <form className="screen gate" onSubmit={onSubmit} noValidate>
        <p className="eyebrow">Último passo</p>
        <h1>Falta pouco para ver a sua leitura.</h1>
        <p className="sub">Preenche para liberar o seu resultado.</p>

        {formError && <div className="form-error">{formError}</div>}

        <div className={`field ${errors.name ? 'has-error' : ''}`}>
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
          {errors.name && <p className="err">{errors.name}</p>}
        </div>

        <div className={`field ${errors.phone ? 'has-error' : ''}`}>
          <label htmlFor="phone">WhatsApp</label>
          <PhoneField
            id="phone"
            value={phone}
            onChange={setPhone}
            invalid={Boolean(errors.phone)}
          />
          {errors.phone && <p className="err">{errors.phone}</p>}
        </div>

        <div className={`field ${errors.email ? 'has-error' : ''}`}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={180}
          />
          {errors.email && <p className="err">{errors.email}</p>}
        </div>

        <input
          className="hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />

        <label className="consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            Aceito a{' '}
            <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
              Política de Privacidade
            </a>{' '}
            e autorizo a Missão Consciência a enviar conteúdos por e-mail e WhatsApp.
          </span>
        </label>
        {errors.consent && <p className="err">{errors.consent}</p>}

        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Ver meu resultado'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
