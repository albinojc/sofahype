import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="not-found-page">
        <div className="empty-search-state not-found-card">
          <img src="/assets/sofa-vacilei.png" alt="SofáHype não encontrou essa página" />
          <div>
            <h2>Vacilei!</h2>
            <p>
              Parece que ainda não temos o título que você tava procurando. Mas olha só, a gente vai correr pra deixar seu sofá preferido cada vez mais do seu jeito!
            </p>
            <Link className="btn-ver-todos" href="/">Voltar para a primeira página</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
