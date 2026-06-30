import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TitleGrid from '../../components/TitleGrid';
import SearchBox from '../../components/SearchBox';
import { getTitlesByType } from '../../lib/catalog';

export const metadata = { title: 'Filmes | SofáHype' };

export default function FilmesPage() {
  const filmes = getTitlesByType('filme');
  return (
    <>
      <Header />
      <section className="page-hero">
        <h1>Filmes</h1>
        <p>Os filmes mais bem avaliados disponíveis nos streamings.</p>
        <SearchBox defaultTipo="filme" variant="page" placeholder="Buscar filme..." />
      </section>
      <section className="section">
        <TitleGrid items={filmes} />
      </section>
      <Footer />
    </>
  );
}
