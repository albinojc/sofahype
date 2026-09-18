'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import HypometroIcon from './HypometroIcon';

const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD = 45;

function Slide({ slide, active, position, total, priority = false }) {
  return (
    <article
      className="weekly-highlight weekly-carousel-slide"
      role="group"
      aria-roledescription="slide"
      aria-label={`${position} de ${total}`}
      aria-hidden={!active}
      inert={active ? undefined : ''}
    >
      <div className="weekly-highlight-bg" aria-hidden="true">
        {slide.heroImage || slide.heroImageMobile ? (
          <picture>
            {slide.heroImageMobile ? <source media="(max-width: 760px)" srcSet={slide.heroImageMobile} /> : null}
            <img
              src={slide.heroImage}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              style={{ '--hero-position': slide.heroPosition, '--hero-position-mobile': slide.heroPositionMobile }}
            />
          </picture>
        ) : null}
      </div>
      <div className="weekly-copy">
        <div className="weekly-label">{slide.label}</div>
        <h2>{slide.title}</h2>
        {slide.complement ? <span className="weekly-complement">{slide.complement}</span> : null}
        <p>{slide.callout}</p>
        <div className="weekly-meta" aria-label="Informações do destaque">
          {slide.hasConfirmedPlatform ? <span className={`watch-chip st-${slide.platformClass}`}>{slide.platform}</span> : null}
          {slide.metadata.map((entry) => <span key={entry}>{entry}</span>)}
        </div>
        {slide.score || slide.critics || slide.audience ? (
          <div className="weekly-metrics" aria-label="Notas do destaque">
            {slide.score ? <span className={`weekly-score-box score-box-${slide.score.scoreClass}`}><strong>{slide.score.value}</strong><small>Nota SofáHype</small></span> : null}
            {slide.hypo ? <span className={`weekly-hypo hype-${slide.hypo.className}`}><HypometroIcon variant={slide.hypo.className} size={42} /> {slide.hypo.name}</span> : null}
            {slide.critics ? <span className={`weekly-score-box score-box-${slide.critics.scoreClass}`}><strong>{slide.critics.value}</strong><small>Crítica</small></span> : null}
            {slide.audience ? <span className="weekly-score-box score-publico"><strong>{slide.audience.value}</strong><small>Público</small></span> : null}
          </div>
        ) : null}
        <div className="weekly-actions">
          <Link className="btn-primary" href={`/titulo/${slide.slug}`}>Ver detalhes</Link>
          {slide.unavailable ? <span className="watch-empty">Sem plataforma monitorada no momento</span>
            : slide.upcoming && slide.hasConfirmedPlatform && slide.availabilityStart ? <span className="watch-empty">{slide.availabilityStart}</span>
              : slide.upcoming ? <span className="watch-empty">Ainda não chegou. A gente fica de olho.</span>
                : null}
          {slide.availabilityError ? <span className="watch-empty">Disponibilidade ainda não atualizada</span> : null}
        </div>
      </div>
    </article>
  );
}

export default function WeeklyHighlightCarousel({ slides }) {
  const total = slides.length;
  const trackSlides = useMemo(() => total > 1 ? [slides[total - 1], ...slides, slides[0]] : slides, [slides, total]);
  const [trackIndex, setTrackIndex] = useState(total > 1 ? 1 : 0);
  const [transitioning, setTransitioning] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [interactionTick, setInteractionTick] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const touchStart = useRef(null);

  const activeIndex = total > 1 ? (trackIndex - 1 + total) % total : 0;

  const move = useCallback((direction, manual = false) => {
    if (total < 2) return;
    setTransitioning(true);
    setTrackIndex((current) => current + direction);
    if (manual) {
      const next = (activeIndex + direction + total) % total;
      setAnnouncement(`${slides[next].title}, slide ${next + 1} de ${total}`);
      setInteractionTick((value) => value + 1);
    }
  }, [activeIndex, slides, total]);

  const goTo = useCallback((index) => {
    if (index === activeIndex || total < 2) return;
    setTransitioning(true);
    setTrackIndex(index + 1);
    setAnnouncement(`${slides[index].title}, slide ${index + 1} de ${total}`);
    setInteractionTick((value) => value + 1);
  }, [activeIndex, slides, total]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setHidden(document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (total < 2 || paused || hidden || reducedMotion) return undefined;
    const timer = window.setTimeout(() => move(1, false), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [hidden, interactionTick, move, paused, reducedMotion, total, trackIndex]);

  const handleTransitionEnd = () => {
    if (total < 2) return;
    if (trackIndex === 0) {
      setTransitioning(false);
      setTrackIndex(total);
    } else if (trackIndex === total + 1) {
      setTransitioning(false);
      setTrackIndex(1);
    }
  };

  useEffect(() => {
    if (!transitioning) {
      const frame = requestAnimationFrame(() => setTransitioning(true));
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [transitioning]);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1, true); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1, true); }
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    setPaused(true);
  };

  const handleTouchEnd = (event) => {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    setPaused(false);
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1, true);
  };

  return (
    <section
      className="weekly-feature weekly-carousel"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques da semana"
      tabIndex="0"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="weekly-carousel-viewport">
        <div
          className={`weekly-carousel-track${transitioning && !reducedMotion ? ' is-animated' : ''}`}
          style={{ transform: `translate3d(-${trackIndex * 100}%, 0, 0)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {trackSlides.map((slide, index) => {
            const logicalIndex = total > 1 ? (index - 1 + total) % total : 0;
            return <Slide key={`${slide.key}-${index}`} slide={slide} active={index === trackIndex} position={logicalIndex + 1} total={total} priority={index === 1} />;
          })}
        </div>
      </div>

      {total > 1 ? (
        <>
          <button className="weekly-carousel-arrow weekly-carousel-prev" type="button" aria-label="Destaque anterior" onClick={() => move(-1, true)}>‹</button>
          <button className="weekly-carousel-arrow weekly-carousel-next" type="button" aria-label="Próximo destaque" onClick={() => move(1, true)}>›</button>
          <div className="weekly-carousel-dots" aria-label="Escolher destaque">
            {slides.map((slide, index) => (
              <button
                key={slide.key}
                type="button"
                aria-label={`Ir para ${slide.title}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      ) : null}
      <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
    </section>
  );
}
