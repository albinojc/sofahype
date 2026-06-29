'use client';

import { useMemo, useState } from 'react';
import TitleGrid from './TitleGrid';

export default function SearchCatalog({ items, variant = 'panel' }) {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState('todos');
  const isHero = variant === 'hero';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (isHero && q.length < 2) return [];

    return items.filter((item) => {
      const byType = tipo === 'todos' || item.tipo === tipo;
      const text = `${item.titulo} ${item.titulo_original || ''} ${item.generos?.join(' ')} ${item.plataformas?.join(' ')}`.toLowerCase();
      return byType && (!q || text.includes(q));
    });
  }, [items, query, tipo, isHero]);

  return (
    <section className={isHero ? 'home-search-section' : 'section'}>
      <div className={isHero ? 'home-search-panel' : 'search-panel'}>
        <div className="search-input-wrap">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar filme, série, gênero ou streaming..."
            aria-label="Buscar filme, série, gênero ou streaming"
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
