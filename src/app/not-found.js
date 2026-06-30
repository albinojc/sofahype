import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchEmptyState from '../components/SearchEmptyState';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="not-found-page">
        <SearchEmptyState className="not-found-card" />
      </main>
      <Footer />
    </>
  );
}
