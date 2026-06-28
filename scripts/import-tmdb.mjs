import fs from 'node:fs/promises';
import path from 'node:path';

const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const API = 'https://api.themoviedb.org/3';
const IMAGE = 'https://image.tmdb.org/t/p';
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'src/data/catalogo.json');

const TARGET_MOVIES = Number(process.env.TMDB_IMPORT_MOVIES || 120);
const TARGET_SERIES = Number(process.env.TMDB_IMPORT_SERIES || 60);
const MIN_MOVIE_VOTES = Number(process.env.TMDB_MIN_MOVIE_VOTES || 120);
const MIN_TV_VOTES = Number(process.env.TMDB_MIN_TV_VOTES || 80);

const STREAMINGS = [
  { nome: 'Netflix', aliases: ['netflix'] },
  { nome: 'HBO Max', aliases: ['hbo max', 'max'] },
  { nome: 'Prime Video', aliases: ['amazon prime video', 'prime video'] },
  { nome: 'Disney+', aliases: ['disney plus', 'disney+'] },
  { nome: 'Globoplay', aliases: ['globoplay'] },
  { nome: 'Apple TV+', aliases: ['apple tv plus', 'apple tv+'] },
  { nome: 'Paramount+', aliases: ['paramount plus', 'paramount+'] },
  { nome: 'Hulu', aliases: ['hulu'] }
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tmdb(endpoint, params = {}) {
  const url = new URL(`${API}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${TOKEN}`
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`TMDb ${response.status} em ${endpoint}: ${body.slice(0, 180)}`);
  }

  return response.json();
}

async function safeTmdb(endpoint, params = {}) {
  try {
    return await tmdb(endpoint, params);
  } catch (error) {
    console.warn(`Aviso: ${error.message}`);
    return null;
  }
}

async function getProviderMap(kind) {
  const data = await tmdb(`/watch/providers/${kind}`, {
    language: 'pt-BR',
    watch_region: 'BR'
  });

  const providers = data.results || [];
  const found = new Map();

  for (const streaming of STREAMINGS) {
    const ids = providers
      .filter((provider) => {
        const providerName = normalize(provider.provider_name);
        return streaming.aliases.some((alias) => providerName === alias || providerName.includes(alias));
      })
      .map((provider) => provider.provider_id);

    found.set(streaming.nome, [...new Set(ids)]);
  }

  return found;
}

function streamingsFromWatchProviders(data) {
  const br = data?.results?.BR;
  const flatrate = br?.flatrate || [];
  const names = [];

  for (const provider of flatrate) {
    const providerName = normalize(provider.provider_name);
    const match = STREAMINGS.find((streaming) =>
      streaming.aliases.some((alias) => providerName === alias || providerName.includes(alias))
    );
    if (match && !names.includes(match.nome)) names.push(match.nome);
  }

  return names;
}

async function collectCandidates(tipo, target, providerMap) {
  const kind = tipo === 'filme' ? 'movie' : 'tv';
  const endpoint = tipo === 'filme' ? '/discover/movie' : '/discover/tv';
  const minVotes = tipo === 'filme' ? MIN_MOVIE_VOTES : MIN_TV_VOTES;
  const candidates = new Map();

  for (const [streamingName, ids] of providerMap.entries()) {
    if (!ids.length) continue;

    for (let page = 1; page <= 6 && candidates.size < target * 4; page += 1) {
      const data = await safeTmdb(endpoint, {
        language: 'pt-BR',
        region: 'BR',
        watch_region: 'BR',
        with_watch_providers: ids.join('|'),
        sort_by: 'popularity.desc',
        include_adult: 'false',
        include_null_first_air_dates: 'false',
        'vote_count.gte': minVotes,
        page
      });

      for (const item of data?.results || []) {
        candidates.set(`${kind}-${item.id}`, { id: item.id, kind, tipo, seedStreaming: streamingName });
      }

      await sleep(120);
    }
  }

  return Array.from(candidates.values());
}

function formatRuntime(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}min`;
  if (!m) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function scoreFromDetails(details) {
  const voteAverage = Number(details.vote_average || 0) * 10;
  const popularity = Math.min(Number(details.popularity || 0), 100);
  const voteCount = Math.min(Number(details.vote_count || 0) / 100, 10);
  const score = Math.round(voteAverage * 0.82 + popularity * 0.10 + voteCount * 0.8);
  return Math.max(0, Math.min(score, 100));
}

function experienceFromGenres(genres, tipo) {
  const text = normalize(genres.join(' '));
  const exp = [];
  const ideal = [];
  const avoid = [];

  if (text.includes('comedia')) {
    exp.push('Tom mais leve');
    ideal.push('quem quer relaxar');
    avoid.push('drama pesado');
  }
  if (text.includes('drama')) {
    exp.push('Tom dramático');
    ideal.push('histórias emocionais');
    avoid.push('algo totalmente leve');
  }
  if (text.includes('acao') || text.includes('aventura')) {
    exp.push('Mais movimento');
    ideal.push('aventura e adrenalina');
    avoid.push('ritmo muito contemplativo');
  }
  if (text.includes('terror')) {
    exp.push('Tensão alta');
    ideal.push('sustos e suspense');
    avoid.push('filme confortável');
  }
  if (text.includes('suspense') || text.includes('misterio')) {
    exp.push('Exige atenção');
    ideal.push('mistério e investigação');
    avoid.push('assistir distraído');
  }
  if (text.includes('ficcao cientifica') || text.includes('fantasia')) {
    exp.push('Universo imaginativo');
    ideal.push('mundos diferentes');
    avoid.push('realismo cotidiano');
  }
  if (text.includes('documentario')) {
    exp.push('Conteúdo informativo');
    ideal.push('aprender algo novo');
    avoid.push('ficção escapista');
  }
  if (text.includes('romance')) {
    exp.push('Tom emocional');
    ideal.push('histórias afetivas');
    avoid.push('ação constante');
  }

  if (!exp.length) exp.push(tipo === 'serie' ? 'Boa opção de série' : 'Boa opção de filme');
  if (!ideal.length) ideal.push('quem busca títulos bem avaliados');
  if (!avoid.length) avoid.push('algo muito específico');

  return {
    experiencia: [...new Set(exp)].slice(0, 4),
    ideal_para: [...new Set(ideal)].slice(0, 4),
    talvez_nao_seja: [...new Set(avoid)].slice(0, 4)
  };
}

async function buildItem(candidate) {
  const detailEndpoint = candidate.tipo === 'filme' ? `/movie/${candidate.id}` : `/tv/${candidate.id}`;
  const providerEndpoint = candidate.tipo === 'filme' ? `/movie/${candidate.id}/watch/providers` : `/tv/${candidate.id}/watch/providers`;

  const details = await safeTmdb(detailEndpoint, { language: 'pt-BR' });
  if (!details) return null;

  const watch = await safeTmdb(providerEndpoint);
  const plataformas = streamingsFromWatchProviders(watch);
  if (!plataformas.length) return null;

  const title = candidate.tipo === 'filme' ? details.title : details.name;
  const originalTitle = candidate.tipo === 'filme' ? details.original_title : details.original_name;
  const date = candidate.tipo === 'filme' ? details.release_date : details.first_air_date;
  const genres = (details.genres || []).map((g) => g.name).filter(Boolean);
  const runtime = candidate.tipo === 'filme'
    ? formatRuntime(details.runtime)
    : formatRuntime(details.episode_run_time?.[0]);
  const sofaScore = scoreFromDetails(details);
  const publicScore = Math.round(Number(details.vote_average || 0) * 10);
  const slugBase = slugify(title || originalTitle || `${candidate.tipo}-${candidate.id}`);
  const experience = experienceFromGenres(genres, candidate.tipo);

  return {
    id: `${candidate.tipo}-${candidate.id}`,
    slug: slugBase,
    tmdb_id: details.id,
    tipo: candidate.tipo,
    titulo: title || originalTitle,
    titulo_original: originalTitle || title,
    ano: date ? String(date).slice(0, 4) : '',
    generos: genres,
    plataformas,
    nota_sofahype: sofaScore,
    nota_critica: null,
    nota_publico: publicScore,
    nota_tmdb: Number(details.vote_average || 0).toFixed(1),
    popularidade_tmdb: Number(details.popularity || 0),
    duracao: runtime,
    tag: '',
    poster_url: details.poster_path ? `${IMAGE}/w500${details.poster_path}` : '',
    backdrop_url: details.backdrop_path ? `${IMAGE}/w1280${details.backdrop_path}` : '',
    sinopse: details.overview || 'Sinopse ainda não disponível em português.',
    ...experience,
    fonte_dados: 'TMDb',
    status: 'ativo'
  };
}

async function importType(tipo, target, providerMap) {
  console.log(`Buscando ${target} ${tipo === 'filme' ? 'filmes' : 'séries'}...`);
  const candidates = await collectCandidates(tipo, target, providerMap);
  const items = [];
  const seenSlugs = new Set();

  for (const candidate of candidates) {
    if (items.length >= target) break;
    const item = await buildItem(candidate);
    if (!item) continue;

    if (seenSlugs.has(item.slug)) item.slug = `${item.slug}-${item.tmdb_id}`;
    seenSlugs.add(item.slug);
    items.push(item);
    console.log(`  + ${item.titulo} (${item.plataformas.join(', ')})`);
    await sleep(140);
  }

  return items.sort((a, b) => b.nota_sofahype - a.nota_sofahype);
}

async function main() {
  if (!TOKEN) {
    console.warn('TMDB_READ_ACCESS_TOKEN não encontrado. Mantendo o catálogo atual.');
    return;
  }

  console.log('Iniciando importação TMDb para o SofáHype...');
  const movieProviderMap = await getProviderMap('movie');
  const tvProviderMap = await getProviderMap('tv');

  const movies = await importType('filme', TARGET_MOVIES, movieProviderMap);
  const series = await importType('serie', TARGET_SERIES, tvProviderMap);

  const catalog = [...movies, ...series]
    .filter((item) => item.titulo && item.plataformas?.length)
    .sort((a, b) => {
      if (a.tipo !== b.tipo) return a.tipo === 'filme' ? -1 : 1;
      return b.nota_sofahype - a.nota_sofahype;
    });

  await fs.writeFile(OUTPUT, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Catálogo atualizado: ${movies.length} filmes + ${series.length} séries = ${catalog.length} títulos.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
