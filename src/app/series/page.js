import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Ranking from '../../components/Ranking';
import { getTitlesByType } from '../../lib/catalog';

export const metadata = { title: 'Séries | SofáHype' };

export default function SeriesPage() {
  const series = getTitlesByType('serie');
  return (
    <>
      <Header />
      <section className="page-hero">
        <h1>Séries</h1>
        <p>Ranking das séries mais fortes do catálogo.</p>
      </section>
      <section className="section">
        <Ranking items={series} />
      </section>
      <Footer />
    </>
  );
}
