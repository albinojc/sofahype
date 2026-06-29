'use client';

import { useMemo, useState } from 'react';
import TitleGrid from './TitleGrid';
import { searchTitles } from '../lib/search';

export default function SearchCatalog({ items, variant = 'panel' }) {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState('todos');
  const isHero = variant === 'hero';

  const filtered = useMemo(() => {
    const q = query.trim();
    if (isHero && q.length < 2) return [];
    return searchTitles(items, q, tipo);
  }, [items, query, tipo, isHero]);

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
        query.trim().length >= 2 && (
          <div className="home-search-results">
            <TitleGrid items={filtered.slice(0, 8)} />
            {!filtered.length && <p className="empty">Nenhum título encontrado.</p>}
          </div>
        )
      ) : (
        <TitleGrid items={filtered.slice(0, 24)} />
      )}
    </section>
  );
}
