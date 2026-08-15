import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ageEndpoint,
  applyEditorialSafety,
  classificationLevel,
  extractAgeClassification,
  findEditorialSafetyViolations,
  hasChildSafetySignal
} from './editorial-safety.mjs';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'src/data/catalogo.json');
const OUTPUT = '/tmp/sofahype-catalogo-editorial-candidato-v3.json';
const REPORT = '/tmp/sofahype-editorial-review-v3.json';
const API = 'https://api.themoviedb.org/3';
const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const CONCURRENCY = 12;
const FIELDS = ['experiencia', 'ideal_para', 'talvez_nao_seja'];

async function tmdb(endpoint) {
  const response = await fetch(`${API}${endpoint}`, {
    headers: { accept: 'application/json', authorization: `Bearer ${TOKEN}` }
  });
  if (!response.ok) throw new Error(`TMDb ${response.status} em ${endpoint}`);
  return response.json();
}

async function main() {
  const sourceText = await fs.readFile(SOURCE, 'utf8');
  const original = JSON.parse(sourceText);
  const needsClassificationLookup = original.some((item) =>
    !Object.hasOwn(item, 'classificacao_etaria') || !Object.hasOwn(item, 'classificacao_etaria_pais')
  );
  if (needsClassificationLookup && !TOKEN) throw new Error('TMDB_READ_ACCESS_TOKEN não disponível.');
  const candidate = new Array(original.length);
  const intermediateReview = [];
  const unclassifiedReview = [];
  const apiErrors = [];
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= original.length) return;
      const item = original[index];
      const hasPersistedClassification = Object.hasOwn(item, 'classificacao_etaria')
        && Object.hasOwn(item, 'classificacao_etaria_pais');
      let classification = hasPersistedClassification
        ? {
            classificacao_etaria: item.classificacao_etaria,
            classificacao_etaria_pais: item.classificacao_etaria_pais
          }
        : { classificacao_etaria: null, classificacao_etaria_pais: null };
      if (!hasPersistedClassification && item.tmdb_id) {
        try {
          classification = extractAgeClassification(await tmdb(ageEndpoint(item.tipo, item.tmdb_id)), item.tipo);
        } catch (error) {
          apiErrors.push({ titulo: item.titulo, tipo: item.tipo, tmdb_id: item.tmdb_id, erro: error.message });
        }
      }
      const level = classificationLevel(classification.classificacao_etaria);
      candidate[index] = applyEditorialSafety(item, classification);
      if ((level === 'intermediaria' || level === 'sem_classificacao') && hasChildSafetySignal(item)) {
        const entry = {
          titulo: item.titulo,
          tipo: item.tipo,
          tmdb_id: item.tmdb_id || null,
          certificacao: classification.classificacao_etaria,
          pais_certificacao: classification.classificacao_etaria_pais,
          campos_atuais: Object.fromEntries(FIELDS.map((field) => [field, item[field] || []])),
          motivo: level === 'intermediaria' ? 'classificação intermediária exige revisão humana' : 'sem classificação BR/US'
        };
        (level === 'intermediaria' ? intermediateReview : unclassifiedReview).push(entry);
      }
      if ((index + 1) % 100 === 0) console.log(`Registros processados: ${index + 1}/${original.length}`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (apiErrors.length) throw new Error(`${apiErrors.length} erro(s) de API; candidato não foi gravado.`);

  const violations = candidate.flatMap((item) => findEditorialSafetyViolations(item).map((violation) => ({ titulo: item.titulo, violation })));
  if (violations.length) throw new Error(`${violations.length} violação(ões) editorial(is) permaneceram no candidato.`);

  const occurrences = (phrase) => original.flatMap((item) => FIELDS.flatMap((field) =>
    (item[field] || []).filter((value) => value === phrase).map(() => ({
      titulo: item.titulo,
      tipo: item.tipo,
      tmdb_id: item.tmdb_id || null,
      campo: field,
      valor: phrase,
      motivo: 'expressão editorial preservada para revisão humana'
    }))
  ));
  const editorialReview = {
    humor_mais_pesado: occurrences('Humor mais pesado'),
    animacao_para_publico_mais_velho: occurrences('Animação para público mais velho'),
    outro_estilo_de_filme_ou_serie: occurrences('outro estilo de filme ou série')
  };
  const report = {
    intermediarios: intermediateReview,
    sem_certificacao: unclassifiedReview,
    revisao_editorial_recomendada: editorialReview
  };

  await fs.writeFile(OUTPUT, `${JSON.stringify(candidate, null, 2)}\n`);
  await fs.writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Candidato: ${OUTPUT}`);
  console.log(`Revisão humana: ${REPORT} (${intermediateReview.length} intermediários, ${unclassifiedReview.length} sem classificação)`);
}

main().catch((error) => {
  console.error(`ERRO: ${error.message}`);
  process.exitCode = 1;
});
