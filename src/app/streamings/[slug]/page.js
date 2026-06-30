import { notFound, redirect } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import TitleGrid from '../../../components/TitleGrid';
import { canonicalStreamingSlug, getTitlesByStreaming, streamings, streamingSlugAliases } from '../../../lib/catalog';

export const dynamicParams = false;

export function generateStaticParams() {
  const canonical = streamings.map((streaming) => ({ slug: streaming.slug }));
  const aliases = Object.keys(streamingSlugAliases).map((slug) => ({ slug }));
  return [...canonical, ...aliases];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const canonicalSlug = canonicalStreamingSlug(slug);
  const streaming = streamings.find((s) => s.slug === canonicalSlug);
  return { title: `${streaming?.nome || 'Streaming'} | SofáHype` };
}

export default async function StreamingPage({ params }) {
  const { slug } = await params;
  const canonicalSlug = canonicalStreamingSlug(slug);
  if (canonicalSlug !== slug) redirect(`/streamings/${canonicalSlug}`);

  const streaming = streamings.find((s) => s.slug === canonicalSlug);
  if (!streaming) notFound();

  const items = getTitlesByStreaming(canonicalSlug);
  const isHulu = streaming.slug === 'hulu';

  return (
    <>
      <Header />
      <section className="page-hero">
        <h1>{streaming.nome}</h1>
        <p>Filmes e séries bem avaliados disponíveis neste streaming.</p>
      </section>
      <section className="section">
        <TitleGrid
          items={items}
          platformContext={streaming.nome}
          emptyMessage={isHulu
            ? 'Ainda não encontramos títulos do Hulu no recorte atual do catálogo. Como a disponibilidade por país pode variar, o SofáHype só vai mostrar aqui títulos que a fonte de dados retornar com segurança.'
            : `Ainda não encontramos títulos de ${streaming.nome} no recorte atual do catálogo. O importador vai tentar trazer mais opções nas próximas atualizações.`}
        />
      </section>
      <Footer />
    </>
  );
}
