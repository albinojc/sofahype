import Link from 'next/link';
import Footer from '../components/Footer';
import SearchBox from '../components/SearchBox';
import SensationExplorer from '../components/SensationExplorer';
import Ranking from '../components/Ranking';
import WeeklyHighlight from '../components/WeeklyHighlight';
import { getCatalog, getTitlesByType, streamings } from '../lib/catalog';

export default function HomePage() {
  const catalog = getCatalog();
  const filmes = getTitlesByType('filme').slice(0, 8);
  const series = getTitlesByType('serie').slice(0, 8);

  return (
    <>
      <main>
        <section className="home-hero">
          <div className="home-brand-row">
            <img className="home-logo" src="/assets/logo-sofahype.png" alt="SofáHype" />
            <p>O guia brasileiro para decidir o que assistir.</p>
          </div>

          <h1 className="hero-headline">O que assistir hoje?</h1>

          <div className="home-streaming-row" id="streamings">
            <span className="streaming-label">Streaming:</span>
            {streamings.map((streaming) => (
              <Link key={streaming.slug} className={`s-chip s-${streaming.classe}`} href={`/streamings/${streaming.slug}`}>
                {streaming.nome}
              </Link>
            ))}
          </div>

          <SearchBox variant="home" />

          <nav className="home-nav" aria-label="Navegação principal">
            <Link href="/filmes">Filmes</Link>
            <Link href="/series">Séries</Link>
            <Link href="/#rankings">Rankings</Link>
            <Link href="/#streamings">Streamings</Link>
          </nav>
        </section>

        <WeeklyHighlight />

        <SensationExplorer items={catalog} />

        <div className="divider" />

        <section className="section" id="rankings">
          <div className="section-header">
            <h2 className="section-title">Ranking <span>Filmes</span></h2>
            <Link className="btn-ver-todos" href="/filmes">Ver todos os filmes →</Link>
          </div>
          <Ranking items={filmes} />
        </section>

        <div className="divider" />

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Ranking <span>Séries</span></h2>
            <Link className="btn-ver-todos" href="/series">Ver ranking completo →</Link>
          </div>
          <Ranking items={series} />
        </section>
      </main>

      <Footer />
    </>
  );
}
