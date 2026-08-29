import Link from 'next/link';
import HypometroIcon from './HypometroIcon';
import { formatAvailabilityStart, formatScore, getFullCatalog, getHypometro, getPlatformClass, getScoreClass, slugify } from '../lib/catalog';
import { weeklyHighlight } from '../data/weeklyHighlight';

function findHighlightItem() {
  const catalog = getFullCatalog();
  const aliases = [weeklyHighlight.slug, weeklyHighlight.titulo, weeklyHighlight.titulo_original, ...(weeklyHighlight.aliases || [])];
  return catalog.find((item) => {
    const values = [item.slug, item.titulo, item.titulo_original, ...(item.aliases || [])].filter(Boolean);
    return values.some((value) => aliases.some((alias) => slugify(value) === slugify(alias)));
  });
}

export default function WeeklyHighlight({ compact = false }) {
  const item = findHighlightItem();
  const title = item?.titulo || weeklyHighlight.titulo;
  const slug = item?.slug || weeklyHighlight.slug;
  const rawScore = item?.nota_sofahype ?? weeklyHighlight.nota_sofahype;
  const rawCritics = item?.nota_critica ?? weeklyHighlight.nota_critica;
  const rawAudience = item?.nota_publico ?? weeklyHighlight.nota_publico;
  const hasScore = rawScore !== null && rawScore !== undefined && Number(rawScore) > 0;
  const hasCritics = rawCritics !== null && rawCritics !== undefined && Number(rawCritics) > 0;
  const hasAudience = rawAudience !== null && rawAudience !== undefined && Number(rawAudience) > 0;
  const score = hasScore ? Number(rawScore) : null;
  const critics = hasCritics ? Number(rawCritics) : null;
  const audience = hasAudience ? Number(rawAudience) : null;
  const hypo = hasScore ? getHypometro(score) : null;
  const platform = item?.plataformas?.[0] || weeklyHighlight.plataforma;
  const platformClass = getPlatformClass(platform);
  const hasConfirmedPlatform = Boolean(item?.plataformas?.length);
  const heroImage = weeklyHighlight.hero_image || item?.backdrop_url;
  const unavailable = item?.status_disponibilidade === 'sem_plataforma_monitorada';
  const upcoming = item?.status_disponibilidade === 'em_breve';
  const availabilityStart = upcoming ? formatAvailabilityStart(item?.data_lancamento) : null;
  const availabilityError = item?.verificacao_disponibilidade === 'erro';
  const experience = weeklyHighlight.experiencia_extra?.length ? weeklyHighlight.experiencia_extra : item?.experiencia || [];
  const idealFor = weeklyHighlight.ideal_extra?.length ? weeklyHighlight.ideal_extra : item?.ideal_para || [];
  const notFor = weeklyHighlight.talvez_nao_extra?.length ? weeklyHighlight.talvez_nao_extra : item?.talvez_nao_seja || [];
  const metadata = [item?.ano, item?.duracao, item?.classificacao_etaria ? `${item.classificacao_etaria} anos` : null].filter(Boolean);

  return (
    <div className={compact ? 'weekly-feature weekly-feature-compact' : 'weekly-feature'}>
      <section className={compact ? 'weekly-highlight weekly-highlight-compact' : 'weekly-highlight'}>
        <div className="weekly-highlight-bg" aria-hidden="true">
          {heroImage ? <img src={heroImage} alt="" /> : null}
        </div>
        <div className="weekly-copy">
          <div className="weekly-label">{weeklyHighlight.label}</div>
          <h2>{title}</h2>
          <p>{weeklyHighlight.chamada}</p>
          <div className="weekly-meta" aria-label="Informações do destaque">
            {hasConfirmedPlatform ? <span className={`watch-chip st-${platformClass}`}>{platform}</span> : null}
            {metadata.map((entry) => <span key={entry}>{entry}</span>)}
          </div>
          <div className="weekly-metrics" aria-label="Notas do destaque da semana">
            {hasScore ? (
              <>
                <span className={`weekly-score-box score-box-${getScoreClass(score)}`}><strong>{formatScore(score)}</strong><small>Nota SofáHype</small></span>
                <span className={`weekly-hypo hype-${hypo.classe}`}><HypometroIcon variant={hypo.classe} size={42} /> {hypo.nome}</span>
              </>
            ) : (
              <span className="weekly-score-pending"><strong>Notas em breve</strong><small>{availabilityStart || (upcoming ? 'Data a confirmar' : `Estreia em ${weeklyHighlight.estreia}`)}</small></span>
            )}
            {hasCritics ? <span className={`weekly-score-box score-box-${getScoreClass(critics)}`}><strong>{formatScore(critics)}</strong><small>Crítica</small></span> : null}
            {hasAudience ? <span className="weekly-score-box score-publico"><strong>{formatScore(audience)}</strong><small>Público</small></span> : null}
          </div>
          <div className="weekly-actions">
            <Link className="btn-primary" href={`/titulo/${slug}`}>Ver detalhes</Link>
            {unavailable ? <span className="watch-empty">Sem plataforma monitorada no momento</span>
              : upcoming && hasConfirmedPlatform && availabilityStart ? <span className="watch-empty">{availabilityStart}</span>
                : upcoming ? <span className="watch-empty">Ainda não chegou. A gente fica de olho.</span>
                  : null}
            {availabilityError ? <span className="watch-empty">Disponibilidade ainda não atualizada</span> : null}
          </div>
        </div>
      </section>

      {!compact ? (
        <section className="weekly-editorial" aria-label={`Conteúdo editorial sobre ${title}`}>
          <div className="detail-block review-block weekly-review">
            <span className="review-eyebrow">Destaque da semana</span>
            <h2>{weeklyHighlight.critica_titulo}</h2>
            <p>{weeklyHighlight.critica_sofahype}</p>
          </div>
          <div className="detail-block weekly-experience">
            <h2>Como é a experiência?</h2>
            <div className="experience-list">{experience.map((entry) => <span key={entry}>{entry}</span>)}</div>
          </div>
          <div className="decision-grid weekly-decisions">
            <div className="detail-block">
              <h2>Ideal para quem gosta de</h2>
              <ul className="decision-list good-list">{idealFor.map((entry) => <li key={entry}><span className="decision-icon good">✓</span>{entry}</li>)}</ul>
            </div>
            <div className="detail-block">
              <h2>Talvez não seja para você se procura</h2>
              <ul className="decision-list bad-list">{notFor.map((entry) => <li key={entry}><span className="decision-icon bad">×</span>{entry}</li>)}</ul>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
