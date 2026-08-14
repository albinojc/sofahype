import fs from 'node:fs/promises';
import { existsSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectarPlataformasSofahype,
  executarAutotesteProviders,
  nomesCanonicosSofahype,
  normalizarPlataformasHistoricas
} from './streaming-providers.mjs';

const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const API = 'https://api.themoviedb.org/3';
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const CATALOG_PATH = path.join(ROOT, 'src/data/catalogo.json');
const MAX_CONCURRENCY = 5;
const MAX_ATTEMPTS = 4;
const EXPECTED_WRITE_TOTAL = 2436;
const TODAY = new Date().toISOString().slice(0, 10);
const AVAILABILITY_FIELDS = new Set([
  'plataformas',
  'status_disponibilidade',
  'verificacao_disponibilidade'
]);

function usageError(message) {
  throw new Error(
    `${message}\nUso: node scripts/sync-availability.mjs ` +
    '[--limit N] [--json <caminho>] [--output-catalog <caminho>] ' +
    '[--write --confirm APPLY_AVAILABILITY_SYNC --expect-sha256 <hash> --require-zero-errors]'
  );
}

function comparablePath(value) {
  const resolved = path.resolve(value);
  if (existsSync(resolved)) return realpathSync(resolved);
  const realParent = existsSync(path.dirname(resolved))
    ? realpathSync(path.dirname(resolved))
    : path.dirname(resolved);
  return path.join(realParent, path.basename(resolved));
}

function assertNotRealCatalog(outputPath, optionName) {
  if (outputPath && comparablePath(outputPath) === comparablePath(CATALOG_PATH)) {
    usageError(`${optionName} não pode apontar para src/data/catalogo.json nem para caminho equivalente.`);
  }
}

function parseArgs(argv) {
  const options = {
    limit: null,
    jsonPath: null,
    outputCatalogPath: null,
    write: false,
    confirm: null,
    expectedSha256: null,
    requireZeroErrors: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--limit') {
      const value = Number(argv[++index]);
      if (!Number.isInteger(value) || value <= 0) usageError('--limit exige um inteiro positivo.');
      options.limit = value;
    } else if (argument === '--json' || argument === '--output-catalog') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) usageError(`${argument} exige um caminho.`);
      const resolved = path.resolve(value);
      if (argument === '--json') options.jsonPath = resolved;
      else options.outputCatalogPath = resolved;
    } else if (argument === '--write') {
      options.write = true;
    } else if (argument === '--require-zero-errors') {
      options.requireZeroErrors = true;
    } else if (argument === '--confirm' || argument === '--expect-sha256') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) usageError(`${argument} exige um valor.`);
      if (argument === '--confirm') options.confirm = value;
      else options.expectedSha256 = value;
    } else {
      usageError(`Opção desconhecida: ${argument}`);
    }
  }

  assertNotRealCatalog(options.jsonPath, '--json');
  assertNotRealCatalog(options.outputCatalogPath, '--output-catalog');
  if (options.outputCatalogPath && options.limit) {
    usageError('--output-catalog exige a sincronização completa e não pode ser combinado com --limit.');
  }
  if (options.write && options.limit) usageError('--write não pode ser combinado com --limit.');
  if (options.write && options.confirm !== 'APPLY_AVAILABILITY_SYNC') {
    usageError('--write exige --confirm APPLY_AVAILABILITY_SYNC.');
  }
  if (options.write && !/^[a-f0-9]{64}$/i.test(options.expectedSha256 || '')) {
    usageError('--write exige --expect-sha256 com um SHA-256 válido.');
  }
  if (!options.write && (options.confirm || options.expectedSha256 || options.requireZeroErrors)) {
    usageError('--confirm, --expect-sha256 e --require-zero-errors só podem ser usados com --write.');
  }
  return options;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function retryDelay(response, attempt) {
  const retryAfter = response?.headers?.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  return 500 * (2 ** (attempt - 1));
}

async function consultar(endpoint) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${API}${endpoint}`, {
        headers: { accept: 'application/json', authorization: `Bearer ${TOKEN}` }
      });
      if (response.ok) return { data: await response.json(), error: null };

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS) {
        return { data: null, error: `TMDb HTTP ${response.status} após ${attempt} tentativa(s)` };
      }
      await sleep(retryDelay(response, attempt));
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        return { data: null, error: `Falha de rede após ${attempt} tentativa(s): ${error.message}` };
      }
      await sleep(500 * (2 ** (attempt - 1)));
    }
  }
}

function mediaType(item) {
  if (item.tipo === 'filme') return 'movie';
  if (item.tipo === 'serie') return 'tv';
  return null;
}

function baseRecord(item) {
  const gravadas = Array.isArray(item.plataformas) ? item.plataformas : [];
  return {
    id: item.id ?? null,
    tmdb_id: item.tmdb_id ?? null,
    tipo: item.tipo ?? null,
    titulo: item.titulo ?? null,
    plataformas_gravadas: gravadas,
    plataformas_gravadas_normalizadas: normalizarPlataformasHistoricas(gravadas),
    status_disponibilidade_anterior: item.status_disponibilidade ?? null
  };
}

function candidatePreservingAvailability(item, verification) {
  return { ...item, verificacao_disponibilidade: verification };
}

function preservePlatformOrder(recorded, detected) {
  const normalizedRecorded = normalizarPlataformasHistoricas(recorded);
  const continuing = normalizedRecorded.filter((platform) => detected.includes(platform));
  const additions = detected.filter((platform) => !continuing.includes(platform));
  return [...continuing, ...additions];
}

function classifyNoPlatform(item, details, detailsError) {
  const previous = item.status_disponibilidade;
  const fallback = previous ?? 'sem_plataforma_monitorada';
  if (detailsError || !details) {
    return {
      status: fallback,
      manualReview: true,
      reason: `Detalhes insuficientes: ${detailsError || 'resposta vazia'}`
    };
  }

  const date = item.tipo === 'filme' ? details.release_date : details.first_air_date;
  const status = details.status ?? null;
  const unreleasedStatuses = new Set(['Planned', 'In Production', 'Post Production']);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    return { status: fallback, manualReview: true, reason: 'Data de lançamento ausente ou inválida.' };
  }

  const future = date > TODAY;
  const markedUnreleased = unreleasedStatuses.has(status);
  const markedReleased = status === 'Released';
  if ((future && markedReleased) || (!future && markedUnreleased)) {
    return {
      status: fallback,
      manualReview: true,
      reason: `Data e status TMDb conflitantes: data=${date}, status=${status}.`
    };
  }
  if (future || markedUnreleased) {
    return { status: 'em_breve', manualReview: false, reason: `Ainda não estreou: data=${date}, status=${status}.` };
  }
  return {
    status: 'sem_plataforma_monitorada',
    manualReview: false,
    reason: `Já estreou e não possui plataforma monitorada: data=${date}, status=${status}.`
  };
}

async function analisarTitulo(item) {
  const base = baseRecord(item);
  if (item.tmdb_id === null || item.tmdb_id === undefined || item.tmdb_id === '') {
    return {
      candidate: candidatePreservingAvailability(item, 'sem_tmdb_id'),
      audit: {
        ...base,
        plataformas_detectadas: null,
        plataformas_que_entraram: [],
        plataformas_que_sairam: [],
        mudou_plataforma: false,
        status_disponibilidade_novo: item.status_disponibilidade ?? null,
        verificacao_disponibilidade: 'sem_tmdb_id',
        revisao_manual: false,
        detalhe_classificacao: 'Registro sem tmdb_id; disponibilidade preservada.',
        erro: null
      }
    };
  }

  const type = mediaType(item);
  if (!type) {
    const error = `tipo não suportado: ${item.tipo}`;
    return {
      candidate: candidatePreservingAvailability(item, 'erro'),
      audit: {
        ...base, plataformas_detectadas: null, plataformas_que_entraram: [],
        plataformas_que_sairam: [], mudou_plataforma: false,
        status_disponibilidade_novo: item.status_disponibilidade ?? null,
        verificacao_disponibilidade: 'erro', revisao_manual: false,
        detalhe_classificacao: 'Tipo inválido; disponibilidade preservada.', erro
      }
    };
  }

  const watch = await consultar(`/${type}/${item.tmdb_id}/watch/providers`);
  if (watch.error) {
    return {
      candidate: candidatePreservingAvailability(item, 'erro'),
      audit: {
        ...base, plataformas_detectadas: null, plataformas_que_entraram: [],
        plataformas_que_sairam: [], mudou_plataforma: false,
        status_disponibilidade_novo: item.status_disponibilidade ?? null,
        verificacao_disponibilidade: 'erro', revisao_manual: false,
        detalhe_classificacao: 'Falha em watch/providers; disponibilidade preservada.', erro: watch.error
      }
    };
  }

  const detected = detectarPlataformasSofahype({
    brFlatrate: watch.data?.results?.BR?.flatrate || [],
    usFlatrate: watch.data?.results?.US?.flatrate || []
  });
  const entered = detected.filter((platform) => !base.plataformas_gravadas_normalizadas.includes(platform));
  const exited = base.plataformas_gravadas_normalizadas.filter((platform) => !detected.includes(platform));
  const orderedDetected = preservePlatformOrder(base.plataformas_gravadas, detected);
  let status = 'ativo';
  let manualReview = false;
  let classificationDetail = 'Ao menos uma plataforma monitorada foi detectada.';

  if (detected.length === 0) {
    const details = await consultar(`/${type}/${item.tmdb_id}?language=pt-BR`);
    const classification = classifyNoPlatform(item, details.data, details.error);
    status = classification.status;
    manualReview = classification.manualReview;
    classificationDetail = classification.reason;
  }

  return {
    candidate: {
      ...item,
      plataformas: orderedDetected,
      status_disponibilidade: status,
      verificacao_disponibilidade: 'verificado'
    },
    audit: {
      ...base,
      plataformas_detectadas: detected,
      plataformas_que_entraram: entered,
      plataformas_que_sairam: exited,
      mudou_plataforma: entered.length > 0 || exited.length > 0,
      status_disponibilidade_novo: status,
      verificacao_disponibilidade: 'verificado',
      revisao_manual: manualReview,
      detalhe_classificacao: classificationDetail,
      erro: null
    }
  };
}

function duplicateGroups(items, keyFor) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFor(item);
    if (!key) continue;
    const values = groups.get(key) || [];
    values.push({ id: item.id, titulo: item.titulo });
    groups.set(key, values);
  }
  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([key, values]) => ({ key, registros: values }));
}

function editorialSnapshot(item) {
  return Object.fromEntries(Object.entries(item).filter(([key]) => !AVAILABILITY_FIELDS.has(key)));
}

function validateCandidate(original, candidate) {
  const canonical = new Set(nomesCanonicosSofahype());
  const idsDuplicados = duplicateGroups(candidate, (item) => item.id);
  const slugsDuplicados = duplicateGroups(candidate, (item) => item.slug);
  const tmdbDuplicados = duplicateGroups(
    candidate,
    (item) => item.tmdb_id ? `${item.tipo}|${item.tmdb_id}` : null
  );
  const maxRestantes = candidate.filter((item) => item.plataformas?.includes('Max')).map((item) => item.id);
  const plataformasInvalidas = candidate.flatMap((item) =>
    (item.plataformas || [])
      .filter((platform) => !canonical.has(platform))
      .map((platform) => ({ id: item.id, plataforma: platform }))
  );
  const statusEditorialAlterado = candidate
    .filter((item, index) => item.status !== original[index]?.status)
    .map((item) => item.id);
  const camposEditoriaisAlterados = candidate
    .filter((item, index) => JSON.stringify(editorialSnapshot(item)) !== JSON.stringify(editorialSnapshot(original[index] || {})))
    .map((item) => item.id);
  const ordemPreservada = candidate.every((item, index) => item.id === original[index]?.id);

  return {
    total_esperado: original.length,
    total_candidato: candidate.length,
    ids_duplicados: idsDuplicados,
    slugs_duplicados: slugsDuplicados,
    tipo_tmdb_id_duplicados: tmdbDuplicados,
    valores_max_restantes: maxRestantes,
    plataformas_invalidas: plataformasInvalidas,
    status_editorial_alterado: statusEditorialAlterado,
    campos_editoriais_alterados_ou_ausentes: camposEditoriaisAlterados,
    registros_perdidos: original.filter((item) => !candidate.some((candidateItem) => candidateItem.id === item.id)).map((item) => item.id),
    registros_adicionados: candidate.filter((item) => !original.some((originalItem) => originalItem.id === item.id)).map((item) => item.id),
    ordem_preservada: ordemPreservada
  };
}

function assertSafeCandidate(original, candidate, report) {
  const validation = report.validacao;
  const failures = [];
  if (original.length !== EXPECTED_WRITE_TOTAL) failures.push(`total original ${original.length}`);
  if (candidate.length !== EXPECTED_WRITE_TOTAL) failures.push(`total candidato ${candidate.length}`);
  if (validation.ids_duplicados.length) failures.push('IDs duplicados');
  if (validation.slugs_duplicados.length) failures.push('slugs duplicados');
  if (validation.tipo_tmdb_id_duplicados.length) failures.push('tipo + tmdb_id duplicados');
  if (validation.registros_perdidos.length) failures.push('registros perdidos');
  if (validation.registros_adicionados.length) failures.push('registros novos');
  if (!validation.ordem_preservada) failures.push('ordem de IDs alterada');
  if (validation.valores_max_restantes.length) failures.push('valor Max remanescente');
  if (validation.plataformas_invalidas.length) failures.push('plataformas inválidas');
  if (validation.campos_editoriais_alterados_ou_ausentes.length) failures.push('campos editoriais alterados');
  if (validation.status_editorial_alterado.length) failures.push('status editorial alterado');

  const allowedAvailability = new Set(['ativo', 'sem_plataforma_monitorada', 'em_breve']);
  const allowedVerification = new Set(['verificado', 'erro', 'sem_tmdb_id']);
  if (candidate.some((item) => !allowedAvailability.has(item.status_disponibilidade))) {
    failures.push('status_disponibilidade inválido ou ausente');
  }
  if (candidate.some((item) => !allowedVerification.has(item.verificacao_disponibilidade))) {
    failures.push('verificacao_disponibilidade inválida ou ausente');
  }
  if (candidate.some((item) => item.status_disponibilidade === 'sem_plataforma_monitorada' && item.plataformas?.length)) {
    failures.push('título sem_plataforma_monitorada com plataformas');
  }
  if (candidate.some((item) => item.status_disponibilidade === 'ativo' && !item.plataformas?.length && item.verificacao_disponibilidade !== 'erro')) {
    failures.push('título ativo sem plataforma');
  }
  const lastHouse = candidate.find((item) => item.id === 'a-ultima-casa');
  if (!lastHouse || lastHouse.tmdb_id !== 1284041) failures.push('tmdb_id de A Última Casa não preservado');

  if (failures.length) throw new Error(`Catálogo candidato reprovado: ${failures.join('; ')}.`);
}

async function atomicWriteCatalog(originalSource, serializedCandidate, expectedSha256) {
  const currentSource = await fs.readFile(CATALOG_PATH, 'utf8');
  const currentSha = sha256(currentSource);
  if (currentSha !== expectedSha256 || currentSource !== originalSource) {
    throw new Error(`Catálogo mudou durante a sincronização. Esperado ${expectedSha256}, encontrado ${currentSha}. Nenhuma escrita realizada.`);
  }

  const temporaryPath = path.join(
    path.dirname(CATALOG_PATH),
    `.${path.basename(CATALOG_PATH)}.${process.pid}.tmp`
  );
  try {
    await fs.writeFile(temporaryPath, serializedCandidate, { encoding: 'utf8', flag: 'wx' });
    const temporarySource = await fs.readFile(temporaryPath, 'utf8');
    const parsed = JSON.parse(temporarySource);
    if (!Array.isArray(parsed) || parsed.length !== EXPECTED_WRITE_TOTAL) {
      throw new Error('Arquivo temporário não contém o catálogo completo esperado.');
    }
    await fs.rename(temporaryPath, CATALOG_PATH);
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

function comparisonSummary(original, candidate) {
  const result = {
    somente_plataformas_alteradas: 0,
    somente_novos_campos_disponibilidade: 0,
    plataformas_e_campos_disponibilidade: 0,
    nenhuma_mudanca_material: 0
  };
  candidate.forEach((item, index) => {
    const previous = original[index];
    const platformChanged = JSON.stringify(previous.plataformas || []) !== JSON.stringify(item.plataformas || []);
    const statusChanged = previous.status_disponibilidade !== item.status_disponibilidade ||
      previous.verificacao_disponibilidade !== item.verificacao_disponibilidade;
    if (platformChanged && statusChanged) result.plataformas_e_campos_disponibilidade += 1;
    else if (platformChanged) result.somente_plataformas_alteradas += 1;
    else if (statusChanged) result.somente_novos_campos_disponibilidade += 1;
    else result.nenhuma_mudanca_material += 1;
  });
  return result;
}

function buildReport(original, candidate, records) {
  const verified = records.filter((record) => record.verificacao_disponibilidade === 'verificado');
  const changed = verified.filter((record) => record.mudou_plataforma);
  const onlyMaxNormalization = verified.filter((record) =>
    record.plataformas_gravadas.includes('Max') &&
    !record.mudou_plataforma
  );
  const platformCounts = Object.fromEntries(nomesCanonicosSofahype().map((name) => [
    name,
    candidate.filter((item) => item.plataformas?.includes(name)).length
  ]));
  const canonicalOrderChanges = records.filter((record, index) =>
    record.verificacao_disponibilidade === 'verificado' &&
    JSON.stringify(original[index].plataformas || []) !== JSON.stringify(record.plataformas_detectadas || [])
  ).length;
  const actualArrayChanges = candidate.filter((item, index) =>
    JSON.stringify(original[index].plataformas || []) !== JSON.stringify(item.plataformas || [])
  ).length;

  return {
    metadata: {
      data_execucao: TODAY,
      total_registros: original.length,
      somente_flatrate: true,
      regiao_principal: 'BR',
      regiao_hulu: 'US',
      concorrencia_maxima: MAX_CONCURRENCY,
      tentativas_maximas: MAX_ATTEMPTS
    },
    resumo: {
      total_registros: original.length,
      verificados: verified.length,
      erros: records.filter((record) => record.verificacao_disponibilidade === 'erro').length,
      sem_tmdb_id: records.filter((record) => record.verificacao_disponibilidade === 'sem_tmdb_id').length,
      ativos: candidate.filter((item) => item.status_disponibilidade === 'ativo').length,
      sem_plataforma_monitorada: candidate.filter((item) => item.status_disponibilidade === 'sem_plataforma_monitorada').length,
      em_breve: candidate.filter((item) => item.status_disponibilidade === 'em_breve').length,
      plataformas_adicionadas: changed.reduce((sum, record) => sum + record.plataformas_que_entraram.length, 0),
      plataformas_removidas: changed.reduce((sum, record) => sum + record.plataformas_que_sairam.length, 0),
      titulos_com_mudanca_plataforma: changed.length,
      arrays_plataformas_alterados: actualArrayChanges,
      reordenacoes_desnecessarias_evitadas: canonicalOrderChanges - actualArrayChanges,
      titulos_somente_max_para_hbo_max: onlyMaxNormalization.length,
      hulu_adicionados: verified.filter((record) => record.plataformas_que_entraram.includes('Hulu')).length,
      ficaram_sem_plataforma_monitorada: verified.filter((record) =>
        record.status_disponibilidade_novo === 'sem_plataforma_monitorada' &&
        record.plataformas_gravadas_normalizadas.length > 0
      ).length,
      reativados: verified.filter((record) =>
        record.status_disponibilidade_anterior &&
        record.status_disponibilidade_anterior !== 'ativo' &&
        record.status_disponibilidade_novo === 'ativo'
      ).length,
      revisao_manual: records.filter((record) => record.revisao_manual).length
    },
    contagem_final_por_plataforma: platformCounts,
    comparacao_catalogos: comparisonSummary(original, candidate),
    validacao: validateCandidate(original, candidate),
    registros: records
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!TOKEN) throw new Error('TMDB_READ_ACCESS_TOKEN não está disponível. Nenhuma alteração foi feita.');
  executarAutotesteProviders();

  const source = await fs.readFile(CATALOG_PATH, 'utf8');
  const sourceSha256 = sha256(source);
  if (options.write && sourceSha256 !== options.expectedSha256) {
    throw new Error(`SHA-256 divergente. Esperado ${options.expectedSha256}, encontrado ${sourceSha256}. Nenhuma escrita realizada.`);
  }
  const catalog = JSON.parse(source);
  const selected = options.limit ? catalog.slice(0, options.limit) : catalog;
  const analyzed = new Array(selected.length);
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= selected.length) return;
      analyzed[index] = await analisarTitulo(selected[index]);
      completed += 1;
      if (completed % 100 === 0 || completed === selected.length) {
        console.log(`Verificados ${completed} / ${selected.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, selected.length) }, worker));
  const candidate = analyzed.map((result) => result.candidate);
  const records = analyzed.map((result) => result.audit);
  const report = buildReport(selected, candidate, records);
  if (!options.limit) assertSafeCandidate(selected, candidate, report);
  if (options.write && options.requireZeroErrors && report.resumo.erros > 0) {
    throw new Error(`--require-zero-errors recusou a escrita: ${report.resumo.erros} erro(s) de API.`);
  }
  const serializedCandidate = `${JSON.stringify(candidate, null, 2)}\n`;

  if (options.outputCatalogPath) {
    await fs.writeFile(options.outputCatalogPath, serializedCandidate, 'utf8');
    console.log(`Catálogo candidato salvo em ${options.outputCatalogPath}`);
  }
  if (options.jsonPath) {
    await fs.writeFile(options.jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Relatório JSON salvo em ${options.jsonPath}`);
  }
  if (options.write) {
    await atomicWriteCatalog(source, serializedCandidate, options.expectedSha256);
    console.log(`Catálogo atualizado atomicamente: ${candidate.length} registros.`);
  }
  console.log(JSON.stringify(report.resumo, null, 2));
}

main().catch((error) => {
  console.error(`ERRO: ${error.message}`);
  process.exitCode = 1;
});
