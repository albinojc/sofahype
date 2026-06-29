import TitleCard from './TitleCard';

export default function TitleGrid({ items, platformContext = null, emptyMessage = 'Nenhum título encontrado por enquanto.' }) {
  if (!items.length) {
    return <p className="empty">{emptyMessage}</p>;
  }

  return (
    <div className="grid">
      {items.map((item) => <TitleCard key={item.id} item={item} platformContext={platformContext} />)}
    </div>
  );
}
