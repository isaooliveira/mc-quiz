# Quiz — "Como você lê um caso?" (Efeito Alta Permissão)

Quiz de 10 casos que classifica a terapeuta em **FP / VC / TE / LI** e captura o lead
(nome + WhatsApp + e-mail) antes de mostrar a leitura. Botão final leva ao EAP.

- **Spec completa:** [`PRD.md`](./PRD.md)
- **Stack:** React + Vite · React Router · Supabase (Postgres + Edge Function) · Vercel
- **URL de produção:** `https://www.missaoconsciencia.com.br/quiz`

## Rodar local

```bash
npm install
npm run dev
# abre http://localhost:5173/quiz/
```

Sem `.env.local`, o app roda em **modo dev**: calcula o resultado no cliente e só
loga o lead no console (nada é gravado). O fluxo inteiro é testável assim.

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

| Var | Para quê |
|---|---|
| `VITE_SUPABASE_URL` | ativa a gravação real via Edge Function |
| `VITE_SUPABASE_ANON_KEY` | bearer público para chamar a função |
| `VITE_GA_ID` | GA4 (`G-Y98DTB03J4`) — só dispara em build de produção |
| `VITE_EAP_URL` | destino do botão final |

## Backend (Supabase)

1. Criar projeto no Supabase.
2. Aplicar a migration `supabase/migrations/0001_quiz_leads.sql` (SQL editor ou `supabase db push`).
3. Publicar a função:
   ```bash
   supabase functions deploy submit-quiz --no-verify-jwt
   supabase secrets set IP_HASH_SALT="<uma-string-aleatoria>"
   ```
   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem no ambiente da função.
4. Pôr `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas env vars do projeto Vercel.

RLS fica **ligado e sem policies** — a tabela não é acessível pela chave pública;
toda escrita passa pela função (service role), que revalida tudo e recalcula o
resultado a partir do gabarito canônico.

## Deploy (Vercel)

1. Repositório próprio → projeto Vercel `mc-quiz`. `npm run build` gera `dist/`.
   O `vercel.json` deste repo resolve o base path `/quiz/`.
2. No repositório do **site principal** (`www.missaoconsciencia.com.br`), acrescentar
   ao `vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/quiz",      "destination": "https://mc-quiz.vercel.app/quiz" },
       { "source": "/quiz/(.*)", "destination": "https://mc-quiz.vercel.app/quiz/$1" }
     ]
   }
   ```
   (se já houver `rewrites`, só adicionar as duas linhas ao array).

## Pendências

- URL da Política de Privacidade → `src/screens/LeadGate.tsx` (`PRIVACY_URL`)
- Imagem OG 1200×630 → `index.html`
- Decidir `index` vs `noindex` → `index.html` (hoje `noindex, follow`)
- WhatsApp/e-mail do resultado = Fase 2 (telefone já é coletado e guardado)

## Estrutura

```
src/
  data/       questions.ts · answerKey.ts · scoring.ts · results.ts
  lib/        analytics.ts · phone.ts · storage.ts · utm.ts · submit.ts
  state/      QuizContext.tsx
  screens/    Intro · Question · LeadGate · Result
  components/ Layout · RichText
supabase/
  migrations/0001_quiz_leads.sql
  functions/submit-quiz/index.ts
```
