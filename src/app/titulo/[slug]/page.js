import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { getCatalog, getExperienceForDisplay, getHypometro, getPlatformClass, getTitleBySlug } from '../../../lib/catalog';
import HypometroIcon from '../../../components/HypometroIcon';

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().map((item) => ({ slug: String(item.slug || item.id) }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = getTitleBySlug(slug);
  return { title: `${item?.titulo || 'Título'} | SofáHype` };
}

export default async function TitlePage({ params }) {
  const { slug } = await params;
  const item = getTitleBySlug(slug);
  if (!item) notFound();

  const hypo = getHypometro(item.nota_sofahype);
  const experience = getExperienceForDisplay(item);

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

          <section className="watch-panel" aria-label="Onde assistir">
            <div>
              <span className="watch-eyebrow">Disponível nos streamings</span>
              <h2>Onde assistir</h2>
            </div>
            <div className="watch-platforms">
              {(item.plataformas || []).length > 0
                ? (item.plataformas || []).map((p) => <span key={p} className={`watch-chip st-${getPlatformClass(p)}`}>{p}</span>)
                : <span className="watch-empty">Ainda sem streaming cadastrado</span>}
            </div>
          </section>

          <div className="score-panel">
            <div>
              <span>Nota SofáHype</span>
              <strong>{item.nota_sofahype}%</strong>
            </div>
            <div>
              <span>Hypômetro</span>
              <strong className={`hypo-display hype-${hypo.classe}`}><HypometroIcon variant={hypo.classe} size={58} /> <span>{hypo.nome}</span></strong>
            </div>
            <div>
              <span>Crítica</span>
              <strong>{item.nota_critica ? `${item.nota_critica}%` : 'Em breve'}</strong>
            </div>
            <div>
              <span>Público</span>
              <strong>{item.nota_publico ? `${item.nota_publico}%` : 'Em breve'}</strong>
            </div>
          </div>

          <div className="detail-block">
            <h2>Como é a experiência?</h2>
            <div className="experience-list">
              {(experience.experiencia || []).map((entry) => <span key={entry}>{entry}</span>)}
            </div>
          </div>

          <div className="decision-grid">
            <div className="detail-block">
              <h2>Ideal para quem gosta de</h2>
              <ul className="decision-list good-list">{(experience.ideal_para || []).map((entry) => <li key={entry}><span className="decision-icon good">✓</span>{entry}</li>)}</ul>
            </div>
            <div className="detail-block">
              <h2>Talvez não seja para você se procura</h2>
              <ul className="decision-list bad-list">{(experience.talvez_nao_seja || []).map((entry) => <li key={entry}><span className="decision-icon bad">×</span>{entry}</li>)}</ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
