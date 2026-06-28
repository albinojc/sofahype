import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import TitleGrid from '../../../components/TitleGrid';
import { getTitlesByStreaming, streamings } from '../../../lib/catalog';

export const dynamicParams = false;

export function generateStaticParams() {
  return streamings.map((streaming) => ({ slug: streaming.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const streaming = streamings.find((s) => s.slug === slug);
  return { title: `${streaming?.nome || 'Streaming'} | SofáHype` };
}

export default async function StreamingPage({ params }) {
  const { slug } = await params;
  const streaming = streamings.find((s) => s.slug === slug);
  if (!streaming) notFound();

  const items = getTitlesByStreaming(slug);
  return (
    <>
      <Header />
      <section className="page-hero">
        <h1>{streaming.nome}</h1>
        <p>Filmes e séries bem avaliados disponíveis neste streaming.</p>
      </section>
      <section className="section">
        <TitleGrid items={items} />
      </section>
      <Footer />
    </>
  );
}
