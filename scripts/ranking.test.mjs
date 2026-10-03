import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { compareByScore, getRankingScore, isRankingEligible } from '../src/lib/ranking.js';
import { hasConfirmedScores } from './editorial-scores.mjs';

const title = (titulo, critica, publico, stored = 93) => ({
  titulo, nota_critica: critica, nota_publico: publico, nota_sofahype: stored,
  status: 'ativo', status_disponibilidade: 'ativo', plataformas: ['Netflix']
});

test('ordena pela média exata, depois pelo consenso e pelo título', () => {
  const lower = title('A', 93, 92);
  const higher = title('B', 94, 92);
  assert.equal(getRankingScore(lower), 92.5);
  assert.deepEqual([lower, higher].sort(compareByScore), [higher, lower]);
  const balanced = title('Z', 93, 93);
  assert.deepEqual([higher, balanced].sort(compareByScore), [balanced, higher]);
  assert.deepEqual([title('Zebra', 90, 90), title('Árvore', 90, 90)]
    .sort(compareByScore).map((item) => item.titulo), ['Árvore', 'Zebra']);
});

test('notas ausentes não viram zero nem média parcial', () => {
  assert.equal(getRankingScore(title('Legado', null, 80, 82)), 82);
  assert.equal(getRankingScore(title('Sem nota', null, null, null)), -1);
  assert.equal(getRankingScore(title('Inválido', NaN, null, Infinity)), -1);
});

test('ranking exclui ocultos, inativos, sem plataforma, futuros e sem nota', () => {
  const valid = title('Disponível', 90, 90);
  assert.equal(isRankingEligible(valid), true);
  for (const override of [
    { status: 'oculto' }, { status: 'inativo' }, { plataformas: [] },
    { status_disponibilidade: 'sem_plataforma_monitorada' },
    { status_disponibilidade: 'em_breve' },
    { nota_critica: null, nota_publico: null, nota_sofahype: null }
  ]) assert.equal(isRankingEligible({ ...valid, ...override }), false);
});

test('exibição arredonda a escala percentual antes da divisão', () => {
  // Executa a função real sem depender do carregador JSON do Next.js.
  const source = fs.readFileSync(new URL('../src/lib/catalog.js', import.meta.url), 'utf8');
  const fn = source.match(/export function formatScore\(score\) \{[\s\S]*?\n\}/)[0].replace('export ', '');
  const formatScore = vm.runInNewContext(`(${fn})`);
  assert.equal(formatScore(94.5), '9.5');
  assert.equal(formatScore(92), '9.2');
  assert.equal(formatScore(null), '—');
  assert.equal(formatScore(0), '—');
});

test('importados só aceitam notas com revisão correspondente e fontes corretas', () => {
  const reviews = JSON.parse(fs.readFileSync(new URL('../src/data/scoreReviews.json', import.meta.url)));
  const catalog = JSON.parse(fs.readFileSync(new URL('../src/data/catalogo.json', import.meta.url)));
  for (const review of reviews) {
    const item = catalog.find((item) => item.id === review.id);
    assert.ok(hasConfirmedScores(item, review), review.titulo);
    assert.equal(hasConfirmedScores({ ...item, nota_sofahype: 1 }, review), false);
    assert.equal(hasConfirmedScores(item, { ...review, imdb: 'https://example.com/' }), false);
    assert.equal(hasConfirmedScores(item, undefined), false);
  }
});

test('todos os integrantes do Top 8 têm revisão e página individual', () => {
  const catalog = JSON.parse(fs.readFileSync(new URL('../src/data/catalogo.json', import.meta.url)));
  const reviews = JSON.parse(fs.readFileSync(new URL('../src/data/scoreReviews.json', import.meta.url)));
  for (const tipo of ['filme', 'serie']) {
    const top = catalog.filter((item) => item.tipo === tipo && isRankingEligible(item)).sort(compareByScore).slice(0, 8);
    assert.equal(top.length, 8);
    for (const item of top) {
      assert.ok(item.slug && item.poster_url);
      assert.ok(hasConfirmedScores(item, reviews.find((review) => review.id === item.id)), item.titulo);
    }
  }
});
