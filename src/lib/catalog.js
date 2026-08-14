import catalogo from '../data/catalogo.json';

export const streamings = [
  { nome: 'Netflix', slug: 'netflix', classe: 'netflix', aliases: ['Netflix'] },
  { nome: 'HBO Max', slug: 'hbo-max', classe: 'hbo', aliases: ['HBO Max', 'Max'] },
  { nome: 'Prime Video', slug: 'prime-video', classe: 'prime', aliases: ['Prime Video', 'Amazon Prime Video'] },
  { nome: 'Disney+', slug: 'disney-plus', classe: 'disney', aliases: ['Disney+', 'Disney Plus'] },
  { nome: 'Globoplay', slug: 'globoplay', classe: 'globo', aliases: ['Globoplay'] },
  { nome: 'Apple TV', slug: 'apple-tv', classe: 'apple', aliases: ['Apple TV', 'Apple TV+', 'Apple TV Plus'] },
  { nome: 'Paramount+', slug: 'paramount-plus', classe: 'paramount', aliases: ['Paramount+', 'Paramount Plus'] },
  { nome: 'Hulu', slug: 'hulu', classe: 'hulu', aliases: ['Hulu'] }
];

export const streamingSlugAliases = {
  'apple-tv-plus': 'apple-tv'
};

export function canonicalStreamingSlug(slug) {
  return streamingSlugAliases[slug] || slug;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function getFullCatalog() {
  return catalogo.filter((item) => item.status !== 'oculto');
}

export function getCatalog() {
  return getFullCatalog().filter((item) =>
    item.status_disponibilidade === undefined || item.status_disponibilidade === 'ativo'
  );
}

export function getTitlesByType(tipo) {
  return getCatalog()
    .filter((item) => item.tipo === tipo)
    .sort((a, b) => b.nota_sofahype - a.nota_sofahype);
}

export function platformMatches(itemPlatform, streaming) {
  const platform = normalizeText(itemPlatform);
  return (streaming.aliases || [streaming.nome]).some((alias) => normalizeText(alias) === platform);
}

export function getTitlesByStreaming(slug) {
  const canonicalSlug = canonicalStreamingSlug(slug);
  const streaming = streamings.find((s) => s.slug === canonicalSlug);
  if (!streaming) return [];

  return getCatalog()
    .filter((item) => (item.plataformas || []).some((platform) => platformMatches(platform, streaming)))
    .sort((a, b) => b.nota_sofahype - a.nota_sofahype);
}

export function getTitleBySlug(slug) {
  return getFullCatalog().find((item) => item.slug === slug || item.id === slug || slugify(item.titulo) === slug);
}

export function getScoreClass(score) {
  const value = Number(score || 0);
  if (value >= 90) return 'galatico';
  if (value >= 75) return 'quente';
  if (value >= 60) return 'ok';
  return 'fraco';
}

export function formatScore(score) {
  const value = Number(score || 0);
  if (!Number.isFinite(value) || value <= 0) return '—';
  return (value / 10).toFixed(1);
}

export function getHypometro(score) {
  const classe = getScoreClass(score);
  if (classe === 'galatico') return { nome: 'Sofá Galático', curto: 'Galático', classe };
  if (classe === 'quente') return { nome: 'Sofá Quente', curto: 'Quente', classe };
  if (classe === 'ok') return { nome: 'Sofá OK!', curto: 'OK', classe };
  return { nome: 'Sofá Fraco', curto: 'Fraco', classe };
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
  const firstPlatform = item.plataformas?.[0] || 'Streaming';
  const streaming = streamings.find((s) => (s.aliases || []).some((alias) => normalizeText(alias) === normalizeText(firstPlatform)));
  return streaming?.nome || firstPlatform;
}

export function getPlatformClass(nome) {
  const found = streamings.find((s) => s.nome === nome || (s.aliases || []).some((alias) => normalizeText(alias) === normalizeText(nome)));
  return found?.classe || 'default';
}
