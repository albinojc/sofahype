import Header from '../../components/Header';
import Footer from '../../components/Footer';

export const metadata = { title: 'Créditos e fontes | SofáHype' };

export default function CreditsPage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <h1>Créditos e fontes</h1>
        <p>O SofáHype reúne informações de filmes, séries e disponibilidade nos principais serviços de streaming para ajudar você a decidir o que assistir.</p>
      </section>

      <main className="section credits-page">
        <section className="detail-block">
          <h2>
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>
          </h2>
          <img className="credits-tmdb-logo" src="/assets/tmdb-logo.svg" alt="TMDB — The Movie Database" />
          <p>Dados, informações e imagens de filmes e séries utilizados pelo SofáHype são fornecidos pelo TMDB (The Movie Database).</p>
          <p lang="en">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </section>

        <section className="detail-block">
          <h2>Disponibilidade nos streamings</h2>
          <p>
            Os dados de disponibilidade de títulos nos serviços de streaming são fornecidos pela{' '}
            <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a>{' '}
            por meio dos dados de provedores disponibilizados pelo TMDB.
          </p>
        </section>

        <section className="detail-block">
          <h2>Curadoria SofáHype</h2>
          <p>A seleção, a organização, a apresentação, os textos editoriais, o Hypômetro e os critérios próprios são trabalho editorial do SofáHype e não representam endosso do TMDB, da JustWatch ou dos serviços de streaming.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
