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

function simpleUnique(list, limit = 4) {
  return [...new Set(list.filter(Boolean))].slice(0, limit);
}

function experienceFromDetails(details, genres, tipo) {
  const text = normalize(genres.join(' '));
  const titulo = normalize(details.title || details.name || details.original_title || details.original_name || '');
  const sinopse = normalize(details.overview || '');
  const runtime = tipo === 'filme' ? Number(details.runtime || 0) : Number(details.episode_run_time?.[0] || 0);

  const has = (term) => text.includes(term);
  const mentions = (term) => sinopse.includes(term) || titulo.includes(term);

  const isComedy = has('comedia');
  const isCrime = has('crime');
  const isDrama = has('drama');
  const isAction = has('acao') || has('aventura');
  const isHorror = has('terror');
  const isThriller = has('suspense') || has('misterio');
  const isScifi = has('ficcao cientifica');
  const isFantasy = has('fantasia');
  const isDoc = has('documentario');
  const isRomance = has('romance');
  const isAnimation = has('animacao');
  const isFamily = has('familia');
  const isMusic = has('musica') || has('musical');
  const isWar = has('guerra');
  const isHistory = has('historia');
  const isAdultByText = mentions('assassin') || mentions('crime') || mentions('violencia') || mentions('morte') || mentions('trafic') || mentions('gangue');
  const adultTone = isCrime || isThriller || isHorror || isWar || isAdultByText;
  const isKidFriendly = (isAnimation || isFamily) && !adultTone && !isHorror && !isCrime;

  const exp = [];
  const ideal = [];
  const avoid = [];

  // Regra de linguagem do SofáHype:
  // usar termos simples, populares e úteis para decisão. Nada de jargão de crítico.

  if (isKidFriendly) {
    exp.push('Visual colorido');
    exp.push(isFantasy || isScifi ? 'Tem fantasia' : 'Clima leve');
    ideal.push('ver com crianças');
    ideal.push('aventura para crianças');
    avoid.push(isFantasy || isScifi ? 'história sem fantasia' : 'filme adulto');
  } else if (isAnimation) {
    exp.push('Animação para público mais velho');
    ideal.push('animação com história adulta');
    avoid.push('animação para crianças pequenas');
  }

  if (isCrime) {
    exp.push(isComedy ? 'Crime com humor pesado' : 'Crime e tensão');
    ideal.push('histórias de crime');
    avoid.push('algo leve para relaxar');
  }

  if (isThriller) {
    exp.push('Tem mistério');
    exp.push('Precisa prestar atenção');
    ideal.push('suspense');
    avoid.push('assistir distraído');
  }

  if (isHorror) {
    exp.push('Clima de medo');
    exp.push('Tem sustos');
    ideal.push('terror');
    avoid.push('filme tranquilo');
  }

  if (isAction) {
    exp.push('Bem movimentado');
    ideal.push('ação e aventura');
    avoid.push('história parada');
  }

  if (isScifi || isFantasy) {
    exp.push(isScifi ? 'Mistura ciência e imaginação' : 'Mundo de fantasia');
    ideal.push(isScifi ? 'ficção científica' : 'fantasia');
    avoid.push(isScifi || isFantasy ? 'história sem fantasia' : '');
  }

  if (isDrama) {
    exp.push(adultTone ? 'Clima adulto' : 'História mais séria');
    ideal.push('histórias intensas');
    if (!isComedy) avoid.push('comédia leve');
  }

  if (isComedy) {
    if (adultTone || isDrama) {
      exp.push('Humor mais pesado');
      ideal.push('humor adulto');
      avoid.push('humor bem inocente');
    } else {
      exp.push('Tem humor');
      ideal.push('dar risada');
      avoid.push('drama pesado');
    }
  }

  if (isRomance) {
    exp.push('Foco nas relações');
    ideal.push('histórias de amor');
    avoid.push('ação o tempo todo');
  }

  if (isDoc) {
    exp.push('Fala de assuntos reais');
    ideal.push('aprender algo');
    avoid.push('história inventada');
  }

  if (isMusic) {
    exp.push('Música em destaque');
    ideal.push('filmes com música');
    avoid.push('filme sem números musicais');
  }

  if (isWar || isHistory) {
    exp.push(isWar ? 'Tema de guerra' : 'Tema histórico');
    ideal.push(isWar ? 'histórias de guerra' : 'histórias de época');
    avoid.push('algo leve para relaxar');
  }

  if (tipo === 'filme' && runtime >= 150) {
    exp.push('Filme longo');
    avoid.push('filme curto');
  }

  if (tipo === 'serie') {
    exp.push('Para acompanhar em episódios');
    ideal.push('maratonar ou acompanhar aos poucos');
  }

  if (!exp.length) exp.push(tipo === 'serie' ? 'Boa opção de série' : 'Boa opção de filme');
  if (!ideal.length) ideal.push('títulos bem avaliados');
  if (!avoid.length) avoid.push('outro estilo de filme ou série');

  return {
    experiencia: simpleUnique(exp),
    ideal_para: simpleUnique(ideal),
    talvez_nao_seja: simpleUnique(avoid)
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
  const experience = experienceFromDetails(details, genres, candidate.tipo);

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
