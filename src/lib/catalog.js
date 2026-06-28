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
  return getCatalog().find((item) => item.id === slug || slugify(item.titulo) === slug);
}

export function getHypometro(score) {
  if (score >= 90) return { nome: 'Sofá Galáctico', emoji: '🔥', classe: 'galactico' };
  if (score >= 75) return { nome: 'Sofá Quente', emoji: '🌶', classe: 'quente' };
  if (score >= 50) return { nome: 'Sofá OK!', emoji: '🟡', classe: 'ok' };
  return { nome: 'Sofá Frio', emoji: '❄️', classe: 'frio' };
}

export function getPrimaryPlatform(item) {
  return item.plataformas?.[0] || 'Streaming';
}

export function getPlatformClass(nome) {
  const found = streamings.find((s) => s.nome === nome);
  return found?.classe || 'default';
}
