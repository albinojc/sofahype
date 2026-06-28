import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchCatalog from '../components/SearchCatalog';
import TitleGrid from '../components/TitleGrid';
import Ranking from '../components/Ranking';
import { getCatalog, getTitlesByType } from '../lib/catalog';

export default function HomePage() {
  const catalog = getCatalog();
  const filmes = getTitlesByType('filme').slice(0, 6);
  const series = getTitlesByType('serie').slice(0, 8);

  return (
    <>
      <Header />
      <section className="hero">
        <div className="hero-eyebrow">🛋 SofáHype</div>
        <h1 className="hero-headline">O que assistir hoje?</h1>
        <p className="hero-sub">O guia brasileiro para decidir o que assistir.</p>
      </section>

      <section className="humor-section">
        <div className="section-label">✦ Escolha por sensação</div>
        <div className="moods">
          <span className="mood active">🍿 Quero me divertir</span>
          <span className="mood">❤️ Quero me emocionar</span>
          <span className="mood">🧠 Quero pensar</span>
          <span className="mood">👻 Quero me assustar</span>
          <span className="mood">🚀 Quero aventura</span>
          <span className="mood">😴 Algo leve e fácil</span>
        </div>
      </section>

      <div className="divider" />

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Mais bem avaliados — <span>Filmes</span></h2>
          <a className="btn-ver-todos" href="/filmes">Ver todos →</a>
        </div>
        <TitleGrid items={filmes} />
      </section>

      <div className="divider" />

      <section className="section" id="rankings">
        <div className="section-header">
          <h2 className="section-title">Ranking <span>Séries</span></h2>
          <a className="btn-ver-todos" href="/series">Ver ranking completo →</a>
        </div>
        <Ranking items={series} />
      </section>

      <div className="divider" />

      <SearchCatalog items={catalog} />

      <Footer />
    </>
  );
}
