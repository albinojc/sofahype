'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import TitleGrid from './TitleGrid';
import { normalizeSearch } from '../lib/search';

const SENSATIONS = [
  {
    key: 'divertir',
    label: '🍿 Quero me divertir',
    terms: ['comedia', 'humor', 'divertir', 'dar risada', 'aventura', 'bem movimentado'],
    exclude: ['terror', 'guerra', 'crime', 'clima pesado']
  },
  {
    key: 'emocionar',
    label: '❤️ Quero me emocionar',
    terms: ['drama', 'romance', 'familia', 'historia de amor', 'emocao', 'historias intensas', 'historia mais seria'],
    exclude: []
  },
  {
    key: 'pensar',
    label: '🧠 Quero pensar',
    terms: ['ficcao cientifica', 'documentario', 'historia', 'misterio', 'suspense', 'precisa prestar atencao', 'pede atencao'],
    exclude: []
  },
  {
    key: 'assustar',
    label: '👻 Quero me assustar',
    terms: ['terror', 'suspense', 'misterio', 'clima de medo', 'tem sustos', 'clima de tensao'],
    exclude: []
  },
  {
    key: 'aventura',
    label: '🚀 Quero aventura',
    terms: ['aventura', 'acao', 'fantasia', 'ficcao cientifica', 'bem movimentado', 'mundo de fantasia'],
    exclude: []
  },
  {
    key: 'leve',
    label: '😌 Algo leve e fácil',
    terms: ['familia', 'animacao', 'comedia', 'clima leve', 'ver com criancas', 'historia facil de acompanhar'],
    exclude: ['terror', 'guerra', 'crime', 'suspense', 'clima pesado', 'clima adulto', 'humor pesado']
  }
];

function searchableText(item) {
  return normalizeSearch([
    item.titulo,
    item.titulo_original,
    ...(item.generos || []),
    ...(item.experiencia || []),
    ...(item.ideal_para || [])
  ].join(' '));
}

function matchesSensation(item, sensation) {
  const text = searchableText(item);
  const hasTerm = sensation.terms.some((term) => text.includes(normalizeSearch(term)));
  const hasBlockedTerm = sensation.exclude.some((term) => text.includes(normalizeSearch(term)));
  return hasTerm && !hasBlockedTerm;
}

export default function SensationExplorer({ items }) {
  const [selected, setSelected] = useState(SENSATIONS[0].key);
  const active = SENSATIONS.find((item) => item.key === selected) || SENSATIONS[0];

  const filtered = useMemo(() => {
    const matches = items
      .filter((item) => item.tipo === 'filme')
      .filter((item) => matchesSensation(item, active))
      .sort((a, b) => Number(b.nota_sofahype || 0) - Number(a.nota_sofahype || 0));

    // Se a base importada ainda for pequena e não houver títulos suficientes,
    // mantemos a tela útil sem inventar classificação.
    return matches.length ? matches.slice(0, 6) : items.filter((item) => item.tipo === 'filme').slice(0, 6);
  }, [items, active]);

  return (
    <>
      <section className="humor-section">
        <div className="section-label">✦ Escolha por sensação</div>
        <div className="moods" role="tablist" aria-label="Escolha por sensação">
          {SENSATIONS.map((sensation) => (
            <button
              key={sensation.key}
              type="button"
              className={selected === sensation.key ? 'mood active' : 'mood'}
              onClick={() => setSelected(sensation.key)}
              aria-pressed={selected === sensation.key}
            >
              {sensation.label}
            </button>
          ))}
        </div>
      </section>

      <div className="divider" />

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Mais bem avaliados — <span>Filmes</span></h2>
          <Link className="btn-ver-todos" href="/filmes">Ver todos →</Link>
        </div>
        <TitleGrid items={filtered} />
      </section>
    </>
  );
}
