import TitleCard from './TitleCard';

export default function TitleGrid({ items }) {
  if (!items.length) {
    return <p className="empty">Nenhum título encontrado por enquanto.</p>;
  }

  return (
    <div className="grid">
      {items.map((item) => <TitleCard key={item.id} item={item} />)}
    </div>
  );
}
