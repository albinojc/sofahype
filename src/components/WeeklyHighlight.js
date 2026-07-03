import Link from 'next/link';
import HypometroIcon from './HypometroIcon';
import { formatScore, getCatalog, getHypometro, getPlatformClass, getScoreClass, slugify } from '../lib/catalog';
import { weeklyHighlight } from '../data/weeklyHighlight';

function findHighlightItem() {
  const catalog = getCatalog();
  const aliases = [weeklyHighlight.slug, weeklyHighlight.titulo, weeklyHighlight.titulo_original, 'Devoradores de Galáxias'];
  return catalog.find((item) => {
    const values = [item.slug, item.titulo, item.titulo_original, ...(item.aliases || [])].filter(Boolean);
    return values.some((value) => aliases.some((alias) => slugify(value) === slugify(alias)));
  });
}

export default function WeeklyHighlight({ compact = false }) {
  const item = findHighlightItem();
  const title = item?.titulo || weeklyHighlight.titulo;
  const slug = item?.slug || weeklyHighlight.slug;
  const score = Number(item?.nota_sofahype || weeklyHighlight.nota_sofahype);
  const critics = Number(item?.nota_critica || weeklyHighlight.nota_critica);
  const audience = Number(item?.nota_publico || weeklyHighlight.nota_publico);
  const hypo = getHypometro(score);
  const platform = weeklyHighlight.plataforma;
  const platformClass = getPlatformClass(platform);
  const poster = item?.poster_url;
  const backdrop = item?.backdrop_url;

  return (
    <section className={compact ? 'weekly-highlight weekly-highlight-compact' : 'weekly-highlight'}>
      <div className="weekly-highlight-bg" style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined} />
      <div className="weekly-copy">
        <div className="weekly-label">{weeklyHighlight.label}</div>
        <h2>{title}</h2>
        <p>{weeklyHighlight.chamada}</p>
        <div className="weekly-metrics" aria-label="Notas do destaque da semana">
          <span className={`weekly-score-box score-box-${getScoreClass(score)}`}><strong>{formatScore(score)}</strong><small>Nota SofáHype</small></span>
          <span className={`weekly-hypo hype-${hypo.classe}`}><HypometroIcon variant={hypo.classe} size={42} /> {hypo.nome}</span>
          <span className={`weekly-score-box score-box-${getScoreClass(critics)}`}><strong>{formatScore(critics)}</strong><small>Crítica</small></span>
          <span className={`weekly-score-box score-box-${getScoreClass(audience)}`}><strong>{formatScore(audience)}</strong><small>Público</small></span>
        </div>
        <div className="weekly-actions">
          <Link className="btn-primary" href={`/titulo/${slug}`}>Ver crítica</Link>
          <span className={`watch-chip st-${platformClass}`}>{platform}</span>
        </div>
      </div>
      <Link className="weekly-poster" href={`/titulo/${slug}`} aria-label={`Abrir ${title}`}>
        {poster ? <img src={poster} alt={title} /> : <span>{title.slice(0, 3).toUpperCase()}</span>}
      </Link>
    </section>
  );
}
