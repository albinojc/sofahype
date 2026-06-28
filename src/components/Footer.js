import Link from 'next/link';

export default function Footer() {
  return (
    <>
      <footer>
        <div>
          <div className="footer-logo">🛋 SOFÁ <span>HYPE</span></div>
          <p className="footer-desc">O guia brasileiro de filmes e séries. Notas, streamings e curadoria para decidir melhor o que assistir.</p>
        </div>
        <div>
          <div className="footer-col-title">Streamings</div>
          <ul className="footer-links">
            <li><Link href="/streamings/netflix">Netflix</Link></li>
            <li><Link href="/streamings/hbo-max">HBO Max</Link></li>
            <li><Link href="/streamings/prime-video">Prime Video</Link></li>
            <li><Link href="/streamings/disney-plus">Disney+</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Navegar</div>
          <ul className="footer-links">
            <li><Link href="/filmes">Melhores Filmes</Link></li>
            <li><Link href="/series">Melhores Séries</Link></li>
            <li><Link href="/#rankings">Rankings</Link></li>
          </ul>
        </div>
      </footer>
      <div className="footer-bottom">© 2026 SofáHype · O guia brasileiro para decidir o que assistir.</div>
    </>
  );
}
