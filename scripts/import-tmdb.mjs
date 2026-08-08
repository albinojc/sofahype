import fs from 'node:fs/promises';
import path from 'node:path';

const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const API = 'https://api.themoviedb.org/3';
const IMAGE = 'https://image.tmdb.org/t/p';
const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'src/data/catalogo.json');

const MIN_MOVIE_VOTES = Number(process.env.TMDB_MIN_MOVIE_VOTES || 120);
const MIN_TV_VOTES = Number(process.env.TMDB_MIN_TV_VOTES || 80);
const RECENT_START_YEAR = Number(process.env.TMDB_RECENT_START_YEAR || 2023);
const RECENT_SHARE = Math.max(0, Math.min(1, Number(process.env.TMDB_RECENT_SHARE || 0.75)));
const MOVIE_SHARE = Math.max(0, Math.min(1, Number(process.env.TMDB_MOVIE_SHARE || 0.65)));
const TODAY = new Date().toISOString().slice(0, 10);

const STREAMINGS = [
  { nome: 'Netflix', aliases: ['netflix'], region: 'BR' },
  { nome: 'Max', aliases: ['hbo max', 'max'], region: 'BR' },
  { nome: 'Prime Video', aliases: ['amazon prime video', 'prime video'], region: 'BR' },
  { nome: 'Disney+', aliases: ['disney plus', 'disney+'], region: 'BR' },
  { nome: 'Globoplay', aliases: ['globoplay'], region: 'BR' },
  { nome: 'Apple TV', aliases: ['apple tv plus', 'apple tv+', 'apple tv', 'apple tv plus amazon channel'], region: 'BR' },
  { nome: 'Paramount+', aliases: ['paramount plus', 'paramount+'], region: 'BR' }
];

const SUPPORTED_PLATFORM_NAMES = new Set(STREAMINGS.map((streaming) => streaming.nome));

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

function isValidReleasedDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || value > TODAY) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseRequestedCount(argv) {
  const countIndex = argv.findIndex((arg) => arg === '--count');
  const raw = countIndex >= 0 ? argv[countIndex + 1] : argv.find((arg) => /^\d+$/.test(arg));
  const count = Number(raw);
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('Informe a quantidade de novos títulos com --count. Exemplo: npm run catalog:import -- --count 1000');
  }
  return count;
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

  // Somente assinatura (flatrate) confirmada pelo TMDb na região brasileira.
  addFromRegion('BR');

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
  if (!isValidReleasedDate(date) || !details.poster_path || !details.backdrop_path) return null;

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
    data_lancamento: date,
    generos: genres,
    plataformas,
    nota_sofahype: null,
    nota_critica: null,
    nota_publico: null,
    nota_tmdb: Number(details.vote_average || 0) > 0 ? Number(details.vote_average).toFixed(1) : null,
    votos_tmdb: Number(details.vote_count || 0),
    popularidade_tmdb: Number(details.popularity || 0),
    duracao: runtime,
    tag: '',
    poster_url: details.poster_path ? `${IMAGE}/w500${details.poster_path}` : '',
    backdrop_url: details.backdrop_path ? `${IMAGE}/w1280${details.backdrop_path}` : '',
    sinopse: details.overview || 'Sinopse ainda não disponível em português.',
    ...experience,
    fonte_dados: 'TMDb',
    origem_importacao: 'tmdb',
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

  const rating = Number(item.nota_tmdb || 0) * 10;
  const votes = Math.min(Math.log10(Number(item.votos_tmdb || 0) + 1) * 10, 50);
  const popularity = Math.min(Number(item.popularidade_tmdb || 0), 100) / 5;
  return rating + votes + popularity + recencyBonus;
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

async function loadConfiguredWeeklyHighlight(catalog) {
  const configSource = await fs.readFile(WEEKLY_HIGHLIGHT_CONFIG, 'utf8');
  const slugMatch = configSource.match(/\bslug\s*:\s*['"`]([^'"`]+)['"`]/);
  const configuredSlug = slugMatch?.[1];

  if (!configuredSlug) {
    throw new Error('Não foi possível identificar o slug em src/data/weeklyHighlight.js.');
  }

  const highlight = catalog.find(
    (item) => item.slug === configuredSlug || item.id === configuredSlug
  );

  if (!highlight) {
    throw new Error(
      `O destaque semanal "${configuredSlug}" não foi encontrado em src/data/catalogo.json. ` +
      'O deploy foi interrompido para evitar um link que leve à página Vacilei.'
    );
  }

  const markedHighlights = catalog.filter((item) => item.destaque_semana === true);
  if (markedHighlights.length !== 1 || markedHighlights[0] !== highlight) {
    throw new Error('O catálogo deve ter exatamente um destaque_semana: true, correspondente ao slug configurado.');
  }

  return highlight;
}

function normalizedTitleKey(title, tipo, ano) {
  return `${tipo}|${String(ano || '').slice(0, 4)}|${normalize(title).replace(/[^a-z0-9]+/g, ' ').trim()}`;
}

function createIdentityIndex(catalog) {
  return {
    ids: new Set(catalog.map((item) => item.id).filter(Boolean)),
    slugs: new Set(catalog.map((item) => item.slug).filter(Boolean)),
    tmdb: new Set(catalog.filter((item) => item.tmdb_id).map((item) => `${item.tipo}|${item.tmdb_id}`)),
    titles: new Set(catalog.flatMap((item) => [
      normalizedTitleKey(item.titulo, item.tipo, item.ano),
      normalizedTitleKey(item.titulo_original, item.tipo, item.ano)
    ]).filter((key) => !key.endsWith('|')))
  };
}

function isDuplicate(item, index) {
  return index.ids.has(item.id) ||
    index.slugs.has(item.slug) ||
    index.tmdb.has(`${item.tipo}|${item.tmdb_id}`) ||
    index.titles.has(normalizedTitleKey(item.titulo, item.tipo, item.ano)) ||
    index.titles.has(normalizedTitleKey(item.titulo_original, item.tipo, item.ano));
}

function addToIdentityIndex(item, index) {
  index.ids.add(item.id);
  index.slugs.add(item.slug);
  index.tmdb.add(`${item.tipo}|${item.tmdb_id}`);
  index.titles.add(normalizedTitleKey(item.titulo, item.tipo, item.ano));
  index.titles.add(normalizedTitleKey(item.titulo_original, item.tipo, item.ano));
}

function validateImportedItem(item) {
  const problems = [];
  if (!item.tmdb_id) problems.push('tmdb_id ausente');
  if (!item.slug) problems.push('slug ausente');
  if (!item.titulo) problems.push('título ausente');
  if (!['filme', 'serie'].includes(item.tipo)) problems.push('tipo inválido');
  if (!isValidReleasedDate(item.data_lancamento)) problems.push('data de lançamento inválida ou futura');
  if (!item.poster_url) problems.push('poster_url ausente');
  if (!item.backdrop_url) problems.push('backdrop_url ausente');
  if (!item.plataformas?.length || item.plataformas.some((name) => !SUPPORTED_PLATFORM_NAMES.has(name))) problems.push('plataforma inválida');
  if (item.nota_sofahype !== null || item.nota_critica !== null || item.nota_publico !== null) problems.push('notas editoriais devem ser null');
  return problems;
}

async function main() {
  const requestedCount = parseRequestedCount(process.argv.slice(2));
  if (!TOKEN) {
    throw new Error('TMDB_READ_ACCESS_TOKEN não encontrado. Nenhuma alteração foi feita.');
  }

  const source = await fs.readFile(OUTPUT, 'utf8');
  const currentCatalog = JSON.parse(source);
  const weeklyHighlight = await loadConfiguredWeeklyHighlight(currentCatalog);
  const weeklyHighlightSnapshot = JSON.stringify(weeklyHighlight);
  const identityIndex = createIdentityIndex(currentCatalog);
  const movieTarget = Math.round(requestedCount * MOVIE_SHARE);
  const seriesTarget = requestedCount - movieTarget;

  console.log(`Destaque semanal preservado: ${weeklyHighlight.titulo}`);
  console.log(`Importação incremental solicitada: ${requestedCount} novos títulos (${movieTarget} filmes e ${seriesTarget} séries).`);
  const movieProviderMap = await getProviderMap('movie');
  const tvProviderMap = await getProviderMap('tv');

  const movies = await importType('filme', movieTarget + Math.ceil(movieTarget * 0.25), movieProviderMap);
  const series = await importType('serie', seriesTarget + Math.ceil(seriesTarget * 0.25), tvProviderMap);
  const selected = [];

  function select(items, target) {
    let added = 0;
    const recentTarget = Math.round(target * RECENT_SHARE);
    const tryAdd = (item) => {
      const baseSlug = item.slug;
      if (identityIndex.slugs.has(item.slug)) item.slug = `${baseSlug}-${item.tmdb_id}`;
      if (isDuplicate(item, identityIndex)) return false;
      const problems = validateImportedItem(item);
      if (problems.length) return false;
      selected.push(item);
      addToIdentityIndex(item, identityIndex);
      added += 1;
      return true;
    };

    let recentAdded = 0;
    for (const item of items.filter(isRecent)) {
      if (recentAdded >= recentTarget) break;
      if (tryAdd(item)) recentAdded += 1;
    }
    for (const item of items.filter((item) => !isRecent(item))) {
      if (added >= target) break;
      tryAdd(item);
    }
    for (const item of items.filter(isRecent)) {
      if (added >= target) break;
      tryAdd(item);
    }
  }

  select(movies, movieTarget);
  select(series, seriesTarget);

  if (selected.length !== requestedCount) {
    throw new Error(`Foram encontrados ${selected.length} títulos inéditos válidos de ${requestedCount} solicitados. O catálogo foi mantido intacto.`);
  }

  const catalog = [...currentCatalog, ...selected];
  const preservedHighlight = catalog.find((item) => item === weeklyHighlight);
  if (!preservedHighlight || JSON.stringify(preservedHighlight) !== weeklyHighlightSnapshot) {
    throw new Error('A preservação integral do Destaque da Semana falhou. O catálogo foi mantido intacto.');
  }

  await fs.writeFile(OUTPUT, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Catálogo atualizado de forma incremental: ${currentCatalog.length} preservados + ${selected.length} novos = ${catalog.length} títulos.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
