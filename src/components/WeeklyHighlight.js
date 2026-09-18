import Link from 'next/link';
import HypometroIcon from './HypometroIcon';
import WeeklyHighlightCarousel from './WeeklyHighlightCarousel';
import { formatAvailabilityStart, formatScore, getFullCatalog, getHypometro, getPlatformClass, getScoreClass, slugify } from '../lib/catalog';
import { weeklyHighlight, weeklyHighlights } from '../data/weeklyHighlight';

function findConfiguredItem(catalog, config) {
  const aliases = [config.slug, config.titulo, config.titulo_original, ...(config.aliases || [])].filter(Boolean);
  return catalog.find((item) => {
    const values = [item.slug, item.titulo, item.titulo_original, ...(item.aliases || [])].filter(Boolean);
    return values.some((value) => aliases.some((alias) => slugify(value) === slugify(alias)));
  });
}

function resolveSlide(item, config, index) {
  const rawScore = item.nota_sofahype ?? config.nota_sofahype;
  const rawCritics = item.nota_critica ?? config.nota_critica;
  const rawAudience = item.nota_publico ?? config.nota_publico;
  const score = Number(rawScore) > 0 ? Number(rawScore) : null;
  const critics = Number(rawCritics) > 0 ? Number(rawCritics) : null;
  const audience = Number(rawAudience) > 0 ? Number(rawAudience) : null;
  const hypo = score ? getHypometro(score) : null;
  const platform = item.plataformas?.[0] || config.plataforma;
  const upcoming = item.status_disponibilidade === 'em_breve';

  return {
    key: item.id || config.slug,
    index,
    slug: item.slug || config.slug,
    title: config.titulo || item.titulo,
    label: config.label,
    callout: config.chamada,
    complement: config.complemento || null,
    platform,
    platformClass: getPlatformClass(platform),
    hasConfirmedPlatform: Boolean(item.plataformas?.length),
    metadata: [item.ano, item.duracao, item.classificacao_etaria ? `${item.classificacao_etaria} anos` : null].filter(Boolean),
    heroImage: config.hero_image || item.backdrop_url || null,
    heroImageMobile: config.hero_image_mobile || null,
    heroPosition: config.hero_position || 'center 42%',
    heroPositionMobile: config.hero_position_mobile || 'center top',
    score: score ? { value: formatScore(score), scoreClass: getScoreClass(score) } : null,
    critics: critics ? { value: formatScore(critics), scoreClass: getScoreClass(critics) } : null,
    audience: audience ? { value: formatScore(audience) } : null,
    hypo: hypo ? { name: hypo.nome, className: hypo.classe } : null,
    unavailable: item.status_disponibilidade === 'sem_plataforma_monitorada',
    upcoming,
    availabilityStart: upcoming ? formatAvailabilityStart(item.data_lancamento) : null,
    availabilityError: item.verificacao_disponibilidade === 'erro'
  };
}

function CompactHighlight({ slide }) {
  return (
    <div className="weekly-feature weekly-feature-compact">
      <section className="weekly-highlight weekly-highlight-compact">
        <div className="weekly-highlight-bg" aria-hidden="true">
          {slide.heroImage || slide.heroImageMobile ? (
            <picture>
              {slide.heroImageMobile ? <source media="(max-width: 760px)" srcSet={slide.heroImageMobile} /> : null}
              <img src={slide.heroImage} alt="" style={{ '--hero-position': slide.heroPosition, '--hero-position-mobile': slide.heroPositionMobile }} />
            </picture>
          ) : null}
        </div>
        <div className="weekly-copy">
          <div className="weekly-label">DESTAQUE DA SEMANA</div>
          <h2>{slide.title}</h2>
          <p>{slide.callout}</p>
          <div className="weekly-meta" aria-label="Informações do destaque">
            {slide.hasConfirmedPlatform ? <span className={`watch-chip st-${slide.platformClass}`}>{slide.platform}</span> : null}
            {slide.metadata.map((entry) => <span key={entry}>{entry}</span>)}
          </div>
          {slide.score || slide.critics || slide.audience ? (
            <div className="weekly-metrics" aria-label="Notas do destaque da semana">
              {slide.score ? <span className={`weekly-score-box score-box-${slide.score.scoreClass}`}><strong>{slide.score.value}</strong><small>Nota SofáHype</small></span> : null}
              {slide.hypo ? <span className={`weekly-hypo hype-${slide.hypo.className}`}><HypometroIcon variant={slide.hypo.className} size={42} /> {slide.hypo.name}</span> : null}
              {slide.critics ? <span className={`weekly-score-box score-box-${slide.critics.scoreClass}`}><strong>{slide.critics.value}</strong><small>Crítica</small></span> : null}
              {slide.audience ? <span className="weekly-score-box score-publico"><strong>{slide.audience.value}</strong><small>Público</small></span> : null}
            </div>
          ) : null}
          <div className="weekly-actions"><Link className="btn-primary" href={`/titulo/${slide.slug}`}>Ver detalhes</Link></div>
        </div>
      </section>
    </div>
  );
}

export default function WeeklyHighlight({ compact = false }) {
  const catalog = getFullCatalog();
  const configs = compact ? [weeklyHighlight] : weeklyHighlights;
  const slides = configs
    .map((config, index) => {
      const item = findConfiguredItem(catalog, config);
      return item ? resolveSlide(item, config, index) : null;
    })
    .filter(Boolean);

  if (!slides.length) return null;
  if (compact) return <CompactHighlight slide={slides[0]} />;
  return <WeeklyHighlightCarousel slides={slides} />;
}
