import Link from 'next/link';
import { getHypometro, getPlatformClass, getPrimaryPlatform } from '../lib/catalog';

export default function Ranking({ items }) {
  return (
    <div className="ranking">
      {items.slice(0, 8).map((item, index) => {
        const hypo = getHypometro(item.nota_sofahype);
        const platform = getPrimaryPlatform(item);
        return (
          <Link className="rank-row" href={`/titulo/${item.id}`} key={item.id}>
            <div className="rank-num">{index + 1}</div>
            <div className={`rank-thumb t${(index % 6) + 1}`}>{item.titulo.slice(0,3).toUpperCase()}</div>
            <div className="rank-info">
              <div className="rank-title">{item.titulo}</div>
              <div className="rank-meta"><span className={`st st-${getPlatformClass(platform)}`}>{platform}</span> · {item.generos?.[0]} · {item.ano}</div>
            </div>
            <div className="rank-right">
              <div className={`score-badge score-${hypo.classe} static`}>{item.nota_sofahype}%</div>
              <div className="hype-bar-wrap"><div className="hype-bar" style={{ width: `${item.nota_sofahype}%` }} /></div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
