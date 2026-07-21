import fs from 'node:fs/promises';
import path from 'node:path';

const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const API = 'https://api.themoviedb.org/3';
const IMAGE = 'https://image.tmdb.org/t/p';
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'src/data/catalogo.json');

const TARGET_MOVIES = Number(process.env.TMDB_IMPORT_MOVIES || 500);
const TARGET_SERIES = Number(process.env.TMDB_IMPORT_SERIES || 250);
const MIN_MOVIE_VOTES = Number(process.env.TMDB_MIN_MOVIE_VOTES || 120);
const MIN_TV_VOTES = Number(process.env.TMDB_MIN_TV_VOTES || 80);
const RECENT_START_YEAR = Number(process.env.TMDB_RECENT_START_YEAR || 2023);
const RECENT_SHARE = Math.max(0, Math.min(1, Number(process.env.TMDB_RECENT_SHARE || 0.75)));
const TODAY = new Date().toISOString().slice(0, 10);

const STREAMINGS = [
  { nome: 'Netflix', aliases: ['netflix'], region: 'BR' },
  { nome: 'HBO Max', aliases: ['hbo max', 'max'], region: 'BR' },
  { nome: 'Prime Video', aliases: ['amazon prime video', 'prime video'], region: 'BR' },
  { nome: 'Disney+', aliases: ['disney plus', 'disney+'], region: 'BR' },
  { nome: 'Globoplay', aliases: ['globoplay'], region: 'BR' },
  { nome: 'Apple TV', aliases: ['apple tv plus', 'apple tv+', 'apple tv', 'apple tv plus amazon channel'], region: 'BR' },
  { nome: 'Paramount+', aliases: ['paramount plus', 'paramount+'], region: 'BR' },
  // Hulu pode não aparecer no recorte BR do TMDb. Mantemos uma busca US como fallback
  // para não deixar a página vazia enquanto o produto ainda está em validação.
  { nome: 'Hulu', aliases: ['hulu'], region: process.env.TMDB_HULU_REGION || 'US' }
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
  const providersByRegion = new Map();

  async function providersForRegion(region) {
    if (!providersByRegion.has(region)) {
      const data = await tmdb(`/watch/providers/${kind}`, {
        language: 'pt-BR',
        watch_region: region
      });
      providersByRegion.set(region, data.results || []);
    }
    return providersByRegion.get(region);
  }

  const found = new Map();

  for (const streaming of STREAMINGS) {
    const providers = await providersForRegion(streaming.region || 'BR');
    const ids = providers
      .filter((provider) => {
        const providerName = normalize(provider.provider_name);
        return streaming.aliases.some((alias) => providerName === alias || providerName.includes(alias));
      })
      .map((provider) => provider.provider_id);

    found.set(streaming.nome, {
      ids: [...new Set(ids)],
      region: streaming.region || 'BR'
    });
  }

  return found;
}

function streamingsFromWatchProviders(data) {
  const names = [];

  function addFromRegion(region, onlyName = null) {
    const regionData = data?.results?.[region];
    const flatrate = regionData?.flatrate || [];

    for (const provider of flatrate) {
      const providerName = normalize(provider.provider_name);
      const match = STREAMINGS.find((streaming) =>
        (!onlyName || streaming.nome === onlyName) &&
        streaming.aliases.some((alias) => providerName === alias || providerName.includes(alias))
      );
      if (match && !names.includes(match.nome)) names.push(match.nome);
    }
  }

  // O SofáHype prioriza disponibilidade no Brasil.
  addFromRegion('BR');
  // Hulu é exceção enquanto o serviço/conteúdo ainda aparece de forma inconsistente por região.
  addFromRegion(process.env.TMDB_HULU_REGION || 'US', 'Hulu');

  return names;
}

async function collectCandidates(tipo, target, providerMap, { dateMode = 'all' } = {}) {
  const kind = tipo === 'filme' ? 'movie' : 'tv';
  const endpoint = tipo === 'filme' ? '/discover/movie' : '/discover/tv';
  const minVotes = tipo === 'filme' ? MIN_MOVIE_VOTES : MIN_TV_VOTES;
  const candidates = new Map();
  const activeProviders = Array.from(providerMap.entries()).filter(([, config]) => config.ids.length);

  // Antes o importador varria Netflix primeiro, depois HBO, Prime etc.
  // Com isso, os primeiros streamings enchiam a cota e Apple TV+/Hulu podiam ficar vazios.
  // Agora a coleta é em rodízio: página 1 de todos, depois página 2 de todos, etc.
  // Isso melhora a diversidade do catálogo e evita que todos os cards de uma página carreguem
  // a primeira plataforma do título como se fosse sempre Netflix.
  const maxPages = Math.max(8, Math.ceil(target / Math.max(activeProviders.length * 10, 1)) + 4);
  for (let page = 1; page <= maxPages && candidates.size < target * 6; page += 1) {
    for (const [streamingName, config] of activeProviders) {
      const recentStartDate = `${RECENT_START_YEAR}-01-01`;
      const classicEndDate = `${RECENT_START_YEAR - 1}-12-31`;
      const dateParams = tipo === 'filme'
        ? {
            'primary_release_date.lte': dateMode === 'classic' ? classicEndDate : TODAY,
            ...(dateMode === 'recent' ? { 'primary_release_date.gte': recentStartDate } : {})
          }
        : {
            'first_air_date.lte': dateMode === 'classic' ? classicEndDate : TODAY,
            ...(dateMode === 'recent' ? { 'first_air_date.gte': recentStartDate } : {})
          };

      const data = await safeTmdb(endpoint, {
        language: 'pt-BR',
        region: config.region || 'BR',
        watch_region: config.region || 'BR',
        with_watch_providers: config.ids.join('|'),
        with_watch_monetization_types: 'flatrate',
        sort_by: 'popularity.desc',
        include_adult: 'false',
        include_null_first_air_dates: 'false',
        'vote_count.gte': minVotes,
        ...dateParams,
        page
      });

      for (const item of data?.results || []) {
        const key = `${kind}-${item.id}`;
        if (!candidates.has(key)) {
          candidates.set(key, { id: item.id, kind, tipo, seedStreamings: [streamingName] });
        } else {
          const existing = candidates.get(key);
          if (!existing.seedStreamings.includes(streamingName)) existing.seedStreamings.push(streamingName);
        }
      }

      await sleep(100);
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

function releaseYear(item) {
  const year = Number(String(item.ano || '').slice(0, 4));
  return Number.isFinite(year) ? year : 0;
}

function isRecent(item) {
  return releaseYear(item) >= RECENT_START_YEAR;
}

function editorialPriority(item) {
  const year = releaseYear(item);
  const currentYear = Number(TODAY.slice(0, 4));
  let recencyBonus = 0;

  if (year >= currentYear) recencyBonus = 8;
  else if (year === currentYear - 1) recencyBonus = 6;
  else if (year >= RECENT_START_YEAR) recencyBonus = 4;

  return Number(item.nota_sofahype || 0) + recencyBonus;
}

async function importType(tipo, target, providerMap) {
  console.log(`Buscando ${target} ${tipo === 'filme' ? 'filmes' : 'séries'}...`);
  const recentTarget = Math.max(1, Math.ceil(target * RECENT_SHARE));
  const classicTarget = Math.max(1, target - recentTarget);
  const recentCandidates = await collectCandidates(tipo, recentTarget, providerMap, { dateMode: 'recent' });
  const classicCandidates = await collectCandidates(tipo, classicTarget, providerMap, { dateMode: 'classic' });
  const candidateMap = new Map();
  const recentCandidateLimit = Math.ceil(recentTarget * 1.5);
  const classicCandidateLimit = Math.ceil(classicTarget * 1.8);

  for (const candidate of [
    ...recentCandidates.slice(0, recentCandidateLimit),
    ...classicCandidates.slice(0, classicCandidateLimit)
  ]) {
    const key = `${candidate.kind}-${candidate.id}`;
    if (!candidateMap.has(key)) candidateMap.set(key, candidate);
  }

  const candidates = Array.from(candidateMap.values());
  const pool = [];
  const seenSlugs = new Set();

  // Monta uma piscina um pouco maior do que a cota final, para permitir diversidade por streaming.
  // Para catálogos maiores, processamos em pequenos lotes. Isso reduz o tempo de build
  // sem transformar o importador em uma metralhadora de chamadas para a API.
  const batchSize = Number(process.env.TMDB_IMPORT_BATCH_SIZE || 5);
  for (let i = 0; i < candidates.length && pool.length < Math.ceil(target * 1.4); i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const items = await Promise.all(batch.map((candidate) => buildItem(candidate)));

    for (const item of items) {
      if (!item) continue;
      if (pool.length >= Math.ceil(target * 1.4)) break;

      if (seenSlugs.has(item.slug)) item.slug = `${item.slug}-${item.tmdb_id}`;
      seenSlugs.add(item.slug);
      pool.push(item);
      console.log(`  + ${item.titulo} (${item.plataformas.join(', ')})`);
    }

    await sleep(120);
  }

  const selected = [];
  const selectedIds = new Set();
  const activeStreamingNames = Array.from(providerMap.entries())
    .filter(([, config]) => config.ids.length)
    .map(([name]) => name);
  const minimumPerStreaming = Math.max(2, Math.floor(target / Math.max(activeStreamingNames.length * 5, 1)));
  const recentQuota = Math.min(target, Math.round(target * RECENT_SHARE));

  const addItem = (item) => {
    if (!item || selected.length >= target || selectedIds.has(item.id)) return false;
    selected.push(item);
    selectedIds.add(item.id);
    return true;
  };

  // Garante variedade entre streamings, mas escolhe lançamentos de 2023 em diante primeiro.
  for (const streamingName of activeStreamingNames) {
    const options = pool
      .filter((item) => item.plataformas.includes(streamingName) && !selectedIds.has(item.id))
      .sort((a, b) => {
        if (isRecent(a) !== isRecent(b)) return isRecent(a) ? -1 : 1;
        return editorialPriority(b) - editorialPriority(a);
      })
      .slice(0, minimumPerStreaming);

    for (const item of options) addItem(item);
  }

  // Completa a cota editorial de títulos recentes.
  const recentSelected = () => selected.filter(isRecent).length;
  for (const item of pool.filter(isRecent).sort((a, b) => editorialPriority(b) - editorialPriority(a))) {
    if (selected.length >= target || recentSelected() >= recentQuota) break;
    addItem(item);
  }

  // Reserva o restante para clássicos e títulos anteriores que continuam relevantes.
  for (const item of pool.sort((a, b) => editorialPriority(b) - editorialPriority(a))) {
    if (selected.length >= target) break;
    addItem(item);
  }

  return selected.sort((a, b) => {
    if (isRecent(a) !== isRecent(b)) return isRecent(a) ? -1 : 1;
    return editorialPriority(b) - editorialPriority(a);
  });
}


const WEEKLY_HIGHLIGHT_CONFIG = path.join(ROOT, 'src/data/weeklyHighlight.js');

async function loadConfiguredWeeklyHighlight() {
  const configSource = await fs.readFile(WEEKLY_HIGHLIGHT_CONFIG, 'utf8');
  const slugMatch = configSource.match(/\bslug\s*:\s*['"`]([^'"`]+)['"`]/);
  const configuredSlug = slugMatch?.[1];

  if (!configuredSlug) {
    throw new Error('Não foi possível identificar o slug em src/data/weeklyHighlight.js.');
  }

  const currentCatalog = JSON.parse(await fs.readFile(OUTPUT, 'utf8'));
  const highlight = currentCatalog.find(
    (item) => item.slug === configuredSlug || item.id === configuredSlug
  );

  if (!highlight) {
    throw new Error(
      `O destaque semanal "${configuredSlug}" não foi encontrado em src/data/catalogo.json. ` +
      'O deploy foi interrompido para evitar um link que leve à página Vacilei.'
    );
  }

  return {
    ...highlight,
    destaque_semana: true,
    tag: highlight.tag || 'Destaque da Semana'
  };
}

function applyWeeklyHighlight(catalog, highlight = WEEKLY_HIGHLIGHT) {
  const highlightTerms = [highlight.slug, highlight.titulo, highlight.titulo_original, ...(highlight.aliases || [])]
    .filter(Boolean)
    .map(normalize);

  const matchesHighlight = (item) => {
    const values = [item.slug, item.titulo, item.titulo_original, ...(item.aliases || [])]
      .filter(Boolean)
      .map((value) => normalize(value));
    return values.some((value) => highlightTerms.includes(value));
  };

  const index = catalog.findIndex(matchesHighlight);
  if (index >= 0) {
    const existing = catalog[index];
    catalog[index] = {
      ...existing,
      ...highlight,
      id: existing.id || highlight.id,
      tmdb_id: existing.tmdb_id || highlight.tmdb_id,
      poster_url: existing.poster_url || highlight.poster_url,
      backdrop_url: existing.backdrop_url || highlight.backdrop_url,
      plataformas: [...new Set([...(existing.plataformas || []), ...(highlight.plataformas || [])])],
      fonte_dados: existing.fonte_dados ? `${existing.fonte_dados} + Curadoria SofáHype` : highlight.fonte_dados
    };
  } else {
    catalog.unshift(highlight);
  }

  return catalog;
}

async function main() {
  if (!TOKEN) {
    console.warn('TMDB_READ_ACCESS_TOKEN não encontrado. Mantendo o catálogo atual.');
    return;
  }

  const weeklyHighlight = await loadConfiguredWeeklyHighlight();

  console.log(`Destaque semanal preservado: ${weeklyHighlight.titulo}`);
  console.log('Iniciando importação TMDb para o SofáHype...');
  const movieProviderMap = await getProviderMap('movie');
  const tvProviderMap = await getProviderMap('tv');

  const movies = await importType('filme', TARGET_MOVIES, movieProviderMap);
  const series = await importType('serie', TARGET_SERIES, tvProviderMap);


  const catalog = applyWeeklyHighlight([...movies, ...series]
    .filter((item) => item.titulo && item.plataformas?.length), weeklyHighlight)
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
