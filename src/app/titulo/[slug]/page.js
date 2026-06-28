import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { getCatalog, getHypometro, getPlatformClass, getTitleBySlug } from '../../../lib/catalog';

export function generateStaticParams() {
  return getCatalog().map((item) => ({ slug: item.id }));
}

export function generateMetadata({ params }) {
  const item = getTitleBySlug(params.slug);
  return { title: `${item?.titulo || 'Título'} | SofáHype` };
}

export default function TitlePage({ params }) {
  const item = getTitleBySlug(params.slug);
  if (!item) notFound();

  const hypo = getHypometro(item.nota_sofahype);

  return (
    <>
      <Header />
      <main className="title-page">
        <div className="poster-large">
          {item.poster_url ? <img src={item.poster_url} alt={item.titulo} /> : <span>{item.titulo.slice(0, 3).toUpperCase()}</span>}
        </div>
        <section className="title-content">
          <div className="title-kicker">{item.tipo === 'filme' ? 'Filme' : 'Série'} · {item.ano}</div>
          <h1>{item.titulo}</h1>
          <p className="title-sinopse">{item.sinopse}</p>

          <div className="score-panel">
            <div>
              <span>Nota SofáHype</span>
              <strong>{item.nota_sofahype}%</strong>
            </div>
            <div>
              <span>Hypômetro</span>
              <strong>{hypo.emoji} {hypo.nome}</strong>
            </div>
            <div>
              <span>Crítica</span>
              <strong>{item.nota_critica}%</strong>
            </div>
            <div>
              <span>Público</span>
              <strong>{item.nota_publico}%</strong>
            </div>
          </div>

          <div className="detail-block">
            <h2>Onde assistir</h2>
            <div className="platform-list">
              {item.plataformas.map((p) => <span key={p} className={`st st-${getPlatformClass(p)}`}>{p}</span>)}
            </div>
          </div>

          <div className="detail-block">
            <h2>Como é a experiência?</h2>
            <div className="experience-list">
              {item.experiencia.map((entry) => <span key={entry}>{entry}</span>)}
            </div>
          </div>

          <div className="decision-grid">
            <div className="detail-block">
              <h2>Ideal para quem gosta de</h2>
              <ul>{item.ideal_para.map((entry) => <li key={entry}>✓ {entry}</li>)}</ul>
            </div>
            <div className="detail-block">
              <h2>Talvez não seja para você se procura</h2>
              <ul>{item.talvez_nao_seja.map((entry) => <li key={entry}>✗ {entry}</li>)}</ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
