const STRONG_CERTIFICATIONS = new Set(['16', '18', 'TV-MA', 'R', 'NC-17']);
const INTERMEDIATE_CERTIFICATIONS = new Set(['14', 'TV-14', 'PG-13']);
const LOW_CERTIFICATIONS = new Set(['L', 'LIVRE', '10', 'G', 'PG', 'TV-G', 'TV-Y', 'TV-Y7', 'TV-PG']);

const EXPERIENCE_FIELDS = ['experiencia', 'ideal_para', 'talvez_nao_seja'];
const POSITIVE_FIELDS = ['experiencia', 'ideal_para'];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const CHILD_POSITIVE = new Set([
  'ver com criancas',
  'aventura para criancas',
  'para criancas',
  'infantil',
  'conteudo infantil',
  'diversao infantil',
  'para toda a familia',
  'diversao em familia'
]);

const ADULT_POSITIVE = new Set([
  'humor adulto',
  'animacao com historia adulta',
  'clima adulto'
]);

const ADULT_NEGATIVE = new Set(['filme adulto', 'serie adulta', 'conteudo adulto']);

const SERIES_REPLACEMENTS = new Map([
  ['filme adulto', 'conteúdo adulto']
]);

const MOVIE_SERIES_ONLY = new Set([
  'para acompanhar em episodios',
  'maratonar ou acompanhar aos poucos',
  'acompanhar episodios',
  'acompanhar temporadas'
]);

export function normalizeCertification(raw) {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';
  if (['NR', 'NOT RATED', 'NOT-RATED', 'UNRATED'].includes(value)) return '';
  if (/^(L|LIVRE)$/.test(value)) return value;
  const brNumber = value.match(/^(10|12|14|16|18)(?:\s*ANOS?)?$/)?.[1];
  return brNumber || value.replace(/\s+/g, '-');
}

export function classificationLevel(certification) {
  const normalized = normalizeCertification(certification);
  if (!normalized || normalized === 'NR' || normalized === 'NOT-RATED' || normalized === 'UNRATED') return 'sem_classificacao';
  if (STRONG_CERTIFICATIONS.has(normalized)) return 'forte';
  if (INTERMEDIATE_CERTIFICATIONS.has(normalized)) return 'intermediaria';
  if (LOW_CERTIFICATIONS.has(normalized)) return 'baixa';
  return 'outra';
}

function pickCertification(entries, country) {
  const values = entries.map(normalizeCertification).filter(Boolean);
  const rank = (value) => {
    if (STRONG_CERTIFICATIONS.has(value)) return 4;
    if (INTERMEDIATE_CERTIFICATIONS.has(value)) return 3;
    if (LOW_CERTIFICATIONS.has(value)) return 2;
    return 1;
  };
  const selected = values.sort((a, b) => rank(b) - rank(a))[0];
  return selected
    ? { classificacao_etaria: selected, classificacao_etaria_pais: country }
    : null;
}

export function extractAgeClassification(data, tipo) {
  const byCountry = new Map();
  if (tipo === 'serie') {
    for (const result of data?.results || []) {
      const country = result.iso_3166_1;
      if (!byCountry.has(country)) byCountry.set(country, []);
      byCountry.get(country).push(result.rating);
    }
  } else {
    for (const result of data?.results || []) {
      const country = result.iso_3166_1;
      if (!byCountry.has(country)) byCountry.set(country, []);
      byCountry.get(country).push(...(result.release_dates || []).map((release) => release.certification));
    }
  }

  return pickCertification(byCountry.get('BR') || [], 'BR')
    || pickCertification(byCountry.get('US') || [], 'US')
    || { classificacao_etaria: null, classificacao_etaria_pais: null };
}

export function ageEndpoint(tipo, tmdbId) {
  return tipo === 'serie'
    ? `/tv/${tmdbId}/content_ratings`
    : `/movie/${tmdbId}/release_dates`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isAnimation(item) {
  return (item.generos || []).some((genre) => normalize(genre) === 'animacao');
}

export function applyEditorialSafety(item, classification) {
  const result = structuredClone(item);
  result.classificacao_etaria = classification?.classificacao_etaria || null;
  result.classificacao_etaria_pais = classification?.classificacao_etaria_pais || null;
  const level = classificationLevel(result.classificacao_etaria);

  for (const field of EXPERIENCE_FIELDS) result[field] = [...(result[field] || [])];

  if (level === 'forte') {
    let removedChildClaim = false;
    for (const field of POSITIVE_FIELDS) {
      result[field] = result[field].filter((value) => {
        const remove = CHILD_POSITIVE.has(normalize(value));
        if (remove) removedChildClaim = true;
        return !remove;
      });
    }
    result.talvez_nao_seja = result.talvez_nao_seja.filter((value) => !ADULT_NEGATIVE.has(normalize(value)));
    if (removedChildClaim && isAnimation(result)) result.ideal_para = unique([...result.ideal_para, 'animação adulta']);
    if (removedChildClaim) result.talvez_nao_seja = unique([...result.talvez_nao_seja, 'assistir com crianças']);
  } else if (level === 'baixa' && hasChildSafetySignal(result)) {
    for (const field of POSITIVE_FIELDS) {
      result[field] = result[field].filter((value) => !ADULT_POSITIVE.has(normalize(value)));
    }
  }

  // Correções de linguagem estrutural são objetivas e independem de inferência etária.
  if (result.tipo === 'serie') {
    for (const field of EXPERIENCE_FIELDS) {
      result[field] = result[field].flatMap((value) => {
        const normalized = normalize(value);
        if (level === 'forte' && field === 'talvez_nao_seja' && ADULT_NEGATIVE.has(normalized)) return [];
        return [SERIES_REPLACEMENTS.get(normalized) || value];
      });
    }
  }

  return result;
}

export function findEditorialSafetyViolations(item) {
  const violations = [];
  const level = classificationLevel(item.classificacao_etaria);
  if (level === 'forte') {
    for (const field of POSITIVE_FIELDS) {
      for (const value of item[field] || []) {
        if (CHILD_POSITIVE.has(normalize(value))) violations.push(`classificação madura com indicação infantil em ${field}: ${value}`);
      }
    }
  }
  if (item.tipo === 'serie') {
    for (const field of EXPERIENCE_FIELDS) {
      for (const value of item[field] || []) {
        if (SERIES_REPLACEMENTS.has(normalize(value))) violations.push(`série com linguagem exclusiva de filme em ${field}: ${value}`);
      }
    }
  }
  if (item.tipo === 'filme') {
    for (const field of EXPERIENCE_FIELDS) {
      for (const value of item[field] || []) {
        if (MOVIE_SERIES_ONLY.has(normalize(value))) violations.push(`filme com linguagem exclusiva de série em ${field}: ${value}`);
      }
    }
  }
  return violations;
}

export function hasChildSafetySignal(item) {
  const hasPositiveClaim = POSITIVE_FIELDS.some((field) => (item[field] || []).some((value) => CHILD_POSITIVE.has(normalize(value))));
  const hasFamilyGenre = (item.generos || []).some((genre) => ['familia', 'kids'].includes(normalize(genre)));
  return hasPositiveClaim || hasFamilyGenre;
}

export const editorialSafetySets = {
  childPositive: CHILD_POSITIVE,
  adultPositive: ADULT_POSITIVE
};
