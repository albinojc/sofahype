import { redirect } from 'next/navigation';

export default async function OldStreamingUrl({ params }) {
  const { slug } = await params;
  redirect(`/streamings/${slug}`);
}
