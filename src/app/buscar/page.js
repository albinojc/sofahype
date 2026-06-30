import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SearchBox from '../../components/SearchBox';
import SearchEmptyState from '../../components/SearchEmptyState';
import TitleGrid from '../../components/TitleGrid';
import Ranking from '../../components/Ranking';
import { getCatalog } from '../../lib/catalog';
import { searchTitles } from '../../lib/search';

export const metadata = { title: 'Busca | SofáHype' };

function normalizeParam(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function normalizeTipo(value) {
  const tipo = normalizeParam(value);
  return ['todos', 'filme', 'serie'].includes(tipo) ? tipo : 'todos';
}

export default async function BuscarPage({ searchParams }) {
  const params = await searchParams;
  const q = normalizeParam(params?.q).trim();
  const tipo = normalizeTipo(params?.tipo || 'todos');
  const catalog = getCatalog();
  const results = q.length >= 2 ? searchTitles(catalog, q, tipo) : [];
  const seriesResults = results.filter((item) => item.tipo === 'serie');
  const titleLabel = tipo === 'filme' ? 'filmes' : tipo === 'serie' ? 'séries' : 'títulos';

  return (
    <>
      <Header />
      <section className="page-hero search-results-hero">
        <h1>Busca</h1>
        <p>Pesquise um filme ou série e veja os resultados em uma página só.</p>
        <SearchBox defaultQuery={q} defaultTipo={tipo} variant="page" />
      </section>

      <main className="section search-results-section">
        {q.length < 2 ? (
          <p className="empty">Digite pelo menos duas letras para iniciar a busca.</p>
        ) : results.length === 0 ? (
          <SearchEmptyState />
        ) : (
          <>
            <div className="section-header search-results-header">
              <h2 className="section-title">Resultado para <span>{q}</span></h2>
              <p className="results-count">{results.length} {titleLabel} encontrados</p>
            </div>
            {tipo === 'serie' ? <Ranking items={seriesResults} /> : <TitleGrid items={results.slice(0, 80)} />}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
