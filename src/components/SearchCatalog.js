'use client';

import { useMemo, useState } from 'react';
import TitleGrid from './TitleGrid';

export default function SearchCatalog({ items }) {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState('todos');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const byType = tipo === 'todos' || item.tipo === tipo;
      const text = `${item.titulo} ${item.generos?.join(' ')} ${item.plataformas?.join(' ')}`.toLowerCase();
      return byType && (!q || text.includes(q));
    });
  }, [items, query, tipo]);

  return (
    <section className="section">
      <div className="search-panel">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar filme, série, gênero ou streaming..."
        />
        <div className="tabs clean">
          <button className={tipo === 'todos' ? 'tab active' : 'tab'} onClick={() => setTipo('todos')}>Todos</button>
          <button className={tipo === 'filme' ? 'tab active' : 'tab'} onClick={() => setTipo('filme')}>Filmes</button>
          <button className={tipo === 'serie' ? 'tab active' : 'tab'} onClick={() => setTipo('serie')}>Séries</button>
        </div>
      </div>
      <TitleGrid items={filtered.slice(0, 24)} />
    </section>
  );
}
