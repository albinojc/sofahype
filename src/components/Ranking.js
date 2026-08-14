import Link from 'next/link';
import { formatAvailabilityStart, formatScore, getPlatformClass, getPrimaryPlatform, getScoreClass } from '../lib/catalog';

export default function Ranking({ items, limit = 8 }) {
  return (
    <div className="ranking">
      {items.slice(0, limit ?? items.length).map((item, index) => {
        const platform = getPrimaryPlatform(item);
        const upcoming = item.status_disponibilidade === 'em_breve';
        const availabilityStart = formatAvailabilityStart(item.data_lancamento);
        return (
          <Link className="rank-row" href={`/titulo/${item.slug || item.id}`} key={item.id}>
            <div className="rank-num">{index + 1}</div>
            <div className={`rank-thumb t${(index % 6) + 1}`}>
              {item.poster_url ? <img src={item.poster_url} alt={item.titulo} /> : <span>{item.titulo.slice(0,3).toUpperCase()}</span>}
            </div>
            <div className="rank-info">
              <div className="rank-title">{item.titulo}</div>
              <div className="rank-meta"><span className={`st st-${getPlatformClass(platform)}`}>{platform}</span> · {item.generos?.[0]} · {item.ano}</div>
            </div>
            <div className="rank-right">
              {upcoming ? <span className="availability-upcoming">{availabilityStart}</span> : <>
                <div className={`score-badge score-${getScoreClass(item.nota_sofahype)} static`}>{formatScore(item.nota_sofahype)}</div>
                <div className="hype-bar-wrap"><div className="hype-bar" style={{ width: `${item.nota_sofahype}%` }} /></div>
              </>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
