import type { ResultCode, ResultType } from './scoring';

export type Result = {
  code: ResultCode;
  type: ResultType;
  name: string; // nome do arquétipo (ex: "Fechamento Precoce")
  headline?: string; // frase-punch grande; ausente no LI_ALL
  body: string[]; // parágrafos; **texto** vira negrito
  eap: string; // bloco "No Efeito Alta Permissão..."
};

export const EYEBROW = 'Seu jeito de ler um caso tende mais para:';

export const RESULTS: Record<ResultCode, Result> = {
  FP: {
    code: 'FP',
    type: 'pure',
    name: 'Fechamento Precoce',
    headline: 'Você pega a ideia rápido. Às vezes rápido demais.',
    body: [
      'Você tem facilidade para ouvir uma história e perceber rapidamente o que pode estar acontecendo por trás dela. Isso é uma qualidade.',
      'O risco aparece quando uma explicação que **faz sentido** ganha força de resposta antes de você ter informação suficiente para saber se é realmente aquilo.',
      'A cliente fala de dinheiro e você já vê culpa. Uma reação aparece no corpo e você já atribui um significado. Algo chama sua atenção durante uma técnica e você já entende aquilo como a origem do problema.',
      'Às vezes você acerta. Mas acertar algumas vezes pode deixar esse hábito ainda mais difícil de perceber.',
      '**Seu próximo passo:** aprender a reconhecer o momento exato em que uma boa percepção começa a virar uma conclusão precoce.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para esse ponto exato: como perceber quando uma boa leitura começa a virar certeza cedo demais — e o que fazer para continuar avançando sem jogar fora a sua percepção.',
  },

  VC: {
    code: 'VC',
    type: 'pure',
    name: 'Viés de Confirmação',
    headline: 'Você encontra uma pista. E começa a segui-la.',
    body: [
      'Quando alguma coisa chama sua atenção em um atendimento, você sabe aprofundar.',
      'O problema é mais sutil: às vezes, depois que uma ideia aparece, você começa a prestar mais atenção justamente nas coisas que combinam com ela.',
      'Você pensa em rejeição e começa a notar sinais de rejeição. Percebe algo relacionado à mãe e passa a enxergar outros elementos ligados à mãe. Interpreta uma sensação de determinada forma e começa a encontrar outras coisas que parecem confirmar essa leitura.',
      'E quanto mais encontra, mais parece que sua primeira impressão estava certa.',
      '**Seu próximo passo** é aprender a continuar explorando sem deixar que a primeira ideia escolha o que você vai procurar depois.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para como conduzir o atendimento de um jeito que também deixe aparecer aquilo que não combina com a sua primeira impressão.',
  },

  TE: {
    code: 'TE',
    type: 'pure',
    name: 'Teoria como Evidência',
    headline: 'Você tem repertório. E ele pode te enganar.',
    body: [
      'Você estudou muito. Conhece padrões, conceitos, métodos, mapas, dinâmicas e jeitos de interpretar o que acontece em um atendimento. Por isso, quando alguma coisa acontece, seu cérebro logo encontra uma explicação conhecida. Isso é bagagem profissional.',
      'Mas tem um perigo aí: quanto mais familiar e redondinha parece uma explicação, mais fácil é esquecer que ela ainda precisa bater com a realidade daquela pessoa específica.',
      'Uma explicação pode fazer todo sentido dentro da abordagem que você usa e, mesmo assim, não explicar o que de fato está acontecendo ali.',
      '**Seu próximo passo** é aprender a usar tudo o que você sabe sem tentar encaixar a cliente à força no seu conhecimento.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar de perto para como usar a sua bagagem sem transformar uma explicação conhecida em uma resposta automática.',
  },

  LI: {
    code: 'LI',
    type: 'pure',
    name: 'Leitura Investigativa',
    headline: 'Você sabe ficar no “ainda não sei”.',
    body: [
      'Isso mostra uma habilidade que muita gente perde quando ganha experiência: **você consegue ouvir uma história sem a pressa de decidir na hora o que ela significa.**',
      'Você não toma a primeira percepção como resposta. Procura entender melhor o contexto e observa o que mais aparece. Sabe que duas histórias parecidas podem ter motivos totalmente diferentes.',
      'Esse é um ótimo ponto de partida. Mas aqui está o seu próximo nível: **não basta apenas evitar conclusões apressadas. Você também precisa saber a hora em que já tem informação suficiente para montar um caminho e agir.** Até porque o outro extremo também acontece: ficar só perguntando e nunca transformar informação em direção.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para como sair do “ainda não sei” e chegar a uma direção com critério: quando continuar perguntando, quando testar uma leitura, quando abandonar uma ideia e quando já existe base suficiente para seguir. Ou seja: você já aprendeu a não ter pressa pela resposta. Agora precisa dominar o caminho até ela.',
  },

  // Sem headline: texto verbatim de "Quiz Resultados.md" (resultado #5).
  LI_ALL: {
    code: 'LI_ALL',
    type: 'special',
    name: 'Leitura Investigativa',
    body: [
      '**Seu resultado mostra uma ótima tendência: você evitar se precipitar e procura entender antes de tirar conclusões.**',
      'Mas vale lembrar que este teste só mostra como você reagiu a 10 situações hipotéticas.',
      'No dia a dia, sabemos que o jogo é outro.',
      'Ali tem tempo correndo, emoção, pressão, identificação com a cliente, teorias que você já domina e momentos em que você simplesmente precisa escolher um caminho.',
      'Você já tem o cuidado de não se precipitar.',
      '**Agora, o seu próximo nível é aprender a fechar uma leitura ou uma linha de raciocínio sem depender de achismo, de hábito ou de uma explicação pronta.**',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para como transformar esse cuidado que você já tem em um processo mais consistente: organizar o que aparece no atendimento, separar percepção de conclusão e chegar a uma leitura que você consiga sustentar sem depender de achismo, hábito ou explicação pronta.',
  },

  FP_VC: {
    code: 'FP_VC',
    type: 'hybrid',
    name: 'Fechamento Precoce + Viés de Confirmação',
    headline: 'Você chega numa resposta rápido e depois começa a encontrar provas dela.',
    body: [
      'Seu olhar é ágil. Você percebe uma possibilidade cedo e sabe fazer perguntas para aprofundá-la.',
      'O problema é que essas duas qualidades juntas podem criar uma armadilha: você escolhe uma direção cedo e, sem perceber, começa a encontrar cada vez mais motivos para continuar nela. Quanto mais pergunta, mais a história parece confirmar o que você pensou.',
      '**Seu próximo passo:** aprender a fazer perguntas que também deem a chance de mostrar que você estava errada.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para como quebrar esse ciclo: perceber quando você escolheu uma resposta cedo demais e continuar conduzindo o atendimento de um jeito que também possa mostrar que sua primeira ideia estava errada.',
  },

  FP_TE: {
    code: 'FP_TE',
    type: 'hybrid',
    name: 'Fechamento Precoce + Teoria como Evidência',
    headline: 'Você reconhece padrões muito rápido.',
    body: [
      'Você conhece explicações para aquilo que aparece no atendimento e tem facilidade para reconhecer padrões semelhantes.',
      'Isso pode dar muita segurança. Mas também pode criar uma sensação perigosa: a de que “eu já sei o que é isso”. A teoria te dá uma explicação, a história da cliente parece se encaixar perfeitamente e pronto, caso resolvido.',
      'Só que duas pessoas podem ter comportamentos parecidos por motivos totalmente diferentes.',
      '**Seu próximo passo:** aprender a usar a sua bagagem para abrir novas possibilidades, e não para dar o caso por encerrado.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para como usar o seu repertório sem deixar que ele encerre o caso antes da hora — transformando padrões conhecidos em possibilidades para explorar, e não em respostas automáticas.',
  },

  FP_LI: {
    code: 'FP_LI',
    type: 'hybrid',
    name: 'Fechamento Precoce + Leitura Investigativa',
    headline: 'Uma parte sua quer entender. Outra já quer responder.',
    body: [
      'O seu resultado mostra um vaivém interessante. Em algumas situações você sustenta muito bem o “ainda não sei”. Em outras, quando uma explicação parece fazer muito sentido, você fecha o raciocínio rápido demais.',
      'Isso significa que o problema não é a sua capacidade, mas sim a consistência.',
      '**Seu próximo passo** é perceber o que faz você deixar a cautela de lado em certos tipos de caso. Até porque um bom critério precisa funcionar mesmo quando a história mexe com as suas próprias certezas.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para o que faz você manter o “ainda não sei” em alguns casos e abandoná-lo em outros, para que o seu critério continue funcionando mesmo quando uma explicação parece fazer sentido rápido demais.',
  },

  VC_TE: {
    code: 'VC_TE',
    type: 'hybrid',
    name: 'Viés de Confirmação + Teoria como Evidência',
    headline: 'Sua teoria pode estar escolhendo suas perguntas.',
    body: [
      'Você tem bagagem e sabe ir fundo em uma linha de raciocínio.',
      'O ponto de atenção é quando uma teoria sugere o que procurar e suas perguntas começam justamente a encontrar aquilo. A teoria diz que tal comportamento vem da mãe. Você pergunta sobre a mãe. A cliente lembra de histórias com a mãe. E pronto: parece que a teoria foi comprovada. Percebe o ciclo?',
      '**Seu próximo passo** é este: aprender a fazer perguntas que tragam descobertas que a sua teoria nem imaginava.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para como impedir que uma explicação conhecida escolha por você o que merece atenção — ajudando você a perceber também aquilo que não estava previsto na sua primeira leitura.',
  },

  VC_LI: {
    code: 'VC_LI',
    type: 'hybrid',
    name: 'Viés de Confirmação + Leitura Investigativa',
    headline: 'Você sabe perguntar. Mas às vezes já sabe o que espera ouvir.',
    body: [
      'Você tem uma postura aberta e costuma querer entender melhor antes de concluir.',
      'Só que existe uma sutileza: algumas perguntas aparentemente abertas podem carregar uma direção escondida. “Quando você começou a sentir que precisava agradar sua mãe?” é uma pergunta — mas ela já decidiu que você precisava agradar sua mãe.',
      '**Seu próximo passo** é refinar suas perguntas para que elas realmente descubram algo, em vez de apenas aprofundarem uma ideia previamente escolhida.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para essas pequenas suposições que podem entrar nas perguntas, nas interpretações e até na forma como você conduz uma técnica — para que exista espaço real para aparecer algo diferente do que você esperava.',
  },

  TE_LI: {
    code: 'TE_LI',
    type: 'hybrid',
    name: 'Teoria como Evidência + Leitura Investigativa',
    headline: 'Você tem repertório e sabe segurar a resposta.',
    body: [
      'Essa é uma combinação ótima porque você não tem aquela pressa de encaixar tudo em uma explicação. Ao mesmo tempo, você conhece muitos modelos e consegue enxergar várias possibilidades.',
      'O risco aqui é outro: confundir uma explicação super elaborada com uma explicação que tem base de verdade. Uma teoria bem amarrada sempre convence mais fácil.',
      '**Seu próximo passo** é desenvolver critérios para decidir qual possibilidade merece continuar sendo considerada e qual precisa ser abandonada. Porque ter infinitas possibilidades também não resolve um caso — é preciso saber separar uma boa ideia de um raciocínio que realmente se sustenta na prática.',
    ],
    eap: 'No Efeito Alta Permissão, a gente vai olhar para como escolher entre várias explicações possíveis: o que merece continuar sendo considerado, o que precisa ser descartado e o que faz uma leitura deixar de ser apenas interessante para realmente se sustentar naquele caso.',
  },
};
