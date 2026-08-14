import Link from 'next/link';
import HypometroIcon from './HypometroIcon';
import { formatScore, getFullCatalog, getHypometro, getPlatformClass, getScoreClass, slugify } from '../lib/catalog';
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
  const platform = weeklyHighlight.plataforma;
  const platformClass = getPlatformClass(platform);
  const poster = item?.poster_url;
  const backdrop = item?.backdrop_url;
  const unavailable = item?.status_disponibilidade === 'sem_plataforma_monitorada';
  const upcoming = item?.status_disponibilidade === 'em_breve';
  const availabilityError = item?.verificacao_disponibilidade === 'erro';

  return (
    <section className={compact ? 'weekly-highlight weekly-highlight-compact' : 'weekly-highlight'}>
      <div className="weekly-highlight-bg" style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined} />
      <div className="weekly-copy">
        <div className="weekly-label">{weeklyHighlight.label}</div>
        <h2>{title}</h2>
        <p>{weeklyHighlight.chamada}</p>
        <div className="weekly-metrics" aria-label="Notas do destaque da semana">
          {hasScore ? (
            <>
              <span className={`weekly-score-box score-box-${getScoreClass(score)}`}><strong>{formatScore(score)}</strong><small>Nota SofáHype</small></span>
              <span className={`weekly-hypo hype-${hypo.classe}`}><HypometroIcon variant={hypo.classe} size={42} /> {hypo.nome}</span>
            </>
          ) : (
            <span className="weekly-score-pending"><strong>Notas em breve</strong><small>Estreia em {weeklyHighlight.estreia}</small></span>
          )}
          {hasCritics ? <span className={`weekly-score-box score-box-${getScoreClass(critics)}`}><strong>{formatScore(critics)}</strong><small>Crítica</small></span> : null}
          {hasAudience ? ( <span className="weekly-score-box score-publico"><strong>{formatScore(audience)}</strong><small>Público</small></span> ) : null}
        </div>
        <div className="weekly-actions">
          <Link className="btn-primary" href={`/titulo/${slug}`}>{upcoming ? 'Ver detalhes' : 'Ver crítica'}</Link>
          {unavailable ? <span className="watch-empty">Sem plataforma monitorada no momento</span>
            : upcoming ? <><span className={`watch-chip st-${platformClass}`}>{platform}</span><span className="watch-empty">Estreia em {weeklyHighlight.estreia}</span></>
              : <span className={`watch-chip st-${platformClass}`}>{platform}</span>}
          {availabilityError ? <span className="watch-empty">Disponibilidade ainda não atualizada</span> : null}
        </div>
      </div>
      <Link className="weekly-poster" href={`/titulo/${slug}`} aria-label={`Abrir ${title}`}>
        {poster ? <img src={poster} alt={title} /> : <span>{title.slice(0, 3).toUpperCase()}</span>}
      </Link>
    </section>
  );
}
