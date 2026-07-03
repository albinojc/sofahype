import Link from 'next/link';
import { formatScore, getHypometro, getPlatformClass, getPrimaryPlatform, getScoreClass } from '../lib/catalog';
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

export default function TitleCard({ item, platformContext = null }) {
  const hypo = getHypometro(item.nota_sofahype);
  // Em páginas específicas de streaming, o selo do card deve representar
  // a plataforma da página, não a primeira plataforma cadastrada no título.
  const platform = platformContext || getPrimaryPlatform(item);
  const platformClass = getPlatformClass(platform);

  return (
    <Link className="card" href={`/titulo/${item.slug || item.id}`}>
      <div className={`card-thumb t${(item.nota_sofahype % 6) + 1}`}>
        {item.poster_url ? <img src={item.poster_url} alt={item.titulo} /> : <span>{initials(item.titulo)}</span>}
        <div className={`score-badge score-${getScoreClass(item.nota_sofahype)}`}>{formatScore(item.nota_sofahype)}</div>
        <div className={`stream-dot s-${platformClass}`}>{platform[0]}</div>
      </div>
      <div className="card-body">
        <div className="card-title">{item.titulo}</div>
        <div className="card-info">{item.ano} · {item.generos?.[0]} · {item.duracao}</div>
        <div className="card-footer">
          <span className={`mini-score mini-score-${getScoreClass(item.nota_publico)}`}><span>Público</span><strong>{formatScore(item.nota_publico)}</strong></span>
          <span className={`hype-tag hype-${hypo.classe}`}><HypometroIcon variant={hypo.classe} size={22} /><span>{hypo.curto}</span></span>
        </div>
      </div>
    </Link>
  );
}
