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
  const rankings = [
    { tipo: 'filme', titulo: 'Filmes', items: filmes, href: '/filmes', chamada: 'Ver todos os filmes →' },
    { tipo: 'serie', titulo: 'Séries', items: series, href: '/series', chamada: 'Ver ranking completo →' },
  ];

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

        <section className="section rankings-section" id="rankings">
          {rankings.map((ranking) => (
            <div className="ranking-group" data-ranking-type={ranking.tipo} key={ranking.tipo}>
              <div className="section-header">
                <h2 className="section-title">Ranking <span>{ranking.titulo}</span></h2>
                <Link className="btn-ver-todos" href={ranking.href}>{ranking.chamada}</Link>
              </div>
              <Ranking items={ranking.items} />
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </>
  );
}
