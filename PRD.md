# PRD — Quiz "Como você lê um caso"

**Produto:** Quiz interativo de captura de leads para o Efeito Alta Permissão (EAP)
**Marca:** Missão Consciência
**URL de produção:** `https://www.missaoconsciencia.com.br/quiz`
**Redirecionamento final:** `https://www.missaoconsciencia.com.br/eap#quiz-ig`
**Stack:** React + Vite · Supabase (Postgres + Edge Functions) · Vercel
**Status:** rascunho para implementação — v1

---

## Índice

1. [Objetivo e contexto](#1-objetivo-e-contexto)
2. [Escopo do MVP](#2-escopo-do-mvp)
3. [Fluxo do usuário](#3-fluxo-do-usuário)
4. [Conteúdo do quiz (10 perguntas)](#4-conteúdo-do-quiz-10-perguntas)
5. [Gabarito canônico](#5-gabarito-canônico)
6. [Motor de cálculo do resultado](#6-motor-de-cálculo-do-resultado)
7. [Os 12 resultados](#7-os-12-resultados)
8. [Captura de lead e LGPD](#8-captura-de-lead-e-lgpd)
9. [Modelo de dados (Supabase)](#9-modelo-de-dados-supabase)
10. [Edge Function `submit-quiz`](#10-edge-function-submit-quiz)
11. [Analytics (GA4)](#11-analytics-ga4)
12. [Arquitetura e deploy](#12-arquitetura-e-deploy)
13. [Design e UI](#13-design-e-ui)
14. [Estados de erro e edge cases](#14-estados-de-erro-e-edge-cases)
15. [Fora de escopo / Fase 2](#15-fora-de-escopo--fase-2)
16. [Pendências (TBD)](#16-pendências-tbd)
17. [Critérios de aceite](#17-critérios-de-aceite)

---

## 1. Objetivo e contexto

Quiz de 10 casos clínicos hipotéticos que mede **como a terapeuta lê um atendimento** — não a técnica que ela usa. Cada alternativa mapeia para um de quatro padrões de raciocínio:

| Sigla | Padrão | Natureza |
|---|---|---|
| **FP** | Fechamento Precoce | ponto de atenção |
| **VC** | Viés de Confirmação | ponto de atenção |
| **TE** | Teoria como Evidência | ponto de atenção |
| **LI** | Leitura Investigativa | padrão desejável |

**Função no funil:** peça de topo. A pessoa responde, deixa **nome + WhatsApp + e-mail** (obrigatório) para ver a leitura do seu perfil, e é convidada a destravar o ponto no **Efeito Alta Permissão**.

**Princípios de produto (do briefing):**

- **Nunca** mostrar "resposta certa" depois de cada pergunta.
- **Nunca** mostrar placar ("7/10") nem nota. Passa sensação de prova.
- Frase do resultado: **"Seu jeito de ler um caso tende mais para: \_\_\_\_\_\_"**.
- A legenda FP/VC/TE/LI e os comentários editoriais dos documentos-fonte (ex: *"Essa é uma das que eu manteria obrigatoriamente"*, comentários dos Casos 7 e 9) são **internos** — não aparecem para a pessoa.

---

## 2. Escopo do MVP

**Inclui:**

- App React de tela única (SPA) com abertura, 10 perguntas, gate de dados e tela de resultado.
- Cálculo do resultado no servidor (fonte de verdade), com 12 variações de resultado.
- Gravação do lead no Supabase (nome, WhatsApp, e-mail, respostas, resultado, UTM, consentimento).
- Bloqueio de refazer: mesmo e-mail ou telefone → mostra o resultado anterior, não cria novo registro.
- Botão final para `https://www.missaoconsciencia.com.br/eap#quiz-ig`.
- GA4 (`G-Y98DTB03J4`) com eventos de funil.
- Servido em `www.missaoconsciencia.com.br/quiz`.

**Não inclui (ver [Fase 2](#15-fora-de-escopo--fase-2)):** envio do resultado por WhatsApp ou e-mail, painel de admin, compartilhamento social com imagem por resultado, A/B testing, integração com CRM/ferramenta de e-mail.

> O telefone é coletado e guardado no MVP, mas **não é usado para enviar nada** por enquanto. Fica disponível para a Fase 2.

---

## 3. Fluxo do usuário

```
[1. Abertura] → [2. Pergunta 1] → ... → [2. Pergunta 10] → [3. Gate de dados] → [4. Resultado] → (botão) → EAP
```

### Tela 1 — Abertura

- Título curto + parágrafo introdutório (texto exato):
  > Não importa se você trabalha principalmente com conversa, corpo, técnicas energéticas, práticas integrativas ou uma mistura de abordagens. Aqui não estamos avaliando a técnica que você usa. Estamos olhando para o que você faz com aquilo que percebe durante um atendimento.
- Botão **"Começar"**.
- Tempo estimado ("2 minutos") — opcional.
- Dispara evento `quiz_start` ao avançar.

### Tela 2 — Perguntas 1 a 10 (uma por tela)

- Indicador de progresso: **"Pergunta X de 10"** + barra.
- Enunciado do caso com a formatação preservada (falas da cliente em destaque/citação).
- 4 alternativas (A–D) como *radio buttons*, **na ordem em que estão no documento** (sem embaralhar em runtime — a distribuição dos padrões entre as letras já é variada por design).
- Botão **"Voltar"** (oculto na Pergunta 1) e **"Próxima"** (desabilitado enquanto nenhuma alternativa estiver marcada).
- Na Pergunta 10 o botão é **"Ver resultado"** → vai para o gate.
- A pessoa pode voltar e trocar respostas livremente **antes de enviar o gate**.
- Respostas mantidas em memória + `sessionStorage` (resiste a refresh).
- Ao completar as 10: evento `quiz_completed`.

### Tela 3 — Gate de dados (obrigatório)

- Headline: algo como *"Falta um passo para ver a sua leitura."*
- Campos:
  - **Nome** (texto, 2–120 caracteres)
  - **WhatsApp** (máscara BR: `(00) 00000-0000`)
  - **E-mail**
  - **Checkbox de consentimento LGPD** (obrigatório) — texto e link de política em [§8](#8-captura-de-lead-e-lgpd)
- Campo *honeypot* oculto (anti-bot).
- Botão **"Ver meu resultado"** → chama a Edge Function `submit-quiz`.
- Validação inline, mensagens de erro claras.
- **Não há como ver qualquer parte do resultado sem enviar este formulário** (gate duro).
- Sucesso → Tela 4. Erro → mensagem + retry (o resultado só aparece depois de persistir).
- Se a Edge Function responder `alreadyExists` → vai direto para o resultado anterior com a linha *"Você já fez este quiz — esta é a sua leitura."*

### Tela 4 — Resultado

- Linha fixa: **"Seu jeito de ler um caso tende mais para:"**
- Título grande do arquétipo (ver [§7](#7-os-12-resultados)).
- Corpo do resultado.
- Bloco **"No Efeito Alta Permissão…"**.
- **Botão CTA** (destaque): texto sugerido *"Quero destravar isso no Efeito Alta Permissão"* → navega para `https://www.missaoconsciencia.com.br/eap#quiz-ig` (link puro, sem parâmetros adicionais — os parâmetros já estão embutidos no destino; mesma aba).
- Evento `quiz_result_viewed` ao renderizar; `cta_eap_click` no clique.
- **Sem** placar, **sem** gabarito, **sem** "resposta certa".

---

## 4. Conteúdo do quiz (10 perguntas)

O texto integral dos 10 casos está em `Quiz Perguntas.md`. Observações de implementação:

- Usar o enunciado **exatamente** como no documento (corrigindo apenas os caracteres corrompidos de codificação).
- **Não** exibir rótulos "Caso N" nem a sigla `[FP]/[VC]/[TE]/[LI]` que aparece ao lado das alternativas no documento — essa sigla é o gabarito interno.
- **Não** exibir os comentários editoriais entre os casos.
- O "Caso 5" aparece no documento sem número consistente — é a **Pergunta 5**.

Estrutura de dados sugerida (`src/data/questions.ts`):

```ts
type Option = { id: 'A' | 'B' | 'C' | 'D'; text: string };
type Question = { number: number; scenario: string; options: Option[] };
```

O `scenario` pode conter marcação leve (negrito/citação) — renderizar como rich text controlado, não HTML livre.

---

## 5. Gabarito canônico

Mapa **letra → padrão**, extraído de `Quiz Perguntas.md`. É a **fonte de verdade** e vive no servidor (Edge Function). O cliente nunca envia o padrão, só a letra escolhida.

| Pergunta | A | B | C | D |
|---|---|---|---|---|
| 1 | FP | LI | TE | VC |
| 2 | VC | FP | LI | TE |
| 3 | LI | TE | FP | VC |
| 4 | TE | VC | LI | FP |
| 5 | FP | VC | TE | LI |
| 6 | LI | VC | TE | FP |
| 7 | TE | FP | LI | VC |
| 8 | VC | FP | LI | TE |
| 9 | LI | FP | VC | TE |
| 10 | TE | FP | VC | LI |

**Propriedades verificadas:**

- Cada pergunta tem exatamente **uma** alternativa de cada padrão → a contagem de qualquer padrão vai de 0 a 10, e "tudo LI" (ou tudo de qualquer padrão) é possível.
- A posição de cada padrão varia entre as letras ao longo das 10 perguntas (LI cai em B, C, A, C, D, A, C, C, A, D). Nenhuma edição futura pode fazer um padrão ficar sempre na mesma letra.

```ts
// src/data/answerKey.ts  (cópia idêntica no servidor)
export const ANSWER_KEY = {
  1:  { A:'FP', B:'LI', C:'TE', D:'VC' },
  2:  { A:'VC', B:'FP', C:'LI', D:'TE' },
  3:  { A:'LI', B:'TE', C:'FP', D:'VC' },
  4:  { A:'TE', B:'VC', C:'LI', D:'FP' },
  5:  { A:'FP', B:'VC', C:'TE', D:'LI' },
  6:  { A:'LI', B:'VC', C:'TE', D:'FP' },
  7:  { A:'TE', B:'FP', C:'LI', D:'VC' },
  8:  { A:'VC', B:'FP', C:'LI', D:'TE' },
  9:  { A:'LI', B:'FP', C:'VC', D:'TE' },
  10: { A:'TE', B:'FP', C:'VC', D:'LI' },
} as const;
```

---

## 6. Motor de cálculo do resultado

### Regras (definidas pela Isa)

1. Se `LI >= 9` (9 ou 10 respostas LI) → resultado **LI Especial** (`LI_ALL`). Com `LI == 8` ou menos, valem as regras normais (LI ainda pode virar o resultado puro `LI` se dominar por 2+).
2. Se o 1º colocado tem **2 ou mais** respostas de vantagem sobre o 2º → **resultado puro** do 1º colocado.
3. Se 1º e 2º estão **empatados ou separados por 1** → **resultado híbrido** dos dois primeiros colocados.
4. Ordem de prioridade para desempate na seleção das categorias: **FP > VC > TE > LI**. É só critério de desempate — não representa gravidade nem pontua a mais.

O rótulo do híbrido é sempre escrito na sequência canônica **FP → VC → TE → LI** (ex.: se os dois primeiros são VC e FP, o resultado é `FP_VC`, exibido como "FP + VC").

### Pseudocódigo

```ts
const PRIORITY = { FP: 0, VC: 1, TE: 2, LI: 3 };
const LABEL_ORDER = ['FP', 'VC', 'TE', 'LI'];

function computeResult(counts /* {FP,VC,TE,LI}, soma = 10 */) {
  if (counts.LI >= 9) return { code: 'LI_ALL', type: 'special' };

  const entries = ['FP', 'VC', 'TE', 'LI'].map(k => [k, counts[k]]);
  // ordena por contagem desc; empate → prioridade asc
  entries.sort((a, b) => b[1] - a[1] || PRIORITY[a[0]] - PRIORITY[b[0]]);

  const [c1, v1] = entries[0];
  const [c2, v2] = entries[1];

  if (v1 - v2 >= 2) {
    return { code: c1, type: 'pure' }; // 'FP' | 'VC' | 'TE' | 'LI'
  }
  const pair = [c1, c2].sort((a, b) => LABEL_ORDER.indexOf(a) - LABEL_ORDER.indexOf(b));
  return { code: pair.join('_'), type: 'hybrid' }; // ex: 'FP_VC'
}
```

### Tabela de exemplos (casos de teste)

| FP | VC | TE | LI | Resultado | Motivo |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 10 | `LI_ALL` | regra 1 (LI ≥ 9) |
| 0 | 1 | 0 | 9 | `LI_ALL` | regra 1 (LI ≥ 9) |
| 0 | 1 | 1 | 8 | `LI` (puro) | LI = 8 → regras normais; 8−1 = 7 |
| 10 | 0 | 0 | 0 | `FP` (puro) | v1−v2 = 10 |
| 6 | 2 | 1 | 1 | `FP` (puro) | 6−2 = 4 |
| 5 | 3 | 1 | 1 | `FP` (puro) | 5−3 = 2 |
| 5 | 4 | 1 | 0 | `FP_VC` | 5−4 = 1 |
| 4 | 4 | 1 | 1 | `FP_VC` | empate |
| 4 | 3 | 2 | 1 | `FP_VC` | 4−3 = 1 |
| 4 | 2 | 2 | 2 | `FP` (puro) | 4−2 = 2 (triplo empate no 2º é irrelevante) |
| 3 | 3 | 3 | 1 | `FP_VC` | empate triplo no 1º → prioridade FP, VC |
| 3 | 3 | 1 | 3 | `FP_VC` | FP, VC, LI empatados → prioridade FP, VC |
| 3 | 1 | 3 | 3 | `FP_TE` | FP, TE, LI empatados → prioridade FP, TE |
| 1 | 3 | 3 | 3 | `VC_TE` | VC, TE, LI empatados → prioridade VC, TE |
| 2 | 3 | 2 | 3 | `VC_LI` | VC e LI empatados no 1º (3 cada) |
| 0 | 0 | 3 | 7 | `LI` (puro) | 7−3 = 4 → resultado LI investigativa (#4), **não** o especial |
| 1 | 1 | 1 | 7 | `LI` (puro) | 7−1 = 6 |

### Nota de reconciliação — "pergunta extra de desempate"

A regra 4 original mencionava uma pergunta extra de desempate *"se houver empate que impeça identificar quais são as duas categorias principais"*. Com **10 respostas obrigatórias** e a **ordem de prioridade estrita FP > VC > TE > LI**, o motor **sempre** resolve — nunca fica ambíguo. Portanto, no MVP **não existe pergunta extra**; a prioridade resolve todos os empates.

Se no futuro a Isa quiser que empate triplo no 1º lugar (`v1 == v2 == v3`) abra uma 11ª pergunta em vez de aplicar a prioridade, é um *toggle* simples de adicionar depois. Fica anotado, mas **não é comportamento do MVP**.

---

## 7. Os 12 resultados

`result_code` → conteúdo. Texto revisado a partir de `Quiz Resultados.md` (correção de caracteres corrompidos, frase duplicada e pontuação; voz preservada). Todos terminam com o bloco "No Efeito Alta Permissão…" e a tela sempre traz o botão para o EAP.

> Estrutura sugerida (`src/data/results.ts`): `{ code, kind: 'pure'|'hybrid'|'special', headline, body: string[], eapBlock: string }`.

---

### `FP` — Fechamento Precoce

**Você pega a ideia rápido. Às vezes rápido demais.**

Você tem facilidade para ouvir uma história e perceber rapidamente o que pode estar acontecendo por trás dela. Isso é uma qualidade.

O risco aparece quando uma explicação que **faz sentido** ganha força de resposta antes de você ter informação suficiente para saber se é realmente aquilo.

- A cliente fala de dinheiro e você já vê culpa.
- Uma reação aparece no corpo e você já atribui um significado.
- Algo chama sua atenção durante uma técnica e você já entende aquilo como a origem do problema.

Às vezes você acerta. Mas acertar algumas vezes pode deixar esse hábito ainda mais difícil de perceber.

**Seu próximo passo:** aprender a reconhecer o momento exato em que uma boa percepção começa a virar uma conclusão precoce.

*No Efeito Alta Permissão, a gente vai olhar para esse ponto exato: como perceber quando uma boa leitura começa a virar certeza cedo demais — e o que fazer para continuar avançando sem jogar fora a sua percepção.*

---

### `VC` — Viés de Confirmação

**Você encontra uma pista. E começa a segui-la.**

Quando alguma coisa chama sua atenção em um atendimento, você sabe aprofundar.

O problema é mais sutil: às vezes, depois que uma ideia aparece, você começa a prestar mais atenção justamente nas coisas que combinam com ela.

- Você pensa em rejeição e começa a notar sinais de rejeição.
- Percebe algo relacionado à mãe e passa a enxergar outros elementos ligados à mãe.
- Interpreta uma sensação de determinada forma e começa a encontrar outras coisas que parecem confirmar essa leitura.

E quanto mais encontra, mais parece que sua primeira impressão estava certa.

**Seu próximo passo** é aprender a continuar explorando sem deixar que a primeira ideia escolha o que você vai procurar depois.

*No Efeito Alta Permissão, a gente vai olhar para como conduzir o atendimento de um jeito que também deixe aparecer aquilo que não combina com a sua primeira impressão.*

---

### `TE` — Teoria como Evidência

**Você tem repertório. E ele pode te enganar.**

Você estudou muito. Conhece padrões, conceitos, métodos, mapas, dinâmicas e jeitos de interpretar o que acontece em um atendimento. Por isso, quando alguma coisa acontece, seu cérebro logo encontra uma explicação conhecida. Isso é bagagem profissional.

Mas tem um perigo aí: quanto mais familiar e redondinha parece uma explicação, mais fácil é esquecer que ela ainda precisa bater com a realidade daquela pessoa específica.

Uma explicação pode fazer todo sentido dentro da abordagem que você usa e, mesmo assim, não explicar o que de fato está acontecendo ali.

**Seu próximo passo** é aprender a usar tudo o que você sabe sem tentar encaixar a cliente à força no seu conhecimento.

*No Efeito Alta Permissão, a gente vai olhar de perto para como usar a sua bagagem sem transformar uma explicação conhecida em uma resposta automática.*

---

### `LI` — Leitura Investigativa

**Você sabe ficar no "ainda não sei".**

Isso mostra uma habilidade que muita gente perde quando ganha experiência: **você consegue ouvir uma história sem a pressa de decidir na hora o que ela significa.**

Você não toma a primeira percepção como resposta. Procura entender melhor o contexto e observa o que mais aparece. Sabe que duas histórias parecidas podem ter motivos totalmente diferentes.

Esse é um ótimo ponto de partida. Mas aqui está o seu próximo nível: **não basta apenas evitar conclusões apressadas. Você também precisa saber a hora em que já tem informação suficiente para montar um caminho e agir.** Até porque o outro extremo também acontece: ficar só perguntando e nunca transformar informação em direção.

*No Efeito Alta Permissão, a gente vai olhar para como sair do "ainda não sei" e chegar a uma direção com critério: quando continuar perguntando, quando testar uma leitura, quando abandonar uma ideia e quando já existe base suficiente para seguir. Ou seja: você já aprendeu a não ter pressa pela resposta. Agora precisa dominar o caminho até ela.*

---

### `LI_ALL` — Leitura Investigativa (LI ≥ 9)

> **Sem título/headline.** Texto exatamente como a Isa enviou em `Quiz Resultados.md` (resultado #5). Não inventar cabeçalho.

**Seu resultado mostra uma ótima tendência: você evitar se precipitar e procura entender antes de tirar conclusões.**

Mas vale lembrar que este teste só mostra como você reagiu a 10 situações hipotéticas.

No dia a dia, sabemos que o jogo é outro.

Ali tem tempo correndo, emoção, pressão, identificação com a cliente, teorias que você já domina e momentos em que você simplesmente precisa escolher um caminho.

Você já tem o cuidado de não se precipitar.

**Agora, o seu próximo nível é aprender a fechar uma leitura ou uma linha de raciocínio sem depender de achismo, de hábito ou de uma explicação pronta.**

**No Efeito Alta Permissão, a gente vai olhar para como transformar esse cuidado que você já tem em um processo mais consistente: organizar o que aparece no atendimento, separar percepção de conclusão e chegar a uma leitura que você consiga sustentar sem depender de achismo, hábito ou explicação pronta.**

---

### `FP_VC` — Fechamento Precoce + Viés de Confirmação

**Você chega numa resposta rápido e depois começa a encontrar provas dela.**

Seu olhar é ágil. Você percebe uma possibilidade cedo e sabe fazer perguntas para aprofundá-la.

O problema é que essas duas qualidades juntas podem criar uma armadilha: você escolhe uma direção cedo e, sem perceber, começa a encontrar cada vez mais motivos para continuar nela. Quanto mais pergunta, mais a história parece confirmar o que você pensou.

**Seu próximo passo:** aprender a fazer perguntas que também deem a chance de mostrar que você estava errada.

*No Efeito Alta Permissão, a gente vai olhar para como quebrar esse ciclo: perceber quando você escolheu uma resposta cedo demais e continuar conduzindo o atendimento de um jeito que também possa mostrar que sua primeira ideia estava errada.*

---

### `FP_TE` — Fechamento Precoce + Teoria como Evidência

**Você reconhece padrões muito rápido.**

Você conhece explicações para aquilo que aparece no atendimento e tem facilidade para reconhecer padrões semelhantes.

Isso pode dar muita segurança. Mas também pode criar uma sensação perigosa: a de que "eu já sei o que é isso". A teoria te dá uma explicação, a história da cliente parece se encaixar perfeitamente e pronto, caso resolvido.

Só que duas pessoas podem ter comportamentos parecidos por motivos totalmente diferentes.

**Seu próximo passo:** aprender a usar a sua bagagem para abrir novas possibilidades, e não para dar o caso por encerrado.

*No Efeito Alta Permissão, a gente vai olhar para como usar o seu repertório sem deixar que ele encerre o caso antes da hora — transformando padrões conhecidos em possibilidades para explorar, e não em respostas automáticas.*

---

### `FP_LI` — Fechamento Precoce + Leitura Investigativa

**Uma parte sua quer entender. Outra já quer responder.**

O seu resultado mostra um vaivém interessante. Em algumas situações você sustenta muito bem o "ainda não sei". Em outras, quando uma explicação parece fazer muito sentido, você fecha o raciocínio rápido demais.

Isso significa que o problema não é a sua capacidade, mas sim a consistência.

**Seu próximo passo** é perceber o que faz você deixar a cautela de lado em certos tipos de caso. Até porque um bom critério precisa funcionar mesmo quando a história mexe com as suas próprias certezas.

*No Efeito Alta Permissão, a gente vai olhar para o que faz você manter o "ainda não sei" em alguns casos e abandoná-lo em outros, para que o seu critério continue funcionando mesmo quando uma explicação parece fazer sentido rápido demais.*

---

### `VC_TE` — Viés de Confirmação + Teoria como Evidência

**Sua teoria pode estar escolhendo suas perguntas.**

Você tem bagagem e sabe ir fundo em uma linha de raciocínio.

O ponto de atenção é quando uma teoria sugere o que procurar e suas perguntas começam justamente a encontrar aquilo. A teoria diz que tal comportamento vem da mãe. Você pergunta sobre a mãe. A cliente lembra de histórias com a mãe. E pronto: parece que a teoria foi comprovada. Percebe o ciclo?

**Seu próximo passo:** aprender a fazer perguntas que tragam descobertas que a sua teoria nem imaginava.

*No Efeito Alta Permissão, a gente vai olhar para como impedir que uma explicação conhecida escolha por você o que merece atenção — ajudando você a perceber também aquilo que não estava previsto na sua primeira leitura.*

---

### `VC_LI` — Viés de Confirmação + Leitura Investigativa

**Você sabe perguntar. Mas às vezes já sabe o que espera ouvir.**

Você tem uma postura aberta e costuma querer entender melhor antes de concluir.

Só que existe uma sutileza: algumas perguntas aparentemente abertas podem carregar uma direção escondida. *"Quando você começou a sentir que precisava agradar sua mãe?"* é uma pergunta — mas ela já decidiu que você precisava agradar sua mãe.

**Seu próximo passo** é refinar suas perguntas para que elas realmente descubram algo, em vez de apenas aprofundarem uma ideia previamente escolhida.

*No Efeito Alta Permissão, a gente vai olhar para essas pequenas suposições que podem entrar nas perguntas, nas interpretações e até na forma como você conduz uma técnica — para que exista espaço real para aparecer algo diferente do que você esperava.*

---

### `TE_LI` — Teoria como Evidência + Leitura Investigativa

**Você tem repertório e sabe segurar a resposta.**

Essa é uma combinação ótima porque você não tem aquela pressa de encaixar tudo em uma explicação. Ao mesmo tempo, você conhece muitos modelos e consegue enxergar várias possibilidades.

O risco aqui é outro: confundir uma explicação super elaborada com uma explicação que tem base de verdade. Uma teoria bem amarrada sempre convence mais fácil.

**Seu próximo passo** é desenvolver critérios para decidir qual possibilidade merece continuar sendo considerada e qual precisa ser abandonada. Porque ter infinitas possibilidades também não resolve um caso — é preciso saber separar uma boa ideia de um raciocínio que realmente se sustenta na prática.

*No Efeito Alta Permissão, a gente vai olhar para como escolher entre várias explicações possíveis: o que merece continuar sendo considerado, o que precisa ser descartado e o que faz uma leitura deixar de ser apenas interessante para realmente se sustentar naquele caso.*

---

## 8. Captura de lead e LGPD

### Campos e validação

| Campo | Regra |
|---|---|
| Nome | obrigatório, 2–120 caracteres, sem só espaços |
| WhatsApp | obrigatório, máscara `(00) 00000-0000`, normalizado para E.164 `+55DDDNÚMERO` no servidor; DDD válido; 10–11 dígitos nacionais |
| E-mail | obrigatório, regex de e-mail, normalizado (trim + lowercase) |
| Consentimento | checkbox obrigatório; sem marcar, botão bloqueado |
| Honeypot | campo oculto; se preenchido, requisição descartada silenciosamente |

### Texto do consentimento (rascunho)

> Autorizo a Missão Consciência a armazenar meus dados e entrar em contato por e-mail e WhatsApp sobre o Efeito Alta Permissão e conteúdos relacionados. Posso pedir a remoção a qualquer momento. Ao continuar, concordo com a [Política de Privacidade](TBD).

- `consent_lgpd = true` e `consent_at = now()` gravados no registro.
- Link da Política de Privacidade: **placeholder `TBD`** até a Isa passar a URL.
- Não armazenar IP em texto puro — usar hash (ver [§9](#9-modelo-de-dados-supabase)).

---

## 9. Modelo de dados (Supabase)

### Tabela `quiz_leads`

```sql
create table public.quiz_leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  name              text not null,
  email             text not null,
  email_normalized  text not null,          -- trim + lowercase (dedup)
  phone_e164        text not null,          -- +55DDDNUMERO
  phone_normalized  text not null,          -- só dígitos (dedup)

  answers           jsonb not null,         -- [{ "q":1, "option":"B" }, ...] (10 itens)
  counts            jsonb not null,         -- { "FP":3, "VC":2, "TE":2, "LI":3 }
  result_code       text not null,          -- FP | VC | TE | LI | LI_ALL | FP_VC | FP_TE | FP_LI | VC_TE | VC_LI | TE_LI
  result_type       text not null,          -- pure | hybrid | special

  consent_lgpd      boolean not null default false,
  consent_at        timestamptz,

  utm               jsonb,                  -- { source, medium, campaign, term, content }
  referrer          text,
  landing_path      text,
  user_agent        text,
  ga_client_id      text,                   -- para casar com GA4, se disponível
  ip_hash           text                    -- sha256(ip + salt), para rate limiting
);

create unique index quiz_leads_email_uidx on public.quiz_leads (email_normalized);
create index quiz_leads_phone_idx        on public.quiz_leads (phone_normalized);
create index quiz_leads_created_idx      on public.quiz_leads (created_at desc);
create index quiz_leads_result_idx       on public.quiz_leads (result_code);

alter table public.quiz_leads enable row level security;
-- Nenhuma policy para os papéis anon/authenticated:
-- todo acesso de escrita/leitura passa pela Edge Function com service_role.
```

### Constraints de valor (opcional, recomendado)

```sql
alter table public.quiz_leads
  add constraint quiz_leads_result_code_chk check (result_code in
    ('FP','VC','TE','LI','LI_ALL','FP_VC','FP_TE','FP_LI','VC_TE','VC_LI','TE_LI')),
  add constraint quiz_leads_result_type_chk check (result_type in ('pure','hybrid','special'));
```

### Segurança

- **RLS ligado, sem policies para anon** → a tabela não é legível nem gravável com a chave pública. Isso impede scraping da lista de leads e insert de spam fora da função.
- A Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` (injetada automaticamente no ambiente da função) para inserir.
- A chave `anon` do projeto é usada só como *bearer* para **chamar** a função — é pública por design.

---

## 10. Edge Function `submit-quiz`

**Rota:** `POST /functions/v1/submit-quiz`

### Request (JSON)

```jsonc
{
  "name": "Fulana de Tal",
  "email": "fulana@email.com",
  "phone": "(11) 99999-8888",
  "answers": [
    { "q": 1, "option": "B" }, { "q": 2, "option": "C" }, /* ... 10 itens ... */
  ],
  "consent_lgpd": true,
  "utm": { "source": "ig", "medium": "bio", "campaign": "quiz" },
  "referrer": "https://instagram.com/",
  "landing_path": "/quiz",
  "ga_client_id": "1234567890.1234567890",
  "hp": ""            // honeypot — precisa vir vazio
}
```

### Processamento

1. **Anti-bot:** se `hp` não for vazio → responde `200 { ok: true }` sem gravar (silencioso).
2. **Rate limit:** `ip_hash = sha256(ip + SALT)`. Máximo **5** submissões por `ip_hash` por hora (consulta simples por `created_at`). Excedeu → `429`.
3. **Validação** de todos os campos ([§8](#8-captura-de-lead-e-lgpd)). `consent_lgpd !== true` → `422`. `answers` precisa ter exatamente 10 itens, `q` de 1 a 10 sem repetição, `option` em `A|B|C|D`.
4. **Cálculo no servidor:** para cada resposta, `tag = ANSWER_KEY[q][option]` → soma `counts` → `computeResult(counts)` ([§6](#6-motor-de-cálculo-do-resultado)). **Os padrões nunca vêm do cliente.**
5. **Normalização:** `email_normalized`, `phone_e164`, `phone_normalized`.
6. **Dedup / bloqueio de refazer:** busca registro com `email_normalized` **ou** `phone_normalized` iguais.
   - Achou → responde `200 { ok: true, alreadyExists: true, result_code, result_type }` **sem inserir**.
   - Não achou → insere e responde `200 { ok: true, alreadyExists: false, result_code, result_type }`.
7. Em corrida (violação do índice único de e-mail no insert) → tratar como "já existe" e retornar o registro existente.

### Response

```jsonc
{ "ok": true, "alreadyExists": false, "result_code": "FP_VC", "result_type": "hybrid" }
```

O **conteúdo** de cada resultado ([§7](#7-os-12-resultados)) vive no bundle do cliente, indexado por `result_code` — não é sensível e evita um round-trip. A função devolve só o código.

### Erros

| HTTP | Quando | Corpo |
|---|---|---|
| 422 | validação falhou | `{ ok:false, error:"validation", fields:{...} }` |
| 429 | rate limit | `{ ok:false, error:"rate_limited" }` |
| 500 | erro interno | `{ ok:false, error:"server" }` |

O cliente **não mostra o resultado** enquanto não receber `ok: true`. Em `429/500`, mostra mensagem + botão "Tentar de novo".

### Variáveis de ambiente

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — automáticas no runtime da função.
- `IP_HASH_SALT` — segredo, definido manualmente.

---

## 11. Analytics (GA4)

**ID de medição:** `G-Y98DTB03J4`

### O snippet vai no app do quiz? **Sim.**

O quiz é um deploy React separado (ver [§12](#12-arquitetura-e-deploy)). Mesmo servido sob `www.missaoconsciencia.com.br/quiz`, ele **não herda** a tag GA do site principal — é outro bundle. Então o `gtag.js` entra no `index.html` do quiz:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Y98DTB03J4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-Y98DTB03J4', { send_page_view: false });
</script>
```

`send_page_view: false` + disparo manual de `page_view` a cada troca de "tela" (SPA), para o funil aparecer direito no GA4.

> Sobre colocar o mesmo script no site principal ("na mãe"): é decisão separada, fora deste projeto. Não é necessário para o quiz funcionar/medir. Se o site principal já tem GA próprio, não misturar IDs sem intenção.

### Eventos

| Evento | Quando | Parâmetros |
|---|---|---|
| `page_view` | troca de tela (abertura, `q1`…`q10`, `dados`, `resultado`) | `page_path` sintético |
| `quiz_start` | clique em "Começar" | — |
| `quiz_question_answered` | resposta marcada | `question_number` |
| `quiz_completed` | 10ª resposta dada | — |
| `generate_lead` | `submit-quiz` retornou `ok:true` | `result_code`, `result_type`, `already_exists` |
| `quiz_result_viewed` | tela de resultado renderizada | `result_code` |
| `cta_eap_click` | clique no botão para o EAP | `result_code` |

`generate_lead` é o nome de evento recomendado do GA4 para conversão de lead — marcar como conversão no painel.

---

## 12. Arquitetura e deploy

```
Navegador
   │
   ├─ GET www.missaoconsciencia.com.br/quiz  ──(rewrite Vercel)──►  app React (projeto "mc-quiz" na Vercel)
   │
   └─ POST .../functions/v1/submit-quiz  ─────────────────────────►  Supabase Edge Function ──► Postgres (quiz_leads)
```

### Abordagem definida: projeto Vercel separado + rewrite no site principal

Contexto confirmado pela Isa: o site principal já está na Vercel, sob controle dela, publicado via `git push` no repositório (deploys feitos a partir do Cursor). Então o caminho é:

1. **Novo repositório + projeto Vercel para o quiz** (`mc-quiz`). Deploys independentes do site principal — mexer no quiz nunca arrisca o site.
2. Quiz em Vite com `base: '/quiz/'` e React Router com `basename="/quiz"`. O `vercel.json` do próprio quiz manda todas as rotas para o `index.html` (SPA):

```json
// vercel.json — repositório do QUIZ
{
  "rewrites": [{ "source": "/quiz/(.*)", "destination": "/index.html" }]
}
```

3. **No repositório do site principal**, adicionar (ou complementar) o `vercel.json` com o encaminhamento para o quiz:

```json
// vercel.json — repositório do SITE PRINCIPAL
{
  "rewrites": [
    { "source": "/quiz",       "destination": "https://mc-quiz.vercel.app/quiz" },
    { "source": "/quiz/(.*)",  "destination": "https://mc-quiz.vercel.app/quiz/$1" }
  ]
}
```

4. `git push` no site principal → a Vercel publica → `www.missaoconsciencia.com.br/quiz` passa a servir o app do quiz, sem expor o domínio `mc-quiz.vercel.app` e sem subdomínio.

Ordem de execução: publicar o `mc-quiz` primeiro (confirmar que `https://mc-quiz.vercel.app/quiz` abre), depois adicionar o rewrite no site principal.

> Se o site principal **já tiver** um `vercel.json` com `rewrites`, é só acrescentar as duas linhas do `/quiz` ao array existente — não substituir o arquivo.

### Variáveis de ambiente (app)

| Var | Uso |
|---|---|
| `VITE_SUPABASE_URL` | base para chamar a Edge Function |
| `VITE_SUPABASE_ANON_KEY` | *bearer* da chamada à função (pública) |
| `VITE_GA_ID` | `G-Y98DTB03J4` |
| `VITE_EAP_URL` | `https://www.missaoconsciencia.com.br/eap#quiz-ig` |

### Estrutura de pastas sugerida

```
src/
  data/        questions.ts · answerKey.ts · results.ts
  lib/         scoring.ts (espelho do server) · analytics.ts · phone.ts · storage.ts
  screens/     Intro.tsx · Question.tsx · LeadGate.tsx · Result.tsx
  components/  ProgressBar.tsx · OptionList.tsx · Button.tsx · Field.tsx
  App.tsx · router.tsx · theme.css
supabase/
  functions/submit-quiz/index.ts
  migrations/0001_quiz_leads.sql
vercel.json
```

---

## 13. Design e UI

O quiz **usa o mesmo padrão visual da página do EAP** (`https://www.missaoconsciencia.com.br/eap`) — mesmas cores, fontes, estilo de botão e tom de escrita. Deve parecer parte da mesma peça.

### Design tokens (extraídos da página do EAP)

```css
:root {
  /* superfícies */
  --bg:            #202020;   /* fundo padrão — charcoal quase preto */
  --surface-cream: #F8F0DF;   /* seções claras / cards de destaque */

  /* texto */
  --text:          #F8F0DF;   /* texto sobre fundo escuro */
  --text-strong:   #FFFFFF;   /* títulos sobre fundo escuro */
  --text-on-cream: #202020;   /* texto sobre seção clara */
  --text-muted:    rgba(248, 240, 223, 0.6);

  /* acentos */
  --accent-lime:   #D1FF03;   /* CTA principal — verde-limão */
  --accent-red:    #E90000;   /* ênfase, ícones, palavras destacadas */
  --accent-brown:  #9A6848;   /* detalhe quente / bordas decorativas */

  /* forma */
  --radius:        6px;
  --maxw:          640px;

  /* tipografia */
  --font-sans:  "Encode Sans Condensed", "Arial Narrow", system-ui, sans-serif;
  --font-serif: "Instrument Serif", Georgia, serif;
}
```

- Fontes via Google Fonts: **Encode Sans Condensed** (pesos 300, 400, 600, 700) e **Instrument Serif** (400). `font-display: swap`, com fallback declarado.
- `--font-serif` é decorativo — usar com parcimônia (ex.: aspas grandes, um eventual destaque). O corpo e a maioria dos títulos são `--font-sans`.

### Tipografia (escala da página do EAP)

| Uso | Fonte | Tamanho | Peso | Tracking |
|---|---|---|---|---|
| Título de resultado / headline de tela | sans | 32–40 px (desktop), 26–30 px (mobile) | 400, ocasional 600 | `-0.025em` |
| Enunciado do caso | sans | 20–22 px | 400 | normal |
| Corpo / alternativas | sans | 16–18 px, `line-height` ~1.6 | 400 | normal |
| Rótulos pequenos ("Pergunta 3 de 10") | sans | 13–14 px | 700 | `+0.02em`, `uppercase` |

### Botões

- CTA principal (EAP): fundo `--accent-lime`, texto `--text-on-cream`, **maiúsculas**, peso 700, `border-radius: 6px`, padding ~`14px 24px`, `letter-spacing: 0.4px`. Largura total no mobile.
- Botão "Próxima" / "Começar": mesmo estilo do CTA principal.
- Botão "Voltar": fantasma — sem fundo, borda 1px `--text-muted` ou só texto sublinhado, `--text`.
- Alvo de toque ≥ 44 px. Estado desabilitado: opacidade 0.4, sem cursor.

### Layout e comportamento

- Mobile-first, coluna única, `max-width: 640px`, centralizada, respiro generoso nas laterais (≥ 20 px).
- Fundo `--bg` em todas as telas. Cards de alternativa podem usar um leve `rgba(255,255,255,0.04)` de fundo com borda `rgba(255,255,255,0.1)`; selecionado ganha borda `--accent-lime`.
- Barra de progresso fina no topo das telas de pergunta, preenchimento `--accent-lime`.
- Faixa/marca "EFEITO ALTA PERMISSÃO" discreta no topo (wordmark), como na página de vendas — reforça continuidade. Sem logo da Missão Consciência solto no MVP (não temos o arquivo; ver [§16](#16-pendências-tbd)).
- Transições curtas entre telas (fade/slide ~150 ms). Respeitar `prefers-reduced-motion`.
- **Tom de escrita:** frases curtas, muitas quebras de linha, direto e sem rodeio — o mesmo ritmo da página do EAP e das regras de escrita da Isa. Nada de gamificação, emoji, "parabéns!", nem barra de pontos.
- Acessibilidade: alternativas como `radiogroup` navegável por teclado, `label` clicável, foco visível (anel `--accent-lime`), contraste AA (cream sobre charcoal passa).

### SEO / compartilhamento

| Tag | Valor (rascunho) |
|---|---|
| `<title>` | Como você lê um caso? — Teste para terapeutas · Efeito Alta Permissão |
| `meta description` | Um teste rápido com 10 situações de atendimento para descobrir como você interpreta o que percebe numa sessão — e onde esse jeito de ler pode te trair. |
| `og:title` | Como você lê um caso? |
| `og:description` | 10 situações de atendimento. Sem certo ou errado — só o seu jeito de ler. |
| `og:image` | `TBD` — ver nota abaixo |
| `og:url` | `https://www.missaoconsciencia.com.br/quiz` |
| `twitter:card` | `summary_large_image` |
| `robots` | `TBD` — `index,follow` (achável no Google) ou `noindex,follow` (só por link) |

> **O que é a imagem OG:** quando alguém cola o link do quiz no WhatsApp, Instagram, Facebook ou Google, esses apps mostram um "cartão" de pré-visualização com uma imagem, título e descrição. Essa imagem é a `og:image` — um arquivo de **1200 × 630 px** com a arte do EAP (fundo charcoal, wordmark, uma frase). **Dá para lançar sem ela** (o cartão fica só com texto); é um item de acabamento. Se a Isa passar a imagem, é só apontar a tag para o arquivo.

---

## 14. Estados de erro e edge cases

| Situação | Comportamento |
|---|---|
| Refresh no meio do quiz | `sessionStorage` restaura a tela e as respostas |
| Refresh na tela de resultado | mantém o resultado (`result_code` em `sessionStorage`) |
| Tenta acessar `/quiz/resultado` sem ter completado | redireciona para a abertura |
| Tenta voltar e alterar respostas **depois** de enviar o gate | bloqueado — o quiz já foi enviado; mostra o resultado |
| Edge Function fora do ar / erro de rede | mensagem "Não consegui salvar agora. Tenta de novo." + botão retry; **não** mostra resultado |
| E-mail ou telefone já existe | mostra o resultado anterior + linha "Você já fez este quiz — esta é a sua leitura." |
| Rate limit (429) | "Muitas tentativas. Espera alguns minutos e tenta de novo." |
| JS desabilitado | `<noscript>` com aviso de que o teste precisa de JavaScript |
| Telefone digitado incompleto/estrangeiro | validação inline barra o envio |
| Pessoa fecha antes do gate | nenhum lead gravado (aceitável — o gate é a troca pelo resultado) |

---

## 15. Fora de escopo / Fase 2

Registrado para não se perder, **não** implementar agora:

1. **Resultado por WhatsApp.**
   - *Fase 2a (rápida):* botão "Receber no WhatsApp" com link `wa.me/55XXXXXXXXXXX?text=...` já preenchido com o `result_code` (ex.: *"quero minha leitura — perfil FP+VC"*). Custo zero, sem API, sem risco de bloqueio. Abre a janela de 24h de atendimento no número da Missão. Resposta manual da Isa nesse período.
   - *Fase 2b (automática):* WhatsApp Cloud API (Meta) disparada por uma Edge Function após o insert, com **1 template de utilidade** aprovado que injeta o resumo do perfil + link do EAP. Grátis até 1.000 conversas/mês, depois ~R$0,30/lead. Requer número dedicado à API, verificação do Business e aprovação do template.
   - O modelo de dados do MVP já guarda `phone_e164`, então virar a Fase 2 é adicionar a função + config, não reconstruir.
2. **Resultado por e-mail** (Edge Function + Resend/serviço transacional).
3. **Painel de admin** (leads recentes + distribuição de resultados). Por ora, painel do próprio Supabase.
4. **Compartilhar resultado** com card/OG dinâmico por `result_code`.
5. **A/B testing** de copy de abertura, do gate e dos CTAs.
6. **Integração com CRM / ferramenta de e-mail** (webhook no insert).
7. **11ª pergunta de desempate** (ver nota em [§6](#6-motor-de-cálculo-do-resultado)).

---

## 16. Pendências (TBD)

Nenhuma bloqueia a arquitetura; bloqueiam só acabamento visual/legal.

| # | Item | Status | Necessário para |
|---|---|---|---|
| 1 | Padrão visual (cores, fontes, botões) | **Resolvido** — usar o da página do EAP ([§13](#13-design-e-ui)) | Design |
| 2 | URL da Política de Privacidade | Pendente — Isa vai trazer. Link placeholder `TBD` no checkbox até lá | Checkbox LGPD |
| 3 | Título do resultado `LI_ALL` | **Resolvido** — sem título; texto verbatim de `Quiz Resultados.md` | Conteúdo |
| 4 | Limiar do `LI_ALL` | **Resolvido** — `LI ≥ 9` (9 ou 10) dispara o especial; `LI ≤ 8` segue regras normais | Cálculo |
| 5 | Número de WhatsApp oficial (E.164) | Pendente — só na Fase 2. Placeholder no MVP; telefone é coletado e guardado, mas nada é enviado | Fase 2 |
| 6 | Imagem OG (1200 × 630) com arte do EAP | Pendente — opcional, dá para lançar sem. Ver nota em [§13](#13-design-e-ui) | Cartão de compartilhamento |
| 7 | `index,follow` ou `noindex,follow` na página do quiz | Pendente — Isa decide se quer o quiz achável no Google ou só por link | SEO |
| 8 | Rewrite de `/quiz` no site principal | **Resolvido** — site na Vercel, controlado pela Isa, deploy por `git push`. Plano definido em [§12](#12-arquitetura-e-deploy) | Deploy na URL final |
| 9 | Textos finais de headline da abertura e do gate | Pendente — rascunhos no PRD, revisar com a voz do EAP | Conteúdo |

### Nota — pendências que sobram

Só faltam decisões de conteúdo/legal, nenhuma trava o desenvolvimento:

- **Política de Privacidade:** Isa vai trazer a URL. Até lá o checkbox usa link placeholder.
- **`robots`:** decidir entre `index,follow` (quiz achável no Google) e `noindex,follow` (só chega quem tem o link). Default do PRD, se não houver resposta: `noindex,follow` — é peça de campanha, não conteúdo pra ranquear.
- **Imagem OG:** opcional. Sem ela, o cartão de compartilhamento fica só com texto. Pode entrar depois sem mexer em código, só apontando a tag.

---

## 17. Critérios de aceite

- [ ] As 10 perguntas renderizam com o conteúdo exato de `Quiz Perguntas.md` (sem siglas de gabarito, sem comentários editoriais, sem rótulo "Caso N"), uma por tela, com barra de progresso "Pergunta X de 10".
- [ ] Não dá para avançar sem responder; dá para voltar e trocar respostas antes de enviar o gate.
- [ ] Em nenhum momento aparece "resposta certa", placar ou nota.
- [ ] A tela de resultado abre com "Seu jeito de ler um caso tende mais para:" seguido do arquétipo.
- [ ] Gate duro: sem nome + WhatsApp + e-mail + consentimento marcado, o resultado não aparece.
- [ ] O cálculo segue [§6](#6-motor-de-cálculo-do-resultado) e todos os casos da tabela de exemplos passam em teste automatizado.
- [ ] Os padrões (FP/VC/TE/LI) são recalculados no servidor a partir do gabarito canônico; o cliente só envia as letras.
- [ ] O lead é gravado em `quiz_leads` com `answers`, `counts`, `result_code`, `result_type`, `utm`, `consent_lgpd`, `consent_at`.
- [ ] Refazer com o mesmo e-mail **ou** telefone mostra o resultado anterior e **não** cria novo registro.
- [ ] O botão final leva para `https://www.missaoconsciencia.com.br/eap#quiz-ig`.
- [ ] GA4 (`G-Y98DTB03J4`) dispara `quiz_start`, `quiz_completed`, `generate_lead` e `cta_eap_click`; `generate_lead` marcado como conversão.
- [ ] RLS ligado em `quiz_leads`; a tabela não é acessível com a chave `anon`.
- [ ] Honeypot + rate limit por IP hash ativos na Edge Function.
- [ ] App acessível em `www.missaoconsciencia.com.br/quiz` (rewrite Vercel), responsivo, mobile-first.
- [ ] As 12 telas de resultado existem com a copy de [§7](#7-os-12-resultados) (revisada; `LI_ALL` é verbatim e sem título).
- [ ] `LI ≥ 9` cai em `LI_ALL`; `LI ≤ 8` segue as regras normais.
- [ ] Visual alinhado ao padrão da página do EAP (cores, fontes Encode Sans Condensed / Instrument Serif, botão limão).
- [ ] Refresh no meio do quiz e na tela de resultado não quebra o estado.
```
