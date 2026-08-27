import type { OptionId } from './scoring';

export type Block = { kind: 'p' | 'quote'; text: string };

export type Question = {
  number: number;
  blocks: Block[]; // cenário, em ordem
  prompt: string; // a pergunta em si
  options: { id: OptionId; text: string }[];
};

export const INTRO_PARAGRAPH =
  'Não importa se você trabalha principalmente com conversa, corpo, técnicas energéticas, práticas integrativas ou uma mistura de abordagens. Aqui não estamos avaliando a técnica que você usa. Estamos olhando para o que você faz com aquilo que percebe durante um atendimento.';

export const QUESTIONS: Question[] = [
  {
    number: 1,
    blocks: [
      { kind: 'p', text: 'Uma cliente diz:' },
      {
        kind: 'quote',
        text: 'É impressionante. Toda vez que começo a ganhar mais dinheiro, acontece alguma coisa e eu gasto tudo.',
      },
    ],
    prompt: 'Qual seria sua primeira reação?',
    options: [
      { id: 'A', text: 'Pensaria que talvez alguma parte dela não se sinta confortável em ter mais dinheiro.' },
      {
        id: 'B',
        text: 'Perguntaria: “Me conta as últimas vezes que isso aconteceu. O que aconteceu e com o que o dinheiro foi gasto?”',
      },
      { id: 'C', text: 'Pensaria que pode existir algum padrão familiar se repetindo.' },
      { id: 'D', text: 'Perguntaria se alguém importante da família teve problemas depois de prosperar.' },
    ],
  },
  {
    number: 2,
    blocks: [
      {
        kind: 'p',
        text: 'Durante uma sessão, vem muito forte em você a sensação de que aquela cliente sofreu rejeição na infância.',
      },
    ],
    prompt: 'O que você faria?',
    options: [
      { id: 'A', text: 'Perguntaria: “Quem fez você se sentir rejeitada quando era criança?”' },
      { id: 'B', text: 'Começaria a olhar a história dela a partir da possibilidade de rejeição.' },
      {
        id: 'C',
        text: 'Guardaria essa impressão e continuaria ouvindo para ver se a história realmente aponta para isso.',
      },
      {
        id: 'D',
        text: 'Confiaria nessa percepção porque, às vezes, o terapeuta percebe algo antes de a própria pessoa conseguir colocar em palavras.',
      },
    ],
  },
  {
    number: 3,
    blocks: [{ kind: 'p', text: 'Você fala sobre aumentar preços e sua cliente começa a chorar.' }],
    prompt: 'O que esse choro mostra?',
    options: [
      {
        id: 'A',
        text: 'Que alguma coisa mexeu emocionalmente com ela naquele momento. Ainda não sabemos exatamente o quê.',
      },
      { id: 'B', text: 'Que o corpo revelou algo que ela ainda não consegue dizer conscientemente.' },
      { id: 'C', text: 'Que provavelmente existe algum conflito dela com cobrar mais.' },
      { id: 'D', text: 'Você perguntaria: “Você sente culpa de cobrar mais?”' },
    ],
  },
  {
    number: 4,
    blocks: [
      { kind: 'p', text: 'Você pergunta:' },
      { kind: 'quote', text: 'Será que seu medo de crescer tem alguma relação com a sua mãe?' },
      { kind: 'p', text: 'Ela se emociona e responde:' },
      { kind: 'quote', text: 'Meu Deus. É exatamente isso.' },
    ],
    prompt: 'O que você faria com essa reação?',
    options: [
      { id: 'A', text: 'Entenderia que uma reação emocional tão forte mostra que algo profundo foi acessado.' },
      { id: 'B', text: 'Perguntaria: “O que sua mãe fazia que fez você ter medo de crescer?”' },
      {
        id: 'C',
        text: 'Pensaria: “Isso fez muito sentido para ela. Quero entender melhor antes de decidir que encontramos a causa.”',
      },
      { id: 'D', text: 'Ficaria mais segura de que encontrou o ponto central do problema.' },
    ],
  },
  {
    number: 5,
    blocks: [
      {
        kind: 'p',
        text: 'Durante um atendimento, alguma coisa chama muito a sua atenção. Pode ser uma fala, uma reação do corpo, uma sensação, uma imagem que veio à sua mente ou algo que você percebeu durante a técnica que utiliza.',
      },
    ],
    prompt: 'O que você faz com isso?',
    options: [
      { id: 'A', text: 'Considero que aquilo provavelmente está mostrando onde está o problema.' },
      { id: 'B', text: 'Procuro outras coisas no atendimento que combinem com aquela percepção.' },
      {
        id: 'C',
        text: 'Levo em conta porque esse tipo de percepção costuma trazer informações que a cliente ainda não consegue acessar conscientemente.',
      },
      {
        id: 'D',
        text: 'Guardo aquilo como uma possibilidade e continuo observando antes de decidir o que significa.',
      },
    ],
  },
  {
    number: 6,
    blocks: [
      { kind: 'p', text: 'Depois de uma prática, a cliente diz:' },
      {
        kind: 'quote',
        text: 'Agora entendi. Esse peso que eu senti era uma energia da minha família que eu estava carregando.',
      },
    ],
    prompt: 'Como você lidaria com isso?',
    options: [
      {
        id: 'A',
        text: 'Tentaria entender como ela chegou a essa conclusão e o que aconteceu naquela experiência para ela interpretar dessa forma.',
      },
      { id: 'B', text: 'Aprofundaria perguntando de quem na família ela acredita que essa energia veio.' },
      {
        id: 'C',
        text: 'Consideraria provável, porque conteúdos familiares podem aparecer por meio de sensações e percepções durante uma prática.',
      },
      { id: 'D', text: 'Entenderia que a experiência provavelmente revelou algo que ela já carregava sem perceber.' },
    ],
  },
  {
    number: 7,
    blocks: [
      { kind: 'p', text: 'Uma cliente faz uma sessão com você.' },
      {
        kind: 'p',
        text: 'Duas semanas depois, fecha um contrato que estava tentando fechar havia meses e diz:',
      },
      { kind: 'quote', text: 'Foi depois da nossa sessão que tudo destravou.' },
    ],
    prompt: 'O que você pensa?',
    options: [
      {
        id: 'A',
        text: 'Quando alguma coisa muda por dentro, é natural que os resultados externos também comecem a mudar.',
      },
      { id: 'B', text: 'A sessão provavelmente mexeu justamente no que estava impedindo aquele resultado.' },
      {
        id: 'C',
        text: 'Pode ter relação com a sessão, mas eu gostaria de entender o que mudou concretamente entre uma coisa e outra.',
      },
      {
        id: 'D',
        text: 'Perguntaria: “O que você percebe que mudou em você depois da nossa sessão para conseguir fechar esse contrato?”',
      },
    ],
  },
  {
    number: 8,
    blocks: [
      { kind: 'p', text: 'Sua cliente começa a contar um problema e você pensa:' },
      { kind: 'quote', text: 'Nossa. Já atendi várias mulheres exatamente assim.' },
    ],
    prompt: 'Qual seria o maior cuidado?',
    options: [
      {
        id: 'A',
        text: 'Procurar nela os mesmos sinais que apareceram nas outras clientes para ver se o padrão se confirma.',
      },
      {
        id: 'B',
        text: 'Usar aquilo que já aprendeu sobre esse tipo de caso para conseguir chegar mais rápido ao ponto principal.',
      },
      { id: 'C', text: 'Lembrar que histórias parecidas podem acontecer por motivos completamente diferentes.' },
      {
        id: 'D',
        text: 'Reconhecer que, quando determinados comportamentos se repetem em muitas pessoas, provavelmente existe uma dinâmica psicológica comum por trás deles.',
      },
    ],
  },
  {
    number: 9,
    blocks: [
      { kind: 'p', text: 'Você começa a acreditar que já entendeu o problema da cliente.' },
      {
        kind: 'p',
        text: 'E, quanto mais pergunta, mais respostas aparecem combinando com aquilo que você pensou.',
      },
    ],
    prompt: 'O que faria?',
    options: [
      {
        id: 'A',
        text: 'Faria algumas perguntas tentando descobrir se existe alguma coisa na história dela que não combina com a minha explicação.',
      },
      {
        id: 'B',
        text: 'Ficaria mais confiante, porque várias partes da história estão apontando para o mesmo lugar.',
      },
      { id: 'C', text: 'Continuaria perguntando sobre aquele mesmo tema para ter ainda mais segurança.' },
      {
        id: 'D',
        text: 'Consideraria que, quando muitos elementos diferentes convergem para a mesma explicação, provavelmente existe um padrão real ali.',
      },
    ],
  },
  {
    number: 10,
    blocks: [
      {
        kind: 'p',
        text: 'Você encontra uma explicação que parece combinar perfeitamente com a história da sua cliente.',
      },
    ],
    prompt: 'O que faria você confiar mais nela?',
    options: [
      { id: 'A', text: 'Saber que muitos profissionais experientes usam aquela mesma explicação.' },
      { id: 'B', text: 'Encontrar várias situações da vida da cliente que combinam com ela.' },
      { id: 'C', text: 'Fazer novas perguntas procurando mais exemplos que confirmem aquilo.' },
      {
        id: 'D',
        text: 'Procurar também coisas que poderiam mostrar que minha explicação está errada e, mesmo assim, ela continuar fazendo sentido.',
      },
    ],
  },
];
