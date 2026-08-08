import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, 'src/data/catalogo.json');
const HIGHLIGHT_PATH = path.join(ROOT, 'src/data/weeklyHighlight.js');
const TODAY = new Date().toISOString().slice(0, 10);
const SUPPORTED_PLATFORMS = new Set([
  'Netflix', 'Max', 'HBO Max', 'Prime Video', 'Disney+', 'Globoplay', 'Apple TV', 'Paramount+', 'Hulu'
]);

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function isValidReleasedDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || value > TODAY) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function duplicateValues(items, valueFor) {
  const occurrences = new Map();
  for (const item of items) {
    const value = valueFor(item);
    if (!value) continue;
    if (!occurrences.has(value)) occurrences.set(value, []);
    occurrences.get(value).push(item.titulo || item.id || '(sem título)');
  }
  return [...occurrences.entries()].filter(([, titles]) => titles.length > 1);
}

function isImported(item) {
  return item.origem_importacao === 'tmdb';
}

async function main() {
  const errors = [];
  const warnings = [];
  let catalog;

  try {
    catalog = JSON.parse(await fs.readFile(CATALOG_PATH, 'utf8'));
  } catch (error) {
    console.error(`ERRO: JSON inválido em src/data/catalogo.json: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(catalog)) errors.push('A raiz de catalogo.json deve ser uma lista.');
  if (!Array.isArray(catalog)) catalog = [];

  for (const [slug, titles] of duplicateValues(catalog, (item) => item.slug)) errors.push(`Slug duplicado "${slug}": ${titles.join(', ')}`);
  for (const [id, titles] of duplicateValues(catalog, (item) => item.id)) errors.push(`ID duplicado "${id}": ${titles.join(', ')}`);
  for (const [key, titles] of duplicateValues(catalog, (item) => item.tmdb_id ? `${item.tipo}|${item.tmdb_id}` : '')) {
    errors.push(`tmdb_id duplicado no mesmo tipo "${key}": ${titles.join(', ')}`);
  }

  for (const item of catalog) {
    const label = item.titulo || item.id || '(registro sem identificação)';
    const releaseDate = item.data_lancamento;
    const year = Number(String(item.ano || '').slice(0, 4));
    if ((releaseDate && releaseDate > TODAY) || (!releaseDate && Number.isFinite(year) && year > Number(TODAY.slice(0, 4)))) {
      errors.push(`Título futuro: ${label}`);
    }
    for (const platform of item.plataformas || []) {
      if (!SUPPORTED_PLATFORMS.has(platform)) errors.push(`Plataforma não reconhecida em ${label}: ${platform}`);
    }

    if (isImported(item)) {
      if (!item.id) errors.push(`Novo registro sem id: ${label}`);
      if (!item.tmdb_id) errors.push(`Novo registro sem tmdb_id: ${label}`);
      if (!item.slug) errors.push(`Novo registro sem slug: ${label}`);
      if (!item.titulo) errors.push(`Novo registro sem título: ${label}`);
      if (!['filme', 'serie'].includes(item.tipo)) errors.push(`Novo registro com tipo inválido: ${label}`);
      if (!/^\d{4}$/.test(String(item.ano || ''))) errors.push(`Novo registro sem ano válido: ${label}`);
      if (!item.poster_url) errors.push(`Novo registro sem poster_url: ${label}`);
      if (!item.backdrop_url) errors.push(`Novo registro sem backdrop_url: ${label}`);
      if (!isValidReleasedDate(releaseDate)) errors.push(`Novo registro sem data válida já lançada: ${label}`);
      if (!item.plataformas?.length) errors.push(`Novo registro sem plataforma: ${label}`);
      if (item.nota_sofahype !== null || item.nota_critica !== null || item.nota_publico !== null) {
        errors.push(`Novo registro com nota editorial preenchida: ${label}`);
      }
    } else {
      if (!item.slug) warnings.push(`Registro legado sem slug explícito: ${label}`);
      if (!item.poster_url) warnings.push(`Registro legado sem poster_url: ${label}`);
      if (!item.backdrop_url) warnings.push(`Registro legado sem backdrop_url: ${label}`);
    }
  }

  const highlights = catalog.filter((item) => item.destaque_semana === true);
  if (highlights.length !== 1) errors.push(`O catálogo deve ter exatamente um destaque_semana: true; encontrados: ${highlights.length}.`);

  const configSource = await fs.readFile(HIGHLIGHT_PATH, 'utf8');
  const configuredSlug = configSource.match(/\bslug\s*:\s*['"`]([^'"`]+)['"`]/)?.[1];
  if (!configuredSlug) {
    errors.push('Não foi possível identificar o slug em src/data/weeklyHighlight.js.');
  } else {
    const highlight = catalog.find((item) => item.slug === configuredSlug || item.id === configuredSlug || slugify(item.titulo) === configuredSlug);
    if (!highlight) errors.push(`O destaque "${configuredSlug}" não pode gerar sua página individual.`);
    else if (highlight.destaque_semana !== true) errors.push(`O destaque configurado "${configuredSlug}" não está marcado como destaque_semana: true.`);
  }

  for (const warning of warnings) console.warn(`AVISO: ${warning}`);
  for (const error of errors) console.error(`ERRO: ${error}`);
  console.log(`Catálogo validado: ${catalog.length} títulos, ${errors.length} erro(s), ${warnings.length} aviso(s).`);
  if (errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`ERRO: ${error.message}`);
  process.exitCode = 1;
});
