import catalogo from '../data/catalogo.json';

export const streamings = [
  { nome: 'Netflix', slug: 'netflix', classe: 'netflix' },
  { nome: 'HBO Max', slug: 'hbo-max', classe: 'hbo' },
  { nome: 'Prime Video', slug: 'prime-video', classe: 'prime' },
  { nome: 'Disney+', slug: 'disney-plus', classe: 'disney' },
  { nome: 'Globoplay', slug: 'globoplay', classe: 'globo' },
  { nome: 'Apple TV+', slug: 'apple-tv-plus', classe: 'apple' },
  { nome: 'Paramount+', slug: 'paramount-plus', classe: 'paramount' },
  { nome: 'Hulu', slug: 'hulu', classe: 'hulu' }
];

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function getCatalog() {
  return catalogo.filter((item) => item.status !== 'oculto');
}

export function getTitlesByType(tipo) {
  return getCatalog()
    .filter((item) => item.tipo === tipo)
    .sort((a, b) => b.nota_sofahype - a.nota_sofahype);
}

export function getTitlesByStreaming(slug) {
  const streaming = streamings.find((s) => s.slug === slug);
  if (!streaming) return [];

  return getCatalog()
    .filter((item) => item.plataformas.includes(streaming.nome))
    .sort((a, b) => b.nota_sofahype - a.nota_sofahype);
}

export function getTitleBySlug(slug) {
  return getCatalog().find((item) => item.slug === slug || item.id === slug || slugify(item.titulo) === slug);
}

export function getHypometro(score) {
  if (score >= 90) return { nome: 'Sofá Galático', curto: 'Galático', classe: 'galatico' };
  if (score >= 75) return { nome: 'Sofá Quente', curto: 'Quente', classe: 'quente' };
  if (score >= 50) return { nome: 'Sofá OK!', curto: 'OK', classe: 'ok' };
  return { nome: 'Sofá Frio', curto: 'Frio', classe: 'frio' };
}

export function getExperienceForDisplay(item) {
  const dictionary = [
    [/ritmo muito contemplativo/gi, 'história mais calma'],
    [/ritmo contemplativo/gi, 'história mais calma'],
    [/filmes contemplativos/gi, 'histórias mais calmas'],
    [/realismo cotidiano/gi, 'história sem fantasia'],
    [/ficção escapista/gi, 'história de fantasia ou aventura'],
    [/comédia descompromissada/gi, 'comédia leve'],
    [/narrativa confortável/gi, 'história fácil de acompanhar'],
    [/narrativa fora da ordem/gi, 'história contada fora da ordem'],
    [/narrativas fora da ordem/gi, 'histórias contadas fora da ordem'],
    [/baixo conflito/gi, 'pouca tensão'],
    [/cinema autoral/gi, 'filmes diferentes do comum'],
    [/conteúdo informativo/gi, 'conteúdo para aprender'],
    [/tom intenso/gi, 'clima pesado'],
    [/tom adulto/gi, 'clima adulto'],
    [/mais diálogo/gi, 'tem bastante conversa'],
    [/faz pensar/gi, 'pede atenção'],
    [/visual marcante/gi, 'visual bonito'],
    [/ritmo acelerado/gi, 'não fica parado'],
    [/alta energia/gi, 'bem movimentado'],
    [/tensão constante/gi, 'clima de tensão'],
    [/conflitos morais/gi, 'personagens difíceis de julgar'],
    [/dramas fortes/gi, 'histórias intensas'],
    [/histórias densas/gi, 'histórias com mais peso'],
    [/universos ambiciosos/gi, 'mundos grandes e bem criados'],
    [/tramas adultas/gi, 'histórias adultas'],
    [/histórias muito simples/gi, 'algo simples'],
    [/histórias mais paradas/gi, 'histórias mais calmas'],
    [/história mais parada/gi, 'história mais calma'],
    [/algo muito leve/gi, 'algo leve para relaxar'],
    [/humor bobo e inocente/gi, 'humor bem inocente'],
    [/desenho infantil/gi, 'animação para crianças pequenas'],
    [/história comum, sem fantasia/gi, 'história sem fantasia']
  ];

  const replace = (value) => {
    let output = String(value || '').trim();
    for (const [pattern, replacement] of dictionary) output = output.replace(pattern, replacement);
    return output;
  };

  const cleanList = (list) => [...new Set((list || []).map(replace).filter(Boolean))].slice(0, 4);

  return {
    experiencia: cleanList(item.experiencia),
    ideal_para: cleanList(item.ideal_para),
    talvez_nao_seja: cleanList(item.talvez_nao_seja)
  };
}

export function getPrimaryPlatform(item) {
  return item.plataformas?.[0] || 'Streaming';
}

export function getPlatformClass(nome) {
  const found = streamings.find((s) => s.nome === nome);
  return found?.classe || 'default';
}
