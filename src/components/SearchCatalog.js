'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import TitleGrid from './TitleGrid';
import { searchTitles } from '../lib/search';

function EmptySearchState() {
  return (
    <div className="empty-search-state">
      <img src="/assets/sofa-vacilei.png" alt="SofáHype não encontrou esse título" />
      <div>
        <h2>Vacilei!</h2>
        <p>
          Parece que ainda não temos o título que você tava procurando. Mas olha só, a gente vai correr pra deixar seu sofá preferido cada vez mais do seu jeito!
        </p>
        <Link className="btn-ver-todos" href="/">Voltar para a primeira página</Link>
      </div>
    </div>
  );
}

export default function SearchCatalog({ items, variant = 'panel' }) {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState('todos');
  const isHero = variant === 'hero';
  const normalizedQuery = query.trim();

  const filtered = useMemo(() => {
    if (isHero && normalizedQuery.length < 2) return [];
    return searchTitles(items, normalizedQuery, tipo);
  }, [items, normalizedQuery, tipo, isHero]);

  const showHeroResults = isHero && normalizedQuery.length >= 2;
  const showEmpty = normalizedQuery.length >= 2 && filtered.length === 0;

  return (
    <section className={isHero ? 'home-search-section' : 'section'}>
      <div className={isHero ? 'home-search-panel' : 'search-panel'}>
        <div className="search-input-wrap">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar filme ou série..."
            aria-label="Buscar filme ou série"
          />
          <span className="search-icon" aria-hidden="true">⌕</span>
        </div>
        {!isHero && (
          <div className="tabs clean">
            <button className={tipo === 'todos' ? 'tab active' : 'tab'} onClick={() => setTipo('todos')}>Todos</button>
            <button className={tipo === 'filme' ? 'tab active' : 'tab'} onClick={() => setTipo('filme')}>Filmes</button>
            <button className={tipo === 'serie' ? 'tab active' : 'tab'} onClick={() => setTipo('serie')}>Séries</button>
          </div>
        )}
      </div>

      {isHero ? (
        showHeroResults && (
          <div className="home-search-results">
            {showEmpty ? <EmptySearchState /> : <TitleGrid items={filtered.slice(0, 8)} />}
          </div>
        )
      ) : (
        showEmpty ? <EmptySearchState /> : <TitleGrid items={filtered.slice(0, 24)} />
      )}
    </section>
  );
}
