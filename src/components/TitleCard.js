import Link from 'next/link';
import { formatAvailabilityStart, formatScore, getHypometro, getPlatformClass, getPrimaryPlatform, getScoreClass } from '../lib/catalog';
import HypometroIcon from './HypometroIcon';

function initials(title) {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function TitleCard({ item, platformContext = null, showPlatformBadge = true }) {
  const score = Number(item.nota_sofahype);
  const audience = Number(item.nota_publico);
  const hasScore = Number.isFinite(score) && score > 0;
  const hasAudience = Number.isFinite(audience) && audience > 0;
  const hypo = hasScore ? getHypometro(score) : null;
  // Em páginas específicas de streaming, o selo do card deve representar
  // a plataforma da página, não a primeira plataforma cadastrada no título.
  const platform = platformContext || getPrimaryPlatform(item);
  const platformClass = getPlatformClass(platform);
  const upcoming = item.status_disponibilidade === 'em_breve';
  const availabilityStart = formatAvailabilityStart(item.data_lancamento);

  return (
    <Link className="card" href={`/titulo/${item.slug || item.id}`}>
      <div className={`card-thumb t${(item.nota_sofahype % 6) + 1}`}>
        {item.poster_url ? <img src={item.poster_url} alt={item.titulo} /> : <span>{initials(item.titulo)}</span>}
        {!upcoming && hasScore ? <div className={`score-badge score-${getScoreClass(score)}`}>{formatScore(score)}</div> : null}
        {showPlatformBadge ? <div className={`stream-dot s-${platformClass}`}>{platform[0]}</div> : null}
      </div>
      <div className="card-body">
        <div className="card-title">{item.titulo}</div>
        <div className="card-info">{item.ano} · {item.generos?.[0]} · {item.duracao}</div>
        <div className="card-footer">
          {upcoming ? <span className="availability-upcoming">{availabilityStart}</span>
            : hasScore || hasAudience ? <>
              {hasAudience ? <span className="mini-score score-publico"><span>Público</span><strong>{formatScore(audience)}</strong></span> : null}
              {hasScore ? <span className={`hype-tag hype-${hypo.classe}`}><HypometroIcon variant={hypo.classe} size={22} /><span>{hypo.curto}</span></span> : null}
            </>
              : <span className="availability-upcoming">Notas em breve</span>}
        </div>
      </div>
    </Link>
  );
}
