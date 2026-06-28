import Link from 'next/link';
import { streamings } from '../lib/catalog';

export default function Header() {
  return (
    <>
      <nav className="nav">
        <Link className="logo" href="/">
          <span className="logo-icon">🛋</span>
          SOFÁ <span className="logo-hype">HYPE</span>
        </Link>
        <ul className="nav-links">
          <li><Link href="/filmes">Filmes</Link></li>
          <li><Link href="/series">Séries</Link></li>
          <li><Link href="/#rankings">Rankings</Link></li>
          <li><Link href="/#streamings">Streamings</Link></li>
        </ul>
      </nav>

      <div className="streaming-bar" id="streamings">
        <span className="streaming-label">Streaming:</span>
        {streamings.map((streaming) => (
          <Link key={streaming.slug} className={`s-chip s-${streaming.classe}`} href={`/streamings/${streaming.slug}`}>
            {streaming.nome}
          </Link>
        ))}
      </div>
    </>
  );
}
