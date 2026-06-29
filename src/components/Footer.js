import Link from 'next/link';

export default function Footer() {
  return (
    <>
      <footer>
        <div>
          <Link className="footer-logo footer-logo-image" href="/" aria-label="SofáHype">
            <img src="/assets/logo-sofahype.png" alt="SofáHype" />
          </Link>
          <p className="footer-desc">O guia brasileiro de filmes e séries. Notas, streamings e curadoria para decidir melhor o que assistir.</p>
          <p className="footer-note">Dados e imagens fornecidos por TMDb. Este produto utiliza a API do TMDb, mas não é endossado ou certificado pelo TMDb.</p>
        </div>
        <div>
          <div className="footer-col-title">Streamings</div>
          <ul className="footer-links">
            <li><Link href="/streamings/netflix">Netflix</Link></li>
            <li><Link href="/streamings/hbo-max">HBO Max</Link></li>
            <li><Link href="/streamings/prime-video">Prime Video</Link></li>
            <li><Link href="/streamings/disney-plus">Disney+</Link></li>
            <li><Link href="/streamings/globoplay">Globoplay</Link></li>
            <li><Link href="/streamings/apple-tv-plus">Apple TV+</Link></li>
            <li><Link href="/streamings/paramount-plus">Paramount+</Link></li>
            <li><Link href="/streamings/hulu">Hulu</Link></li>
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
