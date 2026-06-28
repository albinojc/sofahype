import Link from 'next/link';
import { getHypometro, getPlatformClass, getPrimaryPlatform } from '../lib/catalog';

function initials(title) {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function TitleCard({ item }) {
  const hypo = getHypometro(item.nota_sofahype);
  const platform = getPrimaryPlatform(item);
  const platformClass = getPlatformClass(platform);

  return (
    <Link className="card" href={`/titulo/${item.slug || item.id}`}>
      <div className={`card-thumb t${(item.nota_sofahype % 6) + 1}`}>
        {item.poster_url ? <img src={item.poster_url} alt={item.titulo} /> : <span>{initials(item.titulo)}</span>}
        <div className={`score-badge score-${hypo.classe}`}>{item.nota_sofahype}%</div>
        <div className={`stream-dot s-${platformClass}`}>{platform[0]}</div>
      </div>
      <div className="card-body">
        <div className="card-title">{item.titulo}</div>
        <div className="card-info">{item.ano} · {item.generos?.[0]} · {item.duracao}</div>
        <div className="card-footer">
          <span className="audience">👥 {item.nota_publico}%</span>
          <span className="hype-tag">{hypo.emoji} {hypo.nome}</span>
        </div>
      </div>
    </Link>
  );
}
