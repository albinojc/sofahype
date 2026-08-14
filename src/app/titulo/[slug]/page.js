import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { formatScore, getExperienceForDisplay, getFullCatalog, getHypometro, getPlatformClass, getScoreClass, getTitleBySlug } from '../../../lib/catalog';
import HypometroIcon from '../../../components/HypometroIcon';
import { weeklyHighlight } from '../../../data/weeklyHighlight';

export const dynamicParams = false;

function formatFutureReleaseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;

  const date = new Date(`${value}T00:00:00Z`);
  const today = new Date().toISOString().slice(0, 10);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || value <= today) return null;

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
}

export function generateStaticParams() {
  return getFullCatalog().map((item) => ({ slug: String(item.slug || item.id) }));
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

  const hasScore = item.nota_sofahype !== null && item.nota_sofahype !== undefined && Number(item.nota_sofahype) > 0;
  const hypo = hasScore ? getHypometro(item.nota_sofahype) : null;
  const experience = getExperienceForDisplay(item);
  const isWeeklyHighlight = item.destaque_semana || item.slug === weeklyHighlight.slug || item.titulo_original === weeklyHighlight.titulo_original;
  const highlightReview = item.critica_sofahype || (isWeeklyHighlight ? weeklyHighlight.critica_sofahype : '');
  const highlightReviewTitle = item.critica_titulo || weeklyHighlight.critica_titulo;
  const reviewEyebrow = isWeeklyHighlight ? 'Destaque da semana' : 'Crítica SofáHype';
  const futureReleaseDate = formatFutureReleaseDate(item.data_lancamento);
  const availabilityStatus = item.status_disponibilidade;
  const availabilityVerification = item.verificacao_disponibilidade;
  const unavailable = availabilityStatus === 'sem_plataforma_monitorada';
  const upcoming = availabilityStatus === 'em_breve';

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
              <span className="watch-eyebrow">{unavailable ? 'Disponibilidade' : upcoming ? 'Lançamento' : 'Disponível nos streamings'}</span>
              <h2>Onde assistir</h2>
            </div>
            <div className="watch-platforms">
              {unavailable
                ? <span className="watch-empty">Este título não está disponível agora nas plataformas monitoradas pelo SofáHype.</span>
                : upcoming
                  ? <span className="watch-empty">Ainda não chegou. A gente fica de olho.</span>
                  : (item.plataformas || []).length > 0
                ? (item.plataformas || []).map((p) => <span key={p} className={`watch-chip st-${getPlatformClass(p)}`}>{p}</span>)
                : <span className="watch-empty">Ainda sem streaming cadastrado</span>}
            </div>
            {availabilityVerification === 'erro' ? <small className="watch-empty">Disponibilidade ainda não atualizada.</small> : null}
          </section>

          <div className={`score-panel ${hasScore ? '' : 'score-panel-pending'}`}>
            {hasScore ? (
              <>
                <div className={`score-metric score-box-${getScoreClass(item.nota_sofahype)}`}>
                  <span>Nota SofáHype</span>
                  <strong>{formatScore(item.nota_sofahype)}</strong>
                </div>
                <div className="score-metric score-metric-hypo">
                  <span>Hypômetro</span>
                  <strong className={`hypo-display hype-${hypo.classe}`}><HypometroIcon variant={hypo.classe} size={58} /> <span>{hypo.nome}</span></strong>
                </div>
              </>
            ) : (
              <div className="score-metric score-box-empty score-awaiting-release">
                <span>Avaliação</span>
                <strong>Notas em breve</strong>
                {futureReleaseDate ? <small>Estreia em {futureReleaseDate}.</small> : null}
              </div>
            )}
            <div className={`score-metric ${item.nota_critica ? `score-box-${getScoreClass(item.nota_critica)}` : 'score-box-empty'}`}>
              <span>Crítica</span>
              <strong>{item.nota_critica ? formatScore(item.nota_critica) : 'Em breve'}</strong>
            </div>
            <div className={`score-metric ${item.nota_publico ? 'score-publico' : 'score-box-empty'}`}>
             <span>Público</span>
             <strong>{item.nota_publico ? formatScore(item.nota_publico) : 'Em breve'}</strong>
            </div>
          </div>

          {highlightReview ? (
            <div className="detail-block review-block">
              <span className="review-eyebrow">{reviewEyebrow}</span>
              <h2>{highlightReviewTitle}</h2>
              <p>{highlightReview}</p>
            </div>
          ) : null}

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
